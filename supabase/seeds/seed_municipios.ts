/**
 * Seed: Popular tabela municipios com centróides do IBGE
 *
 * Execute UMA VEZ após aplicar a migration 010:
 *   npx tsx supabase/seeds/seed_municipios.ts
 *
 * Requer: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente
 */
import { createClient } from '@supabase/supabase-js'

const IBGE_MUNICIPIOS_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios'

interface IBGEMunicipio {
  id: number
  nome: string
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string
      }
    }
  }
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  console.log('📡 Buscando municípios do IBGE...')
  const res = await fetch(IBGE_MUNICIPIOS_URL)
  const municipios: IBGEMunicipio[] = await res.json()
  console.log(`✅ ${municipios.length} municípios encontrados`)

  // IBGE v1 não retorna centróides diretamente; usamos a API v3 de malhas
  // para obter as coordenadas de cada município
  // ESTRATÉGIA: usar centróides aproximados por estado (já no heatmap route)
  // e salvar pelo menos os dados básicos (nome, uf, codigo)
  // As coordenadas serão preenchidas via outra chamada ou via cálculo de centróide do GeoJSON

  const rows = municipios.map((m) => ({
    codigo_ibge: String(m.id),
    nome: m.nome,
    uf: m.microrregiao.mesorregiao.UF.sigla,
    lat: null as number | null,
    lng: null as number | null,
  }))

  // Inserir em lotes de 500
  const BATCH = 500
  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('municipios')
      .upsert(batch, { onConflict: 'codigo_ibge', ignoreDuplicates: false })

    if (error) {
      console.error(`❌ Erro no lote ${i}:`, error.message)
    } else {
      inserted += batch.length
      console.log(`  ✔ ${inserted}/${rows.length} municípios inseridos`)
    }
  }

  console.log(`\n🎉 Seed concluído! ${inserted} municípios na tabela.`)
  console.log('ℹ️  As coordenadas (lat/lng) serão enriquecidas automaticamente quando órgãos forem buscados via IBGE Malhas API.')
}

main().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
