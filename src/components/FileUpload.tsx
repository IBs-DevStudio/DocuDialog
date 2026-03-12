"use client";

import { useDropzone } from "react-dropzone";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Loader2, FileText, Upload, CheckCircle, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function FileUpload() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (files) => {
      const file = files[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large (max 10MB)");
        return;
      }

      setSelectedFile(file);

      try {
        setLoading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await axios.post("/api/upload", formData, {
          onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / (e.total || 1));
            setUploadProgress(percent);
          },
        });

        const { file_key, file_name } = uploadRes.data;

        setUploadProgress(100);
        setUploaded(true);

        const chatRes = await axios.post("/api/create-chat", {
          file_key,
          file_name,
        });

        toast.success("Chat created!");
        router.push(`/chat/${chatRes.data.chat_id}`);
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong");
        setSelectedFile(null);
        setUploadProgress(0);
        setUploaded(false);
      } finally {
        setLoading(false);
      }
    },
  });

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300
        ${isDragActive
          ? "border-blue-500 bg-blue-950/30 scale-[1.02]"
          : "border-gray-700 bg-gray-900 hover:border-blue-500 hover:bg-gray-800/60"
        }
        ${loading ? "pointer-events-none" : ""}
      `}
    >
      <input {...getInputProps()} />

      {/* Drag overlay */}
      {isDragActive && (
        <div className="absolute inset-0 rounded-2xl bg-blue-500/10 flex items-center justify-center z-10">
          <p className="text-blue-400 font-semibold text-lg animate-pulse">Drop it here!</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-4">
          {/* File info */}
          {selectedFile && (
            <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-xl border border-gray-700 w-full max-w-xs">
              <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div className="text-left overflow-hidden">
                <p className="text-sm text-white truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">{formatSize(selectedFile.size)}</p>
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{uploaded ? "Processing..." : "Uploading..."}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>

          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          <p className="text-sm text-gray-400">Please wait...</p>
        </div>
      ) : uploaded ? (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle className="w-12 h-12 text-green-400" />
          <p className="text-green-400 font-semibold">Upload complete!</p>
          <p className="text-sm text-gray-400">Redirecting to chat...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-300
            ${isDragActive ? "bg-blue-500/20" : "bg-gray-800"}`}>
            <Upload className={`w-8 h-8 transition-colors duration-300 ${isDragActive ? "text-blue-400" : "text-gray-400"}`} />
          </div>

          <div>
            <p className="text-white font-semibold text-base">
              {isDragActive ? "Release to upload" : "Drop your PDF here"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              or <span className="text-blue-400 hover:underline">browse files</span>
            </p>
          </div>

          {/* Constraints */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" /> PDF only
            </span>
            <span>•</span>
            <span>Max 10MB</span>
          </div>
        </div>
      )}
    </div>
  );
}