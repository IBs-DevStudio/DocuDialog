export async function getEmbeddings(text: string) {
  try {
    const resp = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "",
        "X-Title": process.env.OPENROUTER_APP_NAME || "chatpdf-yt",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_EMBED_MODEL || "openai/text-embedding-3-small",
        input: text.replace(/\n/g, " "),
      }),
    });

    if (!resp.ok) {
      const msg = await resp.text();
      throw new Error(`OpenRouter embeddings error: ${resp.status} ${msg}`);
    }

    const json = await resp.json();
    return json.data?.[0]?.embedding as number[];
  } catch (error) {
    console.log("error calling openrouter embeddings api", error);
    throw error;
  }
}
