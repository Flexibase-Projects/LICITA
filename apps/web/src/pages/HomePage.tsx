import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Alert from '@mui/material/Alert'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PsychologyIcon from '@mui/icons-material/Psychology'
import InsightsIcon from '@mui/icons-material/Insights'
import { useEditalAnalysis } from '../hooks/useEditalAnalysis'

const ANALYSIS_STEPS = [
  { id: 'extracting', label: 'Extraindo texto' },
  { id: 'chunking', label: 'Processando chunks' },
  { id: 'dados_basicos', label: 'Dados básicos' },
  { id: 'itens_completos', label: 'Extraindo itens' },
  { id: 'requisitos_tecnicos', label: 'Requisitos técnicos' },
  { id: 'viabilidade', label: 'Viabilidade' },
  { id: 'resumo_executivo', label: 'Resumo executivo' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { state, analyzeFile, reset } = useEditalAnalysis()
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== 'application/pdf') return
      analyzeFile(file)
    },
    [analyzeFile]
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  // Navegação ao concluir
  if (state.step === 'completed' && state.editalId) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Card sx={{ textAlign: 'center', p: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} mb={1}>
            Análise Concluída!
          </Typography>
          <Typography color="text.secondary" mb={3}>
            {state.message}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" size="large" onClick={() => navigate(`/editais/${state.editalId}`)}>
              Ver Dashboard do Edital
            </Button>
            <Button variant="outlined" onClick={reset}>
              Analisar Outro
            </Button>
          </Box>
        </Card>
      </Box>
    )
  }

  const isProcessing = state.isUploading || state.isAnalyzing
  const currentStepIndex = ANALYSIS_STEPS.findIndex((s) => s.id === state.step)

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Hero */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Análise Inteligente de Editais
        </Typography>
        <Typography color="text.secondary">
          Faça upload de um edital em PDF e obtenha análise completa em minutos com IA local.
        </Typography>
      </Box>

      {/* Features */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { icon: <PsychologyIcon color="primary" />, title: 'IA Local OLLAMA', desc: 'Análise com llama3.2:3b sem envio de dados para nuvem' },
          { icon: <InsightsIcon color="secondary" />, title: 'Extração Completa', desc: 'Todos os itens, certificações e requisitos mapeados' },
          { icon: <CheckCircleIcon sx={{ color: 'success.main' }} />, title: 'Análise de Viabilidade', desc: 'Score automático baseado no perfil da sua empresa' },
        ].map((f) => (
          <Grid key={f.title} size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                {f.icon}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>{f.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{f.desc}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Upload Zone */}
      {!isProcessing && !state.error && (
        <Card>
          <CardContent>
            <Box
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: dragOver ? 'primary.main' : 'divider',
                borderRadius: 3,
                p: 6,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: dragOver ? 'primary.50' : 'background.default',
                transition: 'all 0.2s ease',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(27,79,216,0.03)' },
              }}
            >
              <UploadFileIcon sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Arraste o PDF do edital aqui
              </Typography>
              <Typography color="text.secondary" mb={2}>
                ou clique para selecionar
              </Typography>
              <Chip label="Apenas arquivos PDF · Máximo 500 MB" variant="outlined" size="small" />
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {isProcessing && (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <PsychologyIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>Analisando com OLLAMA...</Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={state.progress}
              sx={{ mb: 2, height: 8, borderRadius: 4 }}
            />

            <Typography variant="body2" color="text.secondary" mb={3}>
              {state.message}
            </Typography>

            <Stepper activeStep={currentStepIndex} alternativeLabel>
              {ANALYSIS_STEPS.map((step, i) => (
                <Step key={step.id} completed={i < currentStepIndex}>
                  <StepLabel
                    slotProps={{
                      label: { style: { fontSize: '0.7rem' } }
                    }}
                  >
                    {step.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {state.error && (
        <Alert
          severity="error"
          action={<Button onClick={reset} size="small">Tentar Novamente</Button>}
        >
          {state.error}
        </Alert>
      )}
    </Box>
  )
}
