import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Rating from '@mui/material/Rating'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import StarIcon from '@mui/icons-material/Star'
import { apiClient } from '../../services/apiClient'
import type { AnaliseTipo } from '@licita/shared-types'

const LABELS: Record<number, string> = {
  1: 'Péssimo',
  2: 'Ruim',
  3: 'Regular',
  4: 'Bom',
  5: 'Excelente',
}

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
  editalId: string
  tipoAnalise: AnaliseTipo
  labelAnalise: string
}

export default function FeedbackModal({ open, onClose, editalId, tipoAnalise, labelAnalise }: FeedbackModalProps) {
  const [nota, setNota] = useState<number | null>(null)
  const [hover, setHover] = useState(-1)
  const [comentario, setComentario] = useState('')
  const [correcoes, setCorrecoes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      let parsedCorrecoes = {}
      if (correcoes.trim()) {
        try {
          parsedCorrecoes = JSON.parse(correcoes)
        } catch {
          parsedCorrecoes = { texto_livre: correcoes }
        }
      }

      await apiClient.post('/api/feedback', {
        edital_id: editalId,
        tipo_analise: tipoAnalise,
        nota,
        comentario: comentario || null,
        correcoes: parsedCorrecoes,
      })
      onClose()
      setNota(null)
      setComentario('')
      setCorrecoes('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Avaliar: {labelAnalise}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <Box>
          <Typography variant="subtitle2" gutterBottom>Nota da qualidade</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Rating
              value={nota}
              onChange={(_e, newValue) => setNota(newValue)}
              onChangeActive={(_e, newHover) => setHover(newHover)}
              emptyIcon={<StarIcon style={{ opacity: 0.3 }} fontSize="inherit" />}
              size="large"
            />
            {nota !== null && (
              <Typography variant="body2" color="text.secondary">
                {LABELS[hover !== -1 ? hover : nota]}
              </Typography>
            )}
          </Box>
        </Box>

        <TextField
          label="Comentário"
          multiline
          rows={3}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="O que pode melhorar? O que estava correto?"
          fullWidth
        />

        <TextField
          label="Correções (opcional)"
          multiline
          rows={3}
          value={correcoes}
          onChange={(e) => setCorrecoes(e.target.value)}
          placeholder="Descreva as correções necessárias na análise..."
          fullWidth
          helperText="Descreva o que a IA deveria ter retornado diferente"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={!nota || saving}>
          {saving ? 'Salvando...' : 'Enviar Feedback'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
