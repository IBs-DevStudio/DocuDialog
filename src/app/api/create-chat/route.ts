import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { getS3Url } from "@/lib/s3";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validateString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Invalid ${field}`);
  }
  return value.trim();
}

function checkEnvVars(keys: string[]) {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("[create-chat] Missing env:", missing);
    throw new Error("Server misconfiguration");
  }
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const fileKey = validateString(body.file_key, "file_key");
    const fileName = validateString(body.file_name, "file_name");

    checkEnvVars([
      "DATABASE_URL",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
      "S3_BUCKET_NAME",
      "PINECONE_API_KEY",
      "OPENROUTER_API_KEY",
    ]);

    console.log("[create-chat] Processing file:", fileKey);

    // ─── Load into Pinecone ───────────────────────────────────────────────────

    await loadS3IntoPinecone(fileKey);
    console.log("[create-chat] Pinecone indexing complete");

    // ─── DB Insert ────────────────────────────────────────────────────────────

    const pdfUrl = getS3Url(fileKey);

    const [inserted] = await db
      .insert(chats)
      .values({
        fileKey,
        pdfName: fileName,
        pdfUrl,
        userId,
        createdAt: new Date(),
      })
      .returning({ id: chats.id });

    if (!inserted?.id) {
      throw new Error("Database insert failed");
    }

    console.log("[create-chat] Chat created:", inserted.id);

    return NextResponse.json(
      { chat_id: inserted.id },
      { status: 201 }
    );

  } catch (err: any) {
    console.error("[create-chat] Error:", err?.message || err);

    if (err.message?.includes("Invalid")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (err.message === "Server misconfiguration") {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}