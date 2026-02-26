import { useState, useCallback } from 'react'
import type { SSEEvent } from '@licita/shared-types'

export interface AnalysisState {
  isUploading: boolean
  isAnalyzing: boolean
  progress: number
  step: string
  message: string
  editalId: string | null
  error: string | null
}

const INITIAL_STATE: AnalysisState = {
  isUploading: false,
  isAnalyzing: false,
  progress: 0,
  step: '',
  message: '',
  editalId: null,
  error: null,
}

function getApiUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`
  }
  return 'http://localhost:3001'
}

export function useEditalAnalysis() {
  const [state, setState] = useState<AnalysisState>(INITIAL_STATE)

  const reset = useCallback(() => setState(INITIAL_STATE), [])

  const analyzeFile = useCallback(async (file: File, model?: string) => {
    const apiUrl = getApiUrl()
    setState((s) => ({ ...s, isUploading: true, error: null, progress: 2, message: 'Enviando PDF...' }))

    try {
      // 1. Upload do arquivo
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!uploadRes.ok) {
        const contentType = uploadRes.headers.get('Content-Type') ?? ''
        let message = 'Falha no upload'
        if (contentType.includes('application/json')) {
          try {
            const err = await uploadRes.json()
            message = err?.error ?? message
          } catch {
            message = 'Falha no servidor. Tente novamente.'
          }
        } else {
          message = 'Falha no servidor. Tente novamente.'
        }
        throw new Error(message)
      }

      const { editalId } = await uploadRes.json()

      setState((s) => ({ ...s, isUploading: false, isAnalyzing: true, editalId, progress: 5, message: 'PDF enviado. Iniciando análise...' }))

      // 2. Inicia análise via SSE
      const analyzeRes = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editalId, model }),
        credentials: 'include',
      })

      if (!analyzeRes.ok || !analyzeRes.body) {
        let message = 'Falha ao iniciar análise'
        try {
          const text = await analyzeRes.text()
          try {
            const err = JSON.parse(text) as { error?: string }
            if (err && typeof err.error === 'string') message = err.error
          } catch {
            if (text.length > 0 && text.length < 400) message = text
          }
        } catch {
          // mantém mensagem padrão
        }
        throw new Error(message)
      }

      // 3. Consome stream SSE
      const reader = analyzeRes.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6)) as SSEEvent

            if (event.step === 'error') {
              setState((s) => ({ ...s, isAnalyzing: false, error: event.error ?? event.message }))
              return
            }

            if (event.step === 'completed') {
              setState((s) => ({
                ...s,
                isAnalyzing: false,
                progress: 100,
                step: 'completed',
                message: event.message,
                editalId: event.editalId ?? s.editalId,
              }))
              return
            }

            setState((s) => ({
              ...s,
              progress: event.progress,
              step: event.step,
              message: event.message,
            }))
          } catch {
            // linha mal formatada — ignora
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setState((s) => ({ ...s, isUploading: false, isAnalyzing: false, error: msg }))
    }
  }, [])

  return { state, analyzeFile, reset }
}
