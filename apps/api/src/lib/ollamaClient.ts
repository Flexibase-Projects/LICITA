import { Ollama } from 'ollama'

const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
export const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b'
export const DEFAULT_CTX = 32768

export const ollamaClient = new Ollama({ host: baseUrl })

export interface OllamaGenerateOptions {
  model?: string
  prompt: string
  system?: string
  numCtx?: number
  temperature?: number
  maxRetries?: number
}

export interface OllamaResult {
  text: string
  json: Record<string, unknown> | null
  durationMs: number
  tokensIn: number
  tokensOut: number
}

export async function ollamaGenerate(opts: OllamaGenerateOptions): Promise<OllamaResult> {
  const {
    model = DEFAULT_MODEL,
    prompt,
    system,
    numCtx = DEFAULT_CTX,
    temperature = 0.1,
    maxRetries = 3,
  } = opts

  let lastError: Error | null = null
  const t0 = Date.now()

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ollamaClient.generate({
        model,
        prompt,
        system,
        stream: false,
        options: {
          num_ctx: numCtx,
          temperature,
          top_p: 0.9,
        },
      })

      const text = response.response.trim()
      const durationMs = Date.now() - t0

      return {
        text,
        json: extractJSON(text),
        durationMs,
        tokensIn: response.prompt_eval_count ?? 0,
        tokensOut: response.eval_count ?? 0,
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < maxRetries) {
        await sleep(2000 * attempt)
      }
    }
  }

  throw new Error(`OLLAMA falhou após ${maxRetries} tentativas: ${lastError?.message}`)
}

export async function checkOllamaHealth(model = DEFAULT_MODEL): Promise<boolean> {
  try {
    const list = await ollamaClient.list()
    return list.models.some((m) => m.name === model || m.name.startsWith(model.split(':')[0]))
  } catch {
    return false
  }
}

function extractJSON(text: string): Record<string, unknown> | null {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) {
    try {
      return JSON.parse(codeBlock[1].trim())
    } catch {
      // continua tentando
    }
  }

  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1))
    } catch {
      // retorna null
    }
  }

  return null
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
