import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Create S3 client once (not on every upload)
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_S3_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
  },
});

const ALLOWED_TYPES = ["application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadToS3(
  file: File
): Promise<{ file_key: string; file_name: string }> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Only PDF is allowed.`);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Max size is 10MB.`);
  }

  // Sanitize file name — replace all spaces and special chars
  const sanitizedName = file.name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");

  const file_key = `uploads/${Date.now()}-${sanitizedName}`;

  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const params = {
    Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
    Key: file_key,
    Body: fileBuffer,
    ContentType: file.type,
    ContentDisposition: `inline; filename="${sanitizedName}"`,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    console.log("[s3] Upload successful:", file_key);

    return {
      file_key,
      file_name: file.name,
    };
  } catch (error: any) {
    console.error("[s3] Upload failed:", error?.message || error);
    throw new Error("Failed to upload file to S3. Please try again.");
  }
}

export function getS3Url(file_key: string): string {
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
  const region = process.env.NEXT_PUBLIC_S3_REGION || "ap-south-1";

  if (!bucket) {
    throw new Error("S3 bucket name is not configured.");
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${file_key}`;
}