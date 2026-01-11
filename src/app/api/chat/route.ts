import { Message, StreamingTextResponse } from "ai";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();
    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
    if (_chats.length != 1) {
      return NextResponse.json({ error: "chat not found" }, { status: 404 });
    }
    const fileKey = _chats[0].fileKey;
    const lastMessage = messages[messages.length - 1];
    const context = await getContext(lastMessage.content, fileKey);

    const prompt = {
      role: "system",
      content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      AI assistant is a big fan of Pinecone and Vercel.
      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK
      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
      If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
      AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
      AI assistant will not invent anything that is not drawn directly from the context.
      `,
    };

    // Stream from OpenRouter
    const userMessages = messages.filter((m: Message) => m.role === "user");

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "",
        "X-Title": process.env.OPENROUTER_APP_NAME || "chatpdf-yt",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b:free",
        stream: true,
        messages: [prompt, ...userMessages],
      }),
    });

    if (!resp.ok || !resp.body) {
      return NextResponse.json({ error: "upstream error" }, { status: 500 });
    }

    let full = "";
    const stream = new ReadableStream({
      start: async (controller) => {
        // save user message into db
        await db.insert(_messages).values({
          chatId,
          content: lastMessage.content,
          role: "user",
        });

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") {
              continue;
            }
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content || "";
              if (delta) {
                full += delta;
                controller.enqueue(new TextEncoder().encode(delta));
              }
            } catch {}
          }
        }
        // save ai message into db
        await db.insert(_messages).values({
          chatId,
          content: full,
          role: "system",
        });
        controller.close();
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {}
}
