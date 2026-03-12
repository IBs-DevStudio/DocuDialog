import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import md5 from "md5";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./embeddings";
import { convertToAscii } from "./utils";

const PINECONE_INDEX = process.env.PINECONE_INDEX || "docudialog";
const BATCH_SIZE = 10; // upsert in batches to avoid rate limits
const MAX_BYTES = 36000;

// ─── Pinecone Client ────────────────────────────────────────────────────────

let pineconeClient: Pinecone | null = null;

export const getPineconeClient = (): Pinecone => {
  if (pineconeClient) return pineconeClient;

  if (!process.env.PINECONE_API_KEY) {
    throw new Error("Missing required environment variable: PINECONE_API_KEY");
  }

  pineconeClient = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  return pineconeClient;
};

// ─── Types ──────────────────────────────────────────────────────────────────

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

// ─── Main Pipeline ──────────────────────────────────────────────────────────

export async function loadS3IntoPinecone(fileKey: string): Promise<Document[]> {
  if (!fileKey || typeof fileKey !== "string") {
    throw new Error("Invalid fileKey provided to loadS3IntoPinecone");
  }

  // 1. Download PDF from S3
  console.log("[pinecone] Downloading from S3:", fileKey);
  const file_name = await downloadFromS3(fileKey);
  if (!file_name) {
    throw new Error("Could not download file from S3");
  }

  // 2. Load and parse PDF
  console.log("[pinecone] Loading PDF:", file_name);
  const loader = new PDFLoader(file_name);
  const pages = (await loader.load()) as PDFPage[];

  if (!pages || pages.length === 0) {
    throw new Error("PDF appears to be empty or could not be parsed");
  }
  console.log(`[pinecone] Loaded ${pages.length} pages`);

  // 3. Split pages into chunks
  const documents = (await Promise.all(pages.map(prepareDocument))).flat();
  console.log(`[pinecone] Split into ${documents.length} chunks`);

  // 4. Embed documents
  console.log("[pinecone] Generating embeddings...");
  const vectors = await embedDocumentsInBatches(documents);
  console.log(`[pinecone] Generated ${vectors.length} vectors`);

  // 5. Upsert into Pinecone in batches
  const client = getPineconeClient();
  const pineconeIndex = client.index(PINECONE_INDEX);
  const namespace = pineconeIndex.namespace(convertToAscii(fileKey));

  console.log(`[pinecone] Upserting ${vectors.length} vectors in batches of ${BATCH_SIZE}...`);
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE);
    await namespace.upsert(batch);
    console.log(`[pinecone] Upserted batch ${Math.ceil((i + 1) / BATCH_SIZE)} / ${Math.ceil(vectors.length / BATCH_SIZE)}`);
  }

  console.log("[pinecone] Successfully loaded into Pinecone");
  return documents;
}

// ─── Batch Embedding ────────────────────────────────────────────────────────

async function embedDocumentsInBatches(
  docs: Document[]
): Promise<PineconeRecord[]> {
  const results: PineconeRecord[] = [];

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    const embedded = await Promise.all(batch.map(embedDocument));
    results.push(...embedded);
  }

  return results;
}

// ─── Embed Single Document ──────────────────────────────────────────────────

async function embedDocument(doc: Document): Promise<PineconeRecord> {
  try {
    const embeddings = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);

    if (!Array.isArray(embeddings) || embeddings.length === 0) {
      throw new Error("Received empty embedding for document chunk");
    }

    return {
      id: hash,
      values: embeddings,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      },
    } as PineconeRecord;
  } catch (error: any) {
    console.error("[pinecone] Error embedding document chunk:", error?.message);
    throw error;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const truncateStringByBytes = (str: string, bytes: number): string => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

async function prepareDocument(page: PDFPage): Promise<Document[]> {
  let { pageContent, metadata } = page;

  // Clean content
  pageContent = pageContent
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!pageContent) {
    console.warn(`[pinecone] Page ${metadata.loc.pageNumber} has no content, skipping`);
    return [];
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 50,
  });

  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, MAX_BYTES),
      },
    }),
  ]);

  return docs;
}