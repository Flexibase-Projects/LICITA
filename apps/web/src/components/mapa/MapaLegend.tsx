import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

interface MapaLegendProps {
  maxCount: number
}

export default function MapaLegend({ maxCount }: MapaLegendProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 24,
        left: 12,
        zIndex: 1000,
        bgcolor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 2,
        p: 1.5,
        minWidth: 160,
        pointerEvents: 'none',
      }}
    >
      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1, fontWeight: 600 }}>
        Editais de Mobiliário
      </Typography>

      {/* Gradiente de cor */}
      <Box
        sx={{
          height: 10,
          borderRadius: 1,
          background: 'linear-gradient(to right, #22C55E, #EAB308, #F97316, #DC2626)',
          mb: 0.5,
        }}
      />

      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>0</Typography>
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
          {Math.round(maxCount / 2)}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
          {maxCount}+
        </Typography>
      </Stack>

      {/* Marcadores de órgãos */}
      <Box sx={{ mt: 1.5 }}>
        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 0.5, fontWeight: 600 }}>
          Órgãos por Atividade
        </Typography>
        {[
          { color: '#22C55E', label: '1 edital' },
          { color: '#F59E0B', label: '2–4 editais' },
          { color: '#DC2626', label: '5+ editais' },
        ].map(({ color, label }) => (
          <Stack key={label} direction="row" alignItems="center" gap={0.75} sx={{ mb: 0.25 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, border: '1.5px solid #fff', flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: '#CBD5E1', fontSize: '0.65rem' }}>{label}</Typography>
          </Stack>
        ))}
      </Box>
    </Box>
  )
}
