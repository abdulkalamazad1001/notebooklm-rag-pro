/**
 * NVIDIA NIM API Integration
 * Developed by Abdul Kalam Azad
 * 
 * Provides core utilities for document embedding and streaming chat completions.
 * This implementation uses native fetch to maintain a lightweight footprint without
 * external dependencies like the 'openai' package.
 */

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"

// We use the e5-v5 model for high-fidelity retrieval. 
// It effectively separates document passages from user queries to improve recall.
const EMBED_MODEL = "nvidia/nv-embedqa-e5-v5"

// Llama 3.1 70B is our primary engine, chosen for its exceptional grounding 
// and ability to strictly adhere to document-based context.
const CHAT_MODEL = "meta/llama-3.1-70b-instruct"

function getApiKey(): string {
  const key = process.env.NVIDIA_API_KEY
  if (!key) {
    throw new Error("NVIDIA_API_KEY environment variable is not set")
  }
  return key
}

export type InputType = "passage" | "query"

/**
 * Embed a single piece of text. Pass `inputType: "passage"` for documents
 * we are indexing, and `inputType: "query"` for the user's question.
 */
export async function embed(text: string, inputType: InputType): Promise<number[]> {
  const res = await fetch(`${NVIDIA_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      input: [text],
      model: EMBED_MODEL,
      encoding_format: "float",
      input_type: inputType,
      truncate: "END",
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Embedding failed (${res.status}): ${body}`)
  }

  const json = (await res.json()) as {
    data: Array<{ embedding: number[] }>
  }
  return json.data[0].embedding
}

/**
 * Embed multiple texts. NVIDIA's embedding endpoint sometimes rejects
 * large batches, so we cap each batch and run them sequentially.
 */
export async function embedBatch(texts: string[], inputType: InputType): Promise<number[][]> {
  const BATCH = 32
  const out: number[][] = []
  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH)
    const res = await fetch(`${NVIDIA_BASE_URL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        input: slice,
        model: EMBED_MODEL,
        encoding_format: "float",
        input_type: inputType,
        truncate: "END",
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Embedding failed (${res.status}): ${body}`)
    }

    const json = (await res.json()) as { data: Array<{ embedding: number[]; index: number }> }
    // The API may return data out of order — sort by `index` before pushing.
    const sorted = [...json.data].sort((a, b) => a.index - b.index)
    for (const row of sorted) out.push(row.embedding)
  }
  return out
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

/**
 * Stream a chat completion. Yields content deltas as plain strings.
 */
export async function* streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      temperature: 0.2, // low temp -> stay grounded
      top_p: 0.9,
      max_tokens: 4096,
      stream: true,
      // Disable hidden chain-of-thought so streamed answers stay clean.
      chat_template_kwargs: { thinking: false },
    }),
  })

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "")
    throw new Error(`Chat completion failed (${res.status}): ${body}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder("utf-8")
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // Server-sent events come line-by-line, separated by \n\n.
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data:")) continue
      const data = trimmed.slice(5).trim()
      if (data === "[DONE]") return
      try {
        const json = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const delta = json.choices?.[0]?.delta?.content
        if (delta) yield delta
      } catch {
        // Ignore malformed SSE keepalive frames.
      }
    }
  }
}
