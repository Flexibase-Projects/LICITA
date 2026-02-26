import { useEffect, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { LatLngBounds } from 'leaflet'
import type { GeoJsonObject } from 'geojson'
import type { MapaEstadoHeat, MapaOrgao } from '@licita/shared-types'
import { apiClient } from '../../services/apiClient'
import StateLayer from './StateLayer'
import OrgaoMarkers from './OrgaoMarkers'
import MapaLegend from './MapaLegend'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

// Bounds aproximados do Brasil (com pequena margem) — sistema é só no Brasil
const BRASIL_BOUNDS: LatLngBounds = [
  [-35.5, -75],  // sudoeste
  [6.5, -33],    // nordeste
] as LatLngBounds

// Trava a câmera: margem folgada no estado para não reajustar a vista no meio da animação (evita “vai e vem”)
const STATE_BOUNDS_PAD = 0.4

function BoundsLocker({ bounds }: { bounds: LatLngBounds | null }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) {
      map.setMaxBounds(bounds.pad(STATE_BOUNDS_PAD))
      map.setMinZoom(5)
    } else {
      map.setMaxBounds(BRASIL_BOUNDS)
      map.setMinZoom(3)
    }
  }, [bounds, map])
  return null
}

// Centro e zoom fixos para a visão “Brasil inteiro”
const BRASIL_VIEW = { center: [-14.235, -51.925] as [number, number], zoom: 4 }

// Volta para a visão Brasil: transição mais lenta e linear (sem reajuste no meio)
function ResetView({ selectedUF }: { selectedUF: string | null }) {
  const map = useMap()
  useEffect(() => {
    if (!selectedUF) {
      map.invalidateSize()
      requestAnimationFrame(() => {
        map.setView(BRASIL_VIEW.center, BRASIL_VIEW.zoom, {
          animate: true,
          duration: 0.7,
          easeLinearity: 0.92,
        })
      })
    }
  }, [selectedUF, map])
  return null
}

/** Uma única animação de pan+zoom: duração e linearidade para transição direta (sem reajuste de zoom) */
const VIEW_ANIMATION = {
  animate: true,
  duration: 0.75,
  easeLinearity: 0.92,
} as const

const FIT_PADDING_PX = 12
const MAX_ZOOM_STATE = 13

/**
 * Habilita zoom (roda do mouse) e arraste quando um estado está selecionado;
 * desabilita na visão Brasil para manter a navegação fixa.
 */
function ZoomPanWhenStateSelected({ selectedUF }: { selectedUF: string | null }) {
  const map = useMap()
  useEffect(() => {
    if (selectedUF) {
      map.dragging.enable()
      map.scrollWheelZoom.enable()
    } else {
      map.dragging.disable()
      map.scrollWheelZoom.disable()
    }
  }, [selectedUF, map])
  return null
}

/**
 * Ajusta o mapa ao estado com um único setView(centro, zoom): pan e zoom
 * na mesma animação, sem fitBounds (evita reajuste de zoom que causa vibração).
 */
function FitStateToView({
  selectedUF,
  stateBounds,
}: {
  selectedUF: string | null
  stateBounds: LatLngBounds | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!selectedUF || !stateBounds) return

    map.invalidateSize()
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const bounds =
          stateBounds instanceof L.LatLngBounds
            ? stateBounds
            : L.latLngBounds(stateBounds)
        const center = bounds.getCenter()
        const padding = L.point(FIT_PADDING_PX, FIT_PADDING_PX)
        const zoom = Math.min(
          MAX_ZOOM_STATE,
          map.getBoundsZoom(bounds, false, padding)
        )
        map.setView(center, zoom, VIEW_ANIMATION)
      })
    })
    return () => cancelAnimationFrame(rafId)
  }, [selectedUF, stateBounds, map])

  return null
}

interface BrazilMapProps {
  selectedUF: string | null
  selectedCnpj: string | null
  heatmapData: MapaEstadoHeat[]
  orgaos: MapaOrgao[]
  onSelectUF: (uf: string | null) => void
  onSelectOrgao: (cnpj: string) => void
}

export default function BrazilMap({
  selectedUF,
  selectedCnpj,
  heatmapData,
  orgaos,
  onSelectUF,
  onSelectOrgao,
}: BrazilMapProps) {
  const [geoJson, setGeoJson] = useState<GeoJsonObject | null>(null)
  const [geoLoading, setGeoLoading] = useState(true)
  const [stateBounds, setStateBounds] = useState<LatLngBounds | null>(null)

  // Mapa coroplético: { SP: 12, RJ: 8, ... }
  const heatmapCounts: Record<string, number> = {}
  for (const e of heatmapData) heatmapCounts[e.uf] = e.count
  const maxCount = Math.max(...heatmapData.map((e) => e.count), 1)

  // Carregar GeoJSON dos estados (um feature por UF, com properties.sigla) via nossa API
  useEffect(() => {
    const controller = new AbortController()
    apiClient
      .get<GeoJsonObject>('/api/mapa/geojson-estados', { signal: controller.signal })
      .then(({ data }) => {
        setGeoJson(data)
        setGeoLoading(false)
      })
      .catch(() => setGeoLoading(false))

    return () => controller.abort()
  }, [])

  // Ao deselecionar estado, liberar também os bounds
  const handleSelectUF = (uf: string | null) => {
    if (!uf) setStateBounds(null)
    onSelectUF(uf)
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Carregando GeoJSON */}
      {geoLoading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(15, 23, 42, 0.7)',
            zIndex: 1001,
          }}
        >
          <CircularProgress sx={{ color: '#60A5FA' }} />
        </Box>
      )}

      {/* Botão "← Voltar ao Brasil" — aparece sobre o mapa quando estado está selecionado */}
      {selectedUF && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 50, // deslocado para não cobrir os controles de zoom do Leaflet (left: 10)
            zIndex: 1000,
            pointerEvents: 'auto',
          }}
        >
          <Button
            size="small"
            startIcon={<ArrowBackIcon fontSize="small" />}
            onClick={() => handleSelectUF(null)}
            sx={{
              bgcolor: 'rgba(15, 23, 42, 0.92)',
              color: '#94A3B8',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(4px)',
              fontWeight: 600,
              fontSize: '0.75rem',
              px: 1.5,
              py: 0.5,
              borderRadius: 1.5,
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'rgba(27, 79, 216, 0.25)',
                color: '#60A5FA',
                borderColor: 'rgba(96, 165, 250, 0.4)',
              },
            }}
          >
            Brasil
          </Button>
        </Box>
      )}

      <MapContainer
        center={BRASIL_VIEW.center}
        zoom={BRASIL_VIEW.zoom}
        minZoom={3}
        maxZoom={13}
        style={{ width: '100%', height: '100%', background: '#0F172A' }}
        zoomControl={true}
        dragging={false}
        scrollWheelZoom={false}
      >
        {/* Tiles dark — CartoDB Dark Matter (gratuito, sem API key) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        {/* Trava câmera no estado selecionado */}
        <BoundsLocker bounds={stateBounds} />

        {/* Volta ao Brasil quando estado é deselecionado */}
        <ResetView selectedUF={selectedUF} />

        {/* Zoom no estado no espaço disponível (após sidebar ocupar lugar) */}
        <FitStateToView selectedUF={selectedUF} stateBounds={stateBounds} />

        {/* Zoom e pan liberados quando estado selecionado */}
        <ZoomPanWhenStateSelected selectedUF={selectedUF} />

        {/* Estados coloridos como mapa coroplético (substitui o HeatmapLayer) */}
        <StateLayer
          geoJson={geoJson}
          selectedUF={selectedUF}
          heatmapCounts={heatmapCounts}
          maxCount={maxCount}
          onSelectUF={handleSelectUF}
          onSelectBounds={setStateBounds}
        />

        {/* Marcadores de órgãos — só aparecem após selecionar um estado */}
        {selectedUF && orgaos.length > 0 && (
          <OrgaoMarkers
            uf={selectedUF}
            orgaos={orgaos}
            selectedCnpj={selectedCnpj}
            onSelectOrgao={onSelectOrgao}
          />
        )}
      </MapContainer>

      {/* Legenda de cores */}
      {heatmapData.length > 0 && (
        <MapaLegend maxCount={maxCount} />
      )}
    </Box>
  )
}
