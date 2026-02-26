import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ editalId: string }> }
) {
  const { editalId } = await params

  const { data, error } = await supabaseAdmin
    .from('feedbacks_analise')
    .select('*')
    .eq('edital_id', editalId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
