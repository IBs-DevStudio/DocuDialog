import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embeddings";

const PINECONE_INDEX = process.env.PINECONE_INDEX || "docudialog";
const TOP_K = 5;
const SIMILARITY_THRESHOLD = 0.7;
const MAX_CONTEXT_LENGTH = 3000;

// ─── Types ───────────────────────────────────────────────────────────────────

type Metadata = {
  text: string;
  pageNumber: number;
};

type ContextMatch = {
  text: string;
  pageNumber: number;
  score: number;
};

// ─── Singleton Client ────────────────────────────────────────────────────────

let pineconeClient: Pinecone | null = null;

function getPineconeClient(): Pinecone {
  if (pineconeClient) return pineconeClient;

  if (!process.env.PINECONE_API_KEY) {
    throw new Error("Missing required environment variable: PINECONE_API_KEY");
  }

  pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  return pineconeClient;
}

// ─── Get Matches ─────────────────────────────────────────────────────────────

export async function getMatchesFromEmbeddings(
  embeddings: number[],
  fileKey: string
): Promise<ContextMatch[]> {
  if (!Array.isArray(embeddings) || embeddings.length === 0) {
    throw new Error("Invalid embeddings: must be a non-empty array");
  }
  if (!fileKey || typeof fileKey !== "string") {
    throw new Error("Invalid fileKey provided");
  }

  try {
    const client = getPineconeClient();
    const pineconeIndex = client.index(PINECONE_INDEX);
    const namespace = pineconeIndex.namespace(convertToAscii(fileKey));

    const queryResult = await namespace.query({
      topK: TOP_K,
      vector: embeddings,
      includeMetadata: true,
    });

    const matches = queryResult.matches || [];
    console.log(`[context] Found ${matches.length} matches for fileKey: ${fileKey}`);

    return matches
      .filter((match) => match.metadata && match.score !== undefined)
      .map((match) => ({
        text: (match.metadata as Metadata).text,
        pageNumber: (match.metadata as Metadata).pageNumber,
        score: match.score!,
      }));

  } catch (error: any) {
    console.error("[context] Error querying Pinecone:", error?.message);
    throw new Error("Failed to query Pinecone. Please try again.");
  }
}

// ─── Get Context ─────────────────────────────────────────────────────────────

export async function getContext(
  query: string,
  fileKey: string
): Promise<string> {
  if (!query || typeof query !== "string" || query.trim() === "") {
    throw new Error("Invalid query: must be a non-empty string");
  }

  console.log(`[context] Getting context for query: "${query.slice(0, 60)}..."`);

  const queryEmbeddings = await getEmbeddings(query);
  const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey);

  // Filter by similarity threshold
  const qualifyingDocs = matches.filter(
    (match) => match.score >= SIMILARITY_THRESHOLD
  );

  if (qualifyingDocs.length === 0) {
    console.warn(`[context] No matches above threshold ${SIMILARITY_THRESHOLD} for query: "${query.slice(0, 60)}"`);
    return "";
  }

  // Sort by score descending — best matches first
  const sorted = qualifyingDocs.sort((a, b) => b.score - a.score);

  // Log match quality
  sorted.forEach((doc, i) => {
    console.log(`[context] Match ${i + 1}: page ${doc.pageNumber}, score ${doc.score.toFixed(3)}`);
  });

  const context = sorted
    .map((doc) => doc.text)
    .join("\n")
    .substring(0, MAX_CONTEXT_LENGTH);

  console.log(`[context] Returning ${context.length} chars of context`);
  return context;
}