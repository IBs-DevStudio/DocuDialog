import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { getS3Url } from "@/lib/s3";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// /api/create-chat
export async function POST(req: Request, res: Response) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { file_key, file_name } = body;
    console.log("create-chat payload:", { file_key, file_name });

    // Validate inputs
    if (!file_key || !file_name) {
      return NextResponse.json(
        { error: "file_key and file_name are required" },
        { status: 400 }
      );
    }

    // Basic env presence checks (no secrets logged)
    const missing = [
      "DATABASE_URL",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
      "S3_BUCKET_NAME",
      "PINECONE_API_KEY",
      "PINECONE_ENVIRONMENT",
      // Using OpenRouter now; keep OPENAI_API_KEY optional
      "OPENROUTER_API_KEY",
    ].filter((k) => !process.env[k]);
    if (missing.length) {
      console.error("Missing envs:", missing);
    }

    await loadS3IntoPinecone(file_key);

    const chat_id = await db
      .insert(chats)
      .values({
        fileKey: file_key,
        pdfName: file_name,
        pdfUrl: getS3Url(file_key),
        userId,
      })
      .returning({
        insertedId: chats.id,
      });

    return NextResponse.json(
      {
        chat_id: chat_id[0].insertedId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("/api/create-chat error:", error?.message || error, error?.stack);
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 }
    );
  }
}
