import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// ─── Config ──────────────────────────────────────────────────────────────────

function getS3Config() {
  const region = process.env.S3_REGION || "ap-south-1";
  const bucket = process.env.S3_BUCKET_NAME;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing S3 configuration");
  }

  return { region, bucket, accessKeyId, secretAccessKey };
}

// ─── Client (singleton) ──────────────────────────────────────────────────────

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  const { region, accessKeyId, secretAccessKey } = getS3Config();

  s3Client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  return s3Client;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ["application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sanitizeFileName(name: string): string {
  return name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export async function uploadToS3(
  file: File
): Promise<{ file_key: string; file_name: string }> {
  if (!file || !(file instanceof File)) {
    throw new Error("Invalid file input");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File exceeds 10MB limit");
  }

  const sanitizedName = sanitizeFileName(file.name);
  const fileKey = `uploads/${Date.now()}-${sanitizedName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { bucket } = getS3Config();

  try {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: fileKey,
        Body: buffer,
        ContentType: file.type,
        ContentDisposition: `inline; filename="${sanitizedName}"`,
      })
    );

    console.log("[s3] Upload success:", fileKey);

    return {
      file_key: fileKey,
      file_name: file.name,
    };
  } catch (err: any) {
    console.error("[s3] Upload error:", err?.message || err);
    throw new Error("S3 upload failed");
  }
}

// ─── URL Helper ──────────────────────────────────────────────────────────────

export function getS3Url(fileKey: string): string {
  const { bucket, region } = getS3Config();
  return `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`;
}