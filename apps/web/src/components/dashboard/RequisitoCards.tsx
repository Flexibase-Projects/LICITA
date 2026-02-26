import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import GavelIcon from '@mui/icons-material/Gavel'
import EngineeringIcon from '@mui/icons-material/Engineering'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import DescriptionIcon from '@mui/icons-material/Description'
import ScienceIcon from '@mui/icons-material/Science'
import ShieldIcon from '@mui/icons-material/Shield'
import ScheduleIcon from '@mui/icons-material/Schedule'
import type { RequisitoEdital, RequisitoCategoria } from '@licita/shared-types'

const CATEGORIA_CONFIG: Record<RequisitoCategoria, { label: string; icon: React.ReactNode; color: string }> = {
  habilitacao_juridica: { label: 'Habilitação Jurídica', icon: <GavelIcon />, color: '#3B82F6' },
  qualificacao_tecnica: { label: 'Qualificação Técnica', icon: <EngineeringIcon />, color: '#8B5CF6' },
  qualificacao_economica: { label: 'Qualificação Econômica', icon: <AccountBalanceWalletIcon />, color: '#F59E0B' },
  documentos_fiscais: { label: 'Documentos Fiscais', icon: <DescriptionIcon />, color: '#10B981' },
  requisitos_amostra: { label: 'Amostras e Ensaios', icon: <ScienceIcon />, color: '#EC4899' },
  garantias: { label: 'Garantias', icon: <ShieldIcon />, color: '#EF4444' },
  prazos_importantes: { label: 'Prazos Importantes', icon: <ScheduleIcon />, color: '#F97316' },
}

const DIFICULDADE_COLOR: Record<string, 'success' | 'warning' | 'error'> = {
  baixa: 'success',
  media: 'warning',
  alta: 'error',
}

interface RequisitoCardsProps {
  requisitos: RequisitoEdital[]
}

export default function RequisitoCards({ requisitos }: RequisitoCardsProps) {
  const grouped = requisitos.reduce<Record<string, RequisitoEdital[]>>((acc, req) => {
    if (!acc[req.categoria]) acc[req.categoria] = []
    acc[req.categoria].push(req)
    return acc
  }, {})

  const categoriasOrdenadas = Object.keys(CATEGORIA_CONFIG).filter(
    (cat) => grouped[cat] && grouped[cat].length > 0
  ) as RequisitoCategoria[]

  if (categoriasOrdenadas.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        Nenhum requisito identificado neste edital.
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {categoriasOrdenadas.map((cat) => {
        const config = CATEGORIA_CONFIG[cat]
        const items = grouped[cat]

        return (
          <Accordion key={cat} defaultExpanded={cat === 'qualificacao_tecnica'} disableGutters>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5 },
              }}
            >
              <Box sx={{ color: config.color, display: 'flex', alignItems: 'center' }}>{config.icon}</Box>
              <Typography fontWeight={600}>{config.label}</Typography>
              <Chip label={items.length} size="small" sx={{ ml: 'auto', mr: 1 }} />
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {items.map((req) => (
                  <Box
                    key={req.id}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: req.obrigatorio ? 'error.light' : 'divider',
                      borderRadius: 2,
                      bgcolor: req.obrigatorio ? 'rgba(239,68,68,0.03)' : 'background.default',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                      <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
                        {req.descricao}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip
                          label={req.obrigatorio ? 'Obrigatório' : 'Opcional'}
                          color={req.obrigatorio ? 'error' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={req.dificuldade}
                          color={DIFICULDADE_COLOR[req.dificuldade] ?? 'default'}
                          size="small"
                        />
                      </Box>
                    </Box>
                    {req.observacao && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {req.observacao}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Box>
  )
}
