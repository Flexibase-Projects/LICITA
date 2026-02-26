import { useEffect, useState } from 'react'
import { CircleMarker, Popup, Tooltip } from 'react-leaflet'
import type { MapaOrgao } from '@licita/shared-types'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

interface OrgaoMarkersProps {
  uf: string
  orgaos: MapaOrgao[]
  selectedCnpj: string | null
  onSelectOrgao: (cnpj: string) => void
}

function countToMarkerColor(count: number): string {
  if (count >= 5) return '#DC2626'  // vermelho — muito ativo
  if (count >= 2) return '#F59E0B'  // amarelo — moderado
  return '#22C55E'                   // verde — baixo
}

/** Pequeno deslocamento só quando dois órgãos têm exatamente a mesma coordenada (ex.: mesmo endereço) */
const JITTER_DEG = 0.006

function addJitter(
  orgaos: Array<{ lat: number; lng: number; cnpj: string }>
): Array<{ lat: number; lng: number; cnpj: string }> {
  const byKey = new Map<string, Array<{ lat: number; lng: number; cnpj: string }>>()
  for (const o of orgaos) {
    const key = `${o.lat.toFixed(5)}_${o.lng.toFixed(5)}`
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key)!.push(o)
  }
  const out: Array<{ lat: number; lng: number; cnpj: string }> = []
  for (const group of byKey.values()) {
    if (group.length <= 1) {
      out.push(...group)
      continue
    }
    group.forEach((o, i) => {
      const angle = (2 * Math.PI * i) / group.length
      out.push({
        ...o,
        lat: o.lat + Math.cos(angle) * JITTER_DEG,
        lng: o.lng + Math.sin(angle) * JITTER_DEG,
      })
    })
  }
  return out
}

export default function OrgaoMarkers({ uf, orgaos, selectedCnpj, onSelectOrgao }: OrgaoMarkersProps) {
  const withCoords = orgaos.filter(
    (o): o is MapaOrgao & { lat: number; lng: number } =>
      o.lat != null && o.lng != null
  )
  const valid = addJitter(withCoords)

  return (
    <>
      {valid.map((orgao) => {
        const isSelected = orgao.cnpj === selectedCnpj
        const color = countToMarkerColor(orgao.total_editais)

        return (
          <CircleMarker
            key={orgao.cnpj}
            center={[orgao.lat, orgao.lng]}
            radius={isSelected ? 12 : 8}
            pathOptions={{
              color: isSelected ? '#60A5FA' : color,
              fillColor: color,
              fillOpacity: 0.95,
              weight: isSelected ? 2 : 0,
              opacity: 1,
              className: isSelected ? '' : 'orgao-marker-pulse',
            }}
            eventHandlers={{
              click: () => onSelectOrgao(orgao.cnpj),
            }}
          >
            <Tooltip
              permanent={false}
              direction="top"
              offset={[0, -8]}
              opacity={0.95}
              className="orgao-marker-tooltip"
            >
              <strong>{orgao.nome}</strong>
              <br />
              {orgao.municipio} · {orgao.total_editais} edital(is)
            </Tooltip>
            <Popup minWidth={220}>
              <Box sx={{ fontFamily: 'inherit' }}>
                <Typography variant="body2" fontWeight={700} gutterBottom>
                  {orgao.nome}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {orgao.municipio}
                </Typography>
                <Typography variant="caption" color="primary" display="block" sx={{ mt: 0.5 }}>
                  {orgao.total_editais} edital(is) de mobiliário
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  sx={{ mt: 1, fontSize: '0.7rem' }}
                  onClick={() => onSelectOrgao(orgao.cnpj)}
                >
                  Ver detalhes
                </Button>
              </Box>
            </Popup>
          </CircleMarker>
        )
      })}
    </>
  )
}
