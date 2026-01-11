import { S3 } from "@aws-sdk/client-s3";
import fs from "fs";
import os from "os";
import path from "path";

export async function downloadFromS3(file_key: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const region =
        process.env.S3_REGION || process.env.NEXT_PUBLIC_S3_REGION || "ap-south-1";

      const accessKeyId =
        process.env.S3_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID;
      const secretAccessKey =
        process.env.S3_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY;
      const bucketName =
        process.env.S3_BUCKET_NAME || process.env.NEXT_PUBLIC_S3_BUCKET_NAME;

      if (!accessKeyId || !secretAccessKey || !bucketName) {
        throw new Error(
          "Missing S3 configuration: please set S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET_NAME (or NEXT_PUBLIC_* fallbacks)."
        );
      }

      const s3 = new S3({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      const params = {
        Bucket: bucketName,
        Key: file_key,
      };

      const obj = await s3.getObject(params);
      const tmpDir = os.tmpdir();
      const file_name = path.join(
        tmpDir,
        `elliott_${Date.now().toString()}.pdf`
      );

      if (obj.Body instanceof require("stream").Readable) {
        // AWS-SDK v3 has some issues with their typescript definitions, but this works
        // https://github.com/aws/aws-sdk-js-v3/issues/843
        const file = fs.createWriteStream(file_name);
        file.on("open", function () {
          // @ts-ignore
          obj.Body?.pipe(file).on("finish", () => {
            return resolve(file_name);
          });
        });
      } else {
        throw new Error("S3 getObject returned no readable Body");
      }
    } catch (error) {
      console.error("downloadFromS3 error:", error);
      reject(error);
      return null as any;
    }
  });
}

// downloadFromS3("uploads/1693568801787chongzhisheng_resume.pdf");
