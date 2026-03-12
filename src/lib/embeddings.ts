const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/embeddings";
const DEFAULT_EMBED_MODEL = "openai/text-embedding-3-small";
const MAX_INPUT_LENGTH = 8000; // safe token limit

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export async function getEmbeddings(text: string): Promise<number[]> {
  // Validate input
  if (!text || typeof text !== "string") {
    throw new Error("Invalid input: text must be a non-empty string.");
  }

  // Sanitize + truncate
  const sanitized = text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  const truncated = sanitized.slice(0, MAX_INPUT_LENGTH);

  if (truncated.length < sanitized.length) {
    console.warn(`[embeddings] Input truncated from ${sanitized.length} to ${MAX_INPUT_LENGTH} chars`);
  }

  const apiKey = getRequiredEnv("OPENROUTER_API_KEY");
  const model = process.env.OPENROUTER_EMBED_MODEL || DEFAULT_EMBED_MODEL;

  let resp: Response;

  try {
    resp = await fetch(OPENROUTER_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "",
        "X-Title": process.env.OPENROUTER_APP_NAME || "docudialog",
      },
      body: JSON.stringify({
        model,
        input: truncated,
      }),
    });
  } catch (networkError: any) {
    console.error("[embeddings] Network error:", networkError?.message);
    throw new Error("Failed to reach OpenRouter API. Check your internet connection.");
  }

  if (!resp.ok) {
    const errorBody = await resp.text();
    console.error(`[embeddings] API error ${resp.status}:`, errorBody);

    if (resp.status === 401) throw new Error("Invalid OpenRouter API key.");
    if (resp.status === 429) throw new Error("OpenRouter rate limit exceeded. Try again later.");
    if (resp.status >= 500) throw new Error("OpenRouter server error. Try again later.");

    throw new Error(`OpenRouter embeddings failed: ${resp.status}`);
  }

  const json = await resp.json();
  const embedding = json.data?.[0]?.embedding;

  if (!Array.isArray(embedding) || embedding.length === 0) {
    console.error("[embeddings] Unexpected response shape:", JSON.stringify(json));
    throw new Error("Invalid embedding response from OpenRouter.");
  }

  console.log(`[embeddings] Success — model: ${model}, dims: ${embedding.length}`);
  return embedding;
}