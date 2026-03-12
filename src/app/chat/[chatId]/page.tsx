import ChatComponent from "@/components/ChatComponent";
import ChatSideBar from "@/components/ChatSideBar";
import PDFViewer from "@/components/PDFViewer";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { checkSubscription } from "@/lib/subscription";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  params: {
    chatId: string;
  };
};

const ChatPage = async ({ params: { chatId } }: Props) => {
  // ─── Auth ────────────────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // ─── Validate chatId ─────────────────────────────────────────────────────
  const parsedChatId = parseInt(chatId);
  if (isNaN(parsedChatId)) redirect("/");

  // ─── Fetch user's chats ───────────────────────────────────────────────────
  const _chats = await db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(chats.createdAt);

  if (!_chats || _chats.length === 0) redirect("/");

  // ─── Verify chat belongs to user ─────────────────────────────────────────
  const currentChat = _chats.find((chat) => chat.id === parsedChatId);
  if (!currentChat) redirect("/");

  // ─── Subscription ─────────────────────────────────────────────────────────
  const isPro = await checkSubscription();

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">

      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-gray-800 overflow-y-auto">
        <ChatSideBar chats={_chats} chatId={parsedChatId} isPro={isPro} />
      </aside>

      {/* PDF Viewer */}
      <main className="flex-[5] overflow-hidden border-r border-gray-800">
        {currentChat.pdfUrl ? (
          <PDFViewer pdf_url={currentChat.pdfUrl} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No PDF available for this chat.</p>
          </div>
        )}
      </main>

      {/* Chat */}
      <section className="flex-[3] overflow-hidden">
        <ChatComponent chatId={parsedChatId} />
      </section>

    </div>
  );
};

export default ChatPage;