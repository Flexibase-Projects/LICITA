import { useEffect, useRef, useState } from 'react'
import { GeoJSON, useMap } from 'react-leaflet'
import type { GeoJsonObject, Feature } from 'geojson'
import type { Layer, LeafletMouseEvent, LatLngBounds } from 'leaflet'

interface StateLayerProps {
  geoJson: GeoJsonObject | null
  selectedUF: string | null
  heatmapCounts: Record<string, number>
  maxCount: number
  onSelectUF: (uf: string | null) => void
  onSelectBounds: (bounds: LatLngBounds | null) => void
}

function getUF(feature: Feature): string {
  const props = feature.properties ?? {}
  return (props['SIGLA_UF'] ?? props['sigla'] ?? props['UF_05'] ?? '').toString().toUpperCase()
}

// Cor de preenchimento proporcional à contagem (mapa coroplético)
function countToFillColor(count: number, maxCount: number): string {
  if (maxCount === 0 || count === 0) return '#1E293B'

  const ratio = Math.min(count / maxCount, 1)

  if (ratio < 0.33) {
    const t = ratio / 0.33
    const r = Math.round(34 + (234 - 34) * t)
    const g = Math.round(197 + (179 - 197) * t)
    const b = Math.round(94 + (8 - 94) * t)
    return `rgb(${r},${g},${b})`
  } else if (ratio < 0.66) {
    const t = (ratio - 0.33) / 0.33
    const r = Math.round(234 + (249 - 234) * t)
    const g = Math.round(179 + (115 - 179) * t)
    const b = Math.round(8 + (22 - 8) * t)
    return `rgb(${r},${g},${b})`
  } else {
    const t = (ratio - 0.66) / 0.34
    const r = Math.round(249 + (220 - 249) * t)
    const g = Math.round(115 + (38 - 115) * t)
    const b = Math.round(22 + (38 - 22) * t)
    return `rgb(${r},${g},${b})`
  }
}

export default function StateLayer({
  geoJson,
  selectedUF,
  heatmapCounts,
  maxCount,
  onSelectUF,
  onSelectBounds,
}: StateLayerProps) {
  const map = useMap()
  const layerRef = useRef<ReturnType<typeof import('leaflet').geoJSON> | null>(null)
  const styleRef = useRef<(feature?: Feature) => Record<string, unknown>>(null!)
  const [zoom, setZoom] = useState(() => map.getZoom())

  // Refs para os handlers sempre verem o valor atual (evita closure antiga ao voltar ao Brasil / hover)
  const selectedUFRef = useRef(selectedUF)
  const heatmapCountsRef = useRef(heatmapCounts)
  const maxCountRef = useRef(maxCount)
  const onSelectUFRef = useRef(onSelectUF)
  const onSelectBoundsRef = useRef(onSelectBounds)
  selectedUFRef.current = selectedUF
  heatmapCountsRef.current = heatmapCounts
  maxCountRef.current = maxCount
  onSelectUFRef.current = onSelectUF
  onSelectBoundsRef.current = onSelectBounds

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom())
    map.on('zoomend', onZoom)
    return () => {
      map.off('zoomend', onZoom)
    }
  }, [map])

  const styleFn = (feature?: Feature) => {
    const uf = feature ? getUF(feature) : ''
    const count = heatmapCounts[uf] ?? 0
    const color = countToFillColor(count, maxCount)
    // Zoom recuado (país todo): borda mais grossa para enxergar; zoom perto: mais fina
    const strokeWeight = zoom <= 4 ? 1.6 : zoom <= 5 ? 1.25 : zoom <= 6 ? 1.05 : 1
    // Cor que funciona tanto em área escura quanto colorida: cinza médio bem visível
    const strokeColor = '#475569'
    const strokeOpacity = 0.82

    // Modo overview: bordas nítidas para delimitar estados (mesmo com mesma cor)
    if (!selectedUF) {
      return {
        fillColor: color,
        fillOpacity: count > 0 ? 0.32 : 0.08,
        color: strokeColor,
        weight: strokeWeight,
        opacity: strokeOpacity,
        lineCap: 'round' as const,
        lineJoin: 'round' as const,
      }
    }

    // Estado selecionado: borda azul suave, fill bem leve
    if (uf === selectedUF) {
      return {
        fillColor: color,
        fillOpacity: 0.18,
        color: '#60A5FA',
        weight: Math.max(strokeWeight * 1.4, 1.5),
        opacity: 0.9,
        lineCap: 'round' as const,
        lineJoin: 'round' as const,
      }
    }

    // Demais estados quando algum está selecionado: apagados ao fundo
    return {
      fillColor: '#0F172A',
      fillOpacity: 0.6,
      color: strokeColor,
      weight: strokeWeight,
      opacity: 0.6,
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
    }
  }
  styleRef.current = styleFn

  const onEachFeature = (feature: Feature, layer: Layer) => {
    const uf = getUF(feature)

    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        // Hover só em modo overview — usar ref para valor atual (evita cor forte com estado já selecionado)
        if (selectedUFRef.current != null) return
        const count = heatmapCountsRef.current[uf] ?? 0
        const color = countToFillColor(count, maxCountRef.current)
        const zoom = map.getZoom()
        const w = zoom <= 4 ? 1.6 : zoom <= 5 ? 1.25 : zoom <= 6 ? 1.05 : 1
        e.target.setStyle({
          fillColor: color,
          fillOpacity: count > 0 ? 0.92 : 0.4,
          color: '#475569',
          weight: w,
          opacity: 0.82,
          lineCap: 'round',
          lineJoin: 'round',
        })
        e.target.bringToFront()
      },
      mouseout: (e: LeafletMouseEvent) => {
        if (layerRef.current) {
          layerRef.current.resetStyle(e.target)
        }
      },
      click: (e: LeafletMouseEvent) => {
        const currentUF = selectedUFRef.current
        if (uf === currentUF) {
          onSelectUFRef.current(null)
          onSelectBoundsRef.current(null)
        } else {
          const bounds: LatLngBounds = e.target.getBounds()
          onSelectUFRef.current(uf)
          onSelectBoundsRef.current(bounds)
        }
      },
    })
  }

  // Re-estilizar quando heatmap ou seleção mudam
  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.resetStyle()
    }
  }, [selectedUF, heatmapCounts])

  if (!geoJson) return null

  return (
    <GeoJSON
      key={maxCount}
      data={geoJson}
      style={(feature) => styleRef.current(feature)}
      onEachFeature={onEachFeature}
      ref={(ref) => {
        if (ref) layerRef.current = ref as unknown as ReturnType<typeof import('leaflet').geoJSON>
      }}
    />
  )
}
