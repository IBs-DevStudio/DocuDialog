"use client";

import { useDropzone } from "react-dropzone";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Loader2, Inbox } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function FileUpload() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (files) => {
      const file = files[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large");
        return;
      }

      try {
        setLoading(true);

        // 1️⃣ Upload file
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await axios.post("/api/upload", formData);
        const { file_key, file_name } = uploadRes.data;

        // 2️⃣ Create chat
        const chatRes = await axios.post("/api/create-chat", {
          file_key,
          file_name,
        });

        toast.success("Chat created!");
        router.push(`/chat/${chatRes.data.chat_id}`);
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div
      {...getRootProps()}
      className="border-dashed border-2 rounded-xl p-10 text-center cursor-pointer"
    >
      <input {...getInputProps()} />
      {loading ? (
        <>
          <Loader2 className="mx-auto animate-spin" />
          <p className="mt-2 text-sm">Uploading...</p>
        </>
      ) : (
        <>
          <Inbox className="mx-auto" />
          <p className="mt-2 text-sm">Drop PDF here</p>
        </>
      )}
    </div>
  );
}
