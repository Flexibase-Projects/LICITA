import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Fade from '@mui/material/Fade'
import Divider from '@mui/material/Divider'
import RefreshIcon from '@mui/icons-material/Refresh'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CloseIcon from '@mui/icons-material/Close'

export interface RefreshStatsState {
  phase: 'refreshing' | 'done'
  done: number
  total: number
  lastUF: string
  totalFetched: number
  totalDiscarded: number
  totalSelected: number
}

interface RefreshStatsPanelProps {
  state: RefreshStatsState | null
  onDismiss: () => void
}

export default function RefreshStatsPanel({ state, onDismiss }: RefreshStatsPanelProps) {
  const visible = state !== null

  return (
    <Fade in={visible} timeout={300}>
      <Box
        sx={{
          position: 'fixed',
          top: 72,
          right: 16,
          zIndex: 1400,
          width: 240,
          bgcolor: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(96, 165, 250, 0.35)',
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          p: 1.5,
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
          {state?.phase === 'done' ? (
            <CheckCircleOutlineIcon sx={{ fontSize: 16, color: '#4ADE80' }} />
          ) : (
            <RefreshIcon
              className="refresh-icon-spin"
              sx={{ fontSize: 16, color: '#93C5FD' }}
            />
          )}
          <Typography
            variant="caption"
            sx={{
              color: state?.phase === 'done' ? '#4ADE80' : '#93C5FD',
              fontWeight: 700,
              fontSize: '0.75rem',
              flex: 1,
            }}
          >
            {state?.phase === 'done' ? 'Atualizado' : 'Atualizando…'}
          </Typography>
          <IconButton size="small" onClick={onDismiss} sx={{ color: '#64748B', p: 0.25 }}>
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>

        {/* Progresso — só durante refresh */}
        {state?.phase === 'refreshing' && (
          <Box sx={{ mb: 1 }}>
            <LinearProgress
              variant="determinate"
              value={state.total > 0 ? (state.done / state.total) * 100 : 0}
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: 'rgba(96, 165, 250, 0.15)',
                '& .MuiLinearProgress-bar': { bgcolor: '#60A5FA', borderRadius: 2 },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
                {state.lastUF ? `${state.lastUF} concluído` : 'Iniciando…'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#60A5FA', fontWeight: 700, fontSize: '0.65rem' }}>
                {state.done}/{state.total}
              </Typography>
            </Box>
          </Box>
        )}

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 1 }} />

        {/* Contadores */}
        <StatRow label="Encontrados" value={state?.totalFetched ?? 0} color="#60A5FA" />
        <StatRow label="Descartados" value={state?.totalDiscarded ?? 0} color="#94A3B8" />
        <StatRow label="Selecionados" value={state?.totalSelected ?? 0} color="#4ADE80" />
      </Box>
    </Fade>
  )
}

function StatRow({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.25 }}>
      <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.75rem' }}>
        {label}
      </Typography>
      <Typography variant="caption" sx={{ color: color ?? '#E2E8F0', fontWeight: 700, fontSize: '0.75rem' }}>
        {value.toLocaleString('pt-BR')}
      </Typography>
    </Box>
  )
}
