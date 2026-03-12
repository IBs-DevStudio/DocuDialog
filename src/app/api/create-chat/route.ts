import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { getS3Url } from "@/lib/s3";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// /api/create-chat
export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { file_key, file_name } = body;

    // Validate inputs
    if (!file_key || typeof file_key !== "string" || file_key.trim() === "") {
      return NextResponse.json({ error: "Invalid or missing file_key" }, { status: 400 });
    }
    if (!file_name || typeof file_name !== "string" || file_name.trim() === "") {
      return NextResponse.json({ error: "Invalid or missing file_name" }, { status: 400 });
    }

    // Check required env vars
    const requiredEnvs = [
      "DATABASE_URL",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
      "S3_BUCKET_NAME",
      "PINECONE_API_KEY",
      "OPENROUTER_API_KEY",
    ];
    const missing = requiredEnvs.filter((k) => !process.env[k]);
    if (missing.length) {
      console.error("[create-chat] Missing environment variables:", missing);
      return NextResponse.json(
        { error: "Server misconfiguration. Please contact support." },
        { status: 500 }
      );
    }

    // Load PDF into Pinecone
    console.log("[create-chat] Loading into Pinecone:", file_key);
    await loadS3IntoPinecone(file_key);
    console.log("[create-chat] Pinecone load complete");

    // Insert chat into DB
    const pdfUrl = getS3Url(file_key);
    const result = await db
      .insert(chats)
      .values({
        fileKey: file_key.trim(),
        pdfName: file_name.trim(),
        pdfUrl,
        userId,
        createdAt: new Date(),
      })
      .returning({ insertedId: chats.id });

    const chat_id = result[0]?.insertedId;

    if (!chat_id) {
      console.error("[create-chat] DB insert returned no ID");
      return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
    }

    console.log("[create-chat] Chat created successfully:", chat_id);

    return NextResponse.json({ chat_id }, { status: 201 });

  } catch (error: any) {
    console.error("[create-chat] Unexpected error:", error?.message || error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}