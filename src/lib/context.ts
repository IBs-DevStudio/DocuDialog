import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embeddings";

// ─── Constants ───────────────────────────────────────────────────────────────

const CONFIG = {
  INDEX: process.env.PINECONE_INDEX || "docudialog",
  TOP_K: 5,
  SIMILARITY_THRESHOLD: 0.7,
  MAX_CONTEXT_LENGTH: 3000,
};

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

  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing PINECONE_API_KEY");
  }

  pineconeClient = new Pinecone({ apiKey });
  return pineconeClient;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidEmbeddings(embeddings: number[]): boolean {
  return Array.isArray(embeddings) && embeddings.length > 0;
}

function formatMatches(matches: any[]): ContextMatch[] {
  return matches
    .filter((m) => m?.metadata && typeof m.score === "number")
    .map((m) => {
      const metadata = m.metadata as Metadata;
      return {
        text: metadata.text,
        pageNumber: metadata.pageNumber,
        score: m.score,
      };
    });
}

// ─── Get Matches ─────────────────────────────────────────────────────────────

export async function getMatchesFromEmbeddings(
  embeddings: number[],
  fileKey: string
): Promise<ContextMatch[]> {
  if (!isValidEmbeddings(embeddings)) {
    throw new Error("Embeddings must be a non-empty array");
  }

  if (!fileKey || typeof fileKey !== "string") {
    throw new Error("Invalid fileKey");
  }

  try {
    const client = getPineconeClient();
    const namespace = client
      .index(CONFIG.INDEX)
      .namespace(convertToAscii(fileKey));

    const { matches = [] } = await namespace.query({
      topK: CONFIG.TOP_K,
      vector: embeddings,
      includeMetadata: true,
    });

    console.log(`[context] Retrieved ${matches.length} raw matches`);

    return formatMatches(matches);
  } catch (err: any) {
    console.error("[context] Pinecone query failed:", err?.message || err);
    throw new Error("Pinecone query failed");
  }
}

// ─── Get Context ─────────────────────────────────────────────────────────────

export async function getContext(
  query: string,
  fileKey: string
): Promise<string> {
  if (!query?.trim()) {
    throw new Error("Query must be a non-empty string");
  }

  console.log(`[context] Processing query → "${query.slice(0, 50)}..."`);

  const embeddings = await getEmbeddings(query);
  const matches = await getMatchesFromEmbeddings(embeddings, fileKey);

  const filtered = matches.filter(
    (m) => m.score >= CONFIG.SIMILARITY_THRESHOLD
  );

  if (!filtered.length) {
    console.warn("[context] No relevant matches found");
    return "";
  }

  const sorted = filtered.sort((a, b) => b.score - a.score);

  sorted.forEach((doc, idx) => {
    console.log(
      `[context] #${idx + 1} → page ${doc.pageNumber}, score ${doc.score.toFixed(
        3
      )}`
    );
  });

  const context = sorted
    .map((d) => d.text)
    .join("\n")
    .slice(0, CONFIG.MAX_CONTEXT_LENGTH);

  console.log(`[context] Final context length: ${context.length}`);

  return context;
}