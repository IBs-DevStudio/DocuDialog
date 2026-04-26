import { cn } from "@/lib/utils";
import { Message } from "ai/react";
import { Loader2 } from "lucide-react";
import React from "react";

type Props = {
  isLoading: boolean;
  messages: Message[];
};

const MessageList = ({ messages = [], isLoading }: Props) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center text-sm text-gray-500 mt-4">
        No messages yet. Start the conversation 👋
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-2">
      {messages.map((message) => {
        const isUser = message.role === "user";

        return (
          <div
            key={message.id}
            className={cn("flex", {
              "justify-end pl-10": isUser,
              "justify-start pr-10": !isUser,
            })}
          >
            <div
              className={cn(
                "rounded-xl px-3 py-2 text-sm shadow-sm ring-1 ring-gray-900/10 max-w-[80%] break-words",
                {
                  "bg-blue-600 text-white": isUser,
                  "bg-gray-100 text-gray-900": !isUser,
                }
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;