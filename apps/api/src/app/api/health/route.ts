import { NextResponse } from 'next/server'
import { checkOllamaHealth, DEFAULT_MODEL } from '@/lib/ollamaClient'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { HealthResponse } from '@licita/shared-types'

export async function GET() {
  const [ollamaOk, supabaseOk] = await Promise.allSettled([
    checkOllamaHealth(DEFAULT_MODEL),
    supabaseAdmin.from('editais').select('id').limit(1).then(() => true, () => false),
  ])

  const response: HealthResponse = {
    status: 'ok',
    ollama: ollamaOk.status === 'fulfilled' && ollamaOk.value ? 'ok' : 'error',
    supabase: supabaseOk.status === 'fulfilled' && supabaseOk.value ? 'ok' : 'error',
    ollamaModel: DEFAULT_MODEL,
    timestamp: new Date().toISOString(),
  }

  if (response.ollama === 'error' || response.supabase === 'error') {
    response.status = 'degraded'
  }

  return NextResponse.json(response, {
    status: response.status === 'ok' ? 200 : 503,
  })
}
