const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/embeddings";
const DEFAULT_EMBED_MODEL = "openai/text-embedding-3-small";
const MAX_INPUT_LENGTH = 8000; // safe token limit

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}


export async function getEmbeddings(text: string): Promise<number[]> {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Input must be a non-empty string");
  }

  const sanitized = sanitizeText(text);
  const truncated = truncateText(
    sanitized,
    OPENROUTER_CONFIG.MAX_INPUT_LENGTH
  );

  const apiKey = getRequiredEnv("OPENROUTER_API_KEY");
  const model =
    process.env.OPENROUTER_EMBED_MODEL ||
    OPENROUTER_CONFIG.DEFAULT_MODEL;

  let response: Response;

  try {
    response = await fetch(OPENROUTER_CONFIG.BASE_URL, {
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
  } catch (err: any) {
    console.error("[embeddings] Network failure:", err?.message || err);
    throw new Error("Network error while calling OpenRouter");
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[embeddings] API error ${response.status}:`, errorText);

    switch (response.status) {
      case 401:
        throw new Error("Unauthorized: Invalid OpenRouter API key");
      case 429:
        throw new Error("Rate limit exceeded. Please retry later");
      case 500:
      case 502:
      case 503:
        throw new Error("OpenRouter server error");
      default:
        throw new Error(`Embedding request failed (${response.status})`);
    }
  }

  const json = await response.json();
  const embedding = json?.data?.[0]?.embedding;

  if (!Array.isArray(embedding) || embedding.length === 0) {
    console.error("[embeddings] Invalid response:", JSON.stringify(json));
    throw new Error("Malformed embedding response");
  }

  console.log(
    `[embeddings] Generated embedding → model: ${model}, dimensions: ${embedding.length}`
  );

  return embedding;
}