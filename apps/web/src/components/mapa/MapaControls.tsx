import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemText from '@mui/material/ListItemText'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Slider from '@mui/material/Slider'
import RefreshIcon from '@mui/icons-material/Refresh'
import WifiIcon from '@mui/icons-material/Wifi'
import FilterListIcon from '@mui/icons-material/FilterList'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const FILTRO_TERMOS = ['MOBILIÁRIO', 'ASSENTO', 'CADEIRA', 'MESA', 'ARMÁRIO']

const SLIDER_MIN = 0
const SLIDER_MAX = 2_000_000 // 2 milhões
const SLIDER_STEP = 10_000
function formatValorLabel(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mi`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)} mil`
  return String(v)
}

interface MapaControlsProps {
  cacheAgeMinutes: number
  isLoading: boolean
  isRefreshing?: boolean
  onRefresh: () => void
  valorMin: number | ''
  valorMax: number | ''
  preset50k: boolean
  onValorMinChange: (v: number | '') => void
  onValorMaxChange: (v: number | '') => void
  onPreset50k: () => void
  onClearValorFilter: () => void
}

export default function MapaControls({
  cacheAgeMinutes,
  isLoading,
  isRefreshing = false,
  onRefresh,
  valorMin,
  valorMax,
  preset50k,
  onValorMinChange,
  onValorMaxChange,
  onPreset50k,
  onClearValorFilter,
}: MapaControlsProps) {
  const [termosAnchor, setTermosAnchor] = useState<null | HTMLElement>(null)
  const updating = isLoading || isRefreshing
  const hasValorFilter = preset50k || valorMin !== '' || valorMax !== ''
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1,
        bgcolor: '#0F172A',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexWrap: 'wrap',
      }}
    >
      {/* Título: filtro OR = basta 1 termo */}
      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500, fontSize: '0.7rem' }}>
        Filtro (1 termo já inclui):
      </Typography>

      {/* Keywords fixas — Mobiliário OU assento OU cadeira OU mesa OU armário... */}
      {['MOBILIÁRIO', 'ASSENTO', 'CADEIRA', 'MESA', 'ARMÁRIO'].map((kw) => (
        <Chip
          key={kw}
          label={kw}
          size="small"
          sx={{
            bgcolor: 'rgba(14, 164, 114, 0.15)',
            color: '#0EA472',
            border: '1px solid rgba(14, 164, 114, 0.3)',
            fontWeight: 600,
            fontSize: '0.7rem',
          }}
        />
      ))}

      {/* Filtro por valor — slider de intervalo (arrastar bolinhas) + preset e inputs sem setas */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 0.5, flexWrap: 'wrap' }}>
        <FilterListIcon sx={{ color: '#64748B', fontSize: 14 }} />
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
          Valor:
        </Typography>
        <Chip
          size="small"
          label="Acima de R$ 50.000"
          onClick={onPreset50k}
          sx={{
            fontSize: '0.65rem',
            height: 22,
            bgcolor: preset50k ? 'rgba(14, 164, 114, 0.25)' : 'rgba(255,255,255,0.06)',
            color: preset50k ? '#0EA472' : '#94A3B8',
            border: preset50k ? '1px solid rgba(14, 164, 114, 0.5)' : '1px solid rgba(255,255,255,0.08)',
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
          <Slider
            value={[
              valorMin === '' ? 0 : valorMin,
              valorMax === '' ? SLIDER_MAX : Math.min(valorMax, SLIDER_MAX),
            ]}
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            step={SLIDER_STEP}
            onChange={(_, newValue) => {
              const [a, b] = newValue as number[]
              onValorMinChange(a)
              onValorMaxChange(b >= SLIDER_MAX ? '' : b)
            }}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `R$ ${formatValorLabel(v)}`}
            sx={{
              color: '#0EA472',
              width: 140,
              '& .MuiSlider-thumb': { width: 14, height: 14 },
              '& .MuiSlider-valueLabel': { fontSize: '0.65rem' },
            }}
          />
          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
            {valorMin === '' ? '0' : formatValorLabel(valorMin)} – {valorMax === '' ? 'sem máx' : formatValorLabel(valorMax)}
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Mín (R$)"
          type="number"
          value={valorMin === '' ? '' : valorMin}
          onChange={(e) => onValorMinChange(e.target.value === '' ? '' : Number(e.target.value))}
          inputProps={{ min: 0, step: 1000 }}
          sx={{
            width: 88,
            '& .MuiInputBase-input': { fontSize: '0.7rem' },
            '& input[type="number"]::-webkit-inner-spin-button, & input[type="number"]::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
            '& input[type="number"]': { MozAppearance: 'textfield' },
          }}
          InputProps={{
            startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            sx: { bgcolor: 'rgba(15,23,42,0.8)', color: '#E2E8F0', fontSize: '0.7rem', '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' } },
          }}
        />
        <TextField
          size="small"
          placeholder="Máx (R$)"
          type="number"
          value={valorMax === '' ? '' : valorMax}
          onChange={(e) => onValorMaxChange(e.target.value === '' ? '' : Number(e.target.value))}
          inputProps={{ min: 0, step: 1000 }}
          sx={{
            width: 88,
            '& .MuiInputBase-input': { fontSize: '0.7rem' },
            '& input[type="number"]::-webkit-inner-spin-button, & input[type="number"]::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
            '& input[type="number"]': { MozAppearance: 'textfield' },
          }}
          InputProps={{
            startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            sx: { bgcolor: 'rgba(15,23,42,0.8)', color: '#E2E8F0', fontSize: '0.7rem', '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' } },
          }}
        />
        {hasValorFilter && (
          <Chip size="small" label="Limpar" onClick={onClearValorFilter} sx={{ fontSize: '0.65rem', height: 22, bgcolor: 'rgba(255,255,255,0.06)', color: '#94A3B8' }} />
        )}
      </Box>

      <Box sx={{ flex: 1 }} />

      {/* Status: indicador "Atualizando" ou idade do cache — cores para tema escuro */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        {updating ? (
          <>
            <RefreshIcon sx={{ fontSize: 14, color: '#93C5FD', animation: 'refresh-spin 0.9s linear infinite' }} />
            <Typography variant="caption" sx={{ color: '#93C5FD', fontSize: '0.7rem', fontWeight: 600 }}>
              Atualizando…
            </Typography>
          </>
        ) : (
          <>
            <WifiIcon sx={{ fontSize: 14, color: cacheAgeMinutes < 5 ? '#4ADE80' : '#FBBF24' }} />
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
              {cacheAgeMinutes === 0 ? 'Ao vivo' : cacheAgeMinutes >= 60 ? `Atualizado há ${Math.floor(cacheAgeMinutes / 60)} h` : `Atualizado há ${cacheAgeMinutes} min`}
            </Typography>
          </>
        )}
      </Box>

      {/* Botão refresh — ícone gira quando atualizando (automático ou ao clicar) */}
      <Tooltip title={updating ? 'Atualizando editais por estado…' : 'Atualizar dados agora (automático a cada 1 hora)'}>
        <span>
          <IconButton
            size="small"
            onClick={onRefresh}
            disabled={updating}
            className={updating ? 'refresh-icon-spin' : undefined}
            sx={{
              color: updating ? '#93C5FD' : '#94A3B8',
              '&:hover': { color: updating ? '#93C5FD' : '#E2E8F0' },
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  )
}
