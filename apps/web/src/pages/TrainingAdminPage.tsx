import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import SchoolIcon from '@mui/icons-material/School'
import { apiClient } from '../services/apiClient'
import type { AnaliseTipo, RegraTreinamento, ExemploTreinamento, CategoriaDestaque } from '@licita/shared-types'

const TABS: { label: string; tipo: AnaliseTipo }[] = [
  { label: 'Dados Básicos', tipo: 'dados_basicos' },
  { label: 'Valor Estimado', tipo: 'valor_estimado' },
  { label: 'Itens', tipo: 'itens_completos' },
  { label: 'Requisitos', tipo: 'requisitos_tecnicos' },
  { label: 'Viabilidade', tipo: 'viabilidade' },
  { label: 'Resumo', tipo: 'resumo_executivo' },
]

export default function TrainingAdminPage() {
  const [tabIndex, setTabIndex] = useState(0)
  const currentTipo = TABS[tabIndex].tipo

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SchoolIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>Treinamento da IA</Typography>
          <Typography variant="body2" color="text.secondary">
            Configure regras e exemplos para melhorar a qualidade da análise
          </Typography>
        </Box>
      </Box>

      <Tabs
        value={tabIndex}
        onChange={(_e, v) => setTabIndex(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map((tab) => (
          <Tab key={tab.tipo} label={tab.label} />
        ))}
      </Tabs>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <RulesSection tipo={currentTipo} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <ExamplesSection tipo={currentTipo} />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <CategoriesSection />
      </Box>
    </Box>
  )
}

// ─── Seção de Regras ──────────────────────────────────────────

function RulesSection({ tipo }: { tipo: AnaliseTipo }) {
  const [rules, setRules] = useState<RegraTreinamento[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<RegraTreinamento | null>(null)
  const [titulo, setTitulo] = useState('')
  const [regra, setRegra] = useState('')

  const fetchRules = useCallback(async () => {
    const { data } = await apiClient.get(`/api/training/rules?tipo=${tipo}`)
    setRules(data)
  }, [tipo])

  useEffect(() => { fetchRules() }, [fetchRules])

  const handleSave = async () => {
    if (editingRule) {
      await apiClient.put(`/api/training/rules/${editingRule.id}`, { titulo, regra })
    } else {
      await apiClient.post('/api/training/rules', { tipo_analise: tipo, titulo, regra })
    }
    setDialogOpen(false)
    setEditingRule(null)
    setTitulo('')
    setRegra('')
    fetchRules()
  }

  const handleToggle = async (rule: RegraTreinamento) => {
    await apiClient.put(`/api/training/rules/${rule.id}`, { ativa: !rule.ativa })
    fetchRules()
  }

  const handleDelete = async (id: string) => {
    await apiClient.delete(`/api/training/rules/${id}`)
    fetchRules()
  }

  const openEdit = (rule: RegraTreinamento) => {
    setEditingRule(rule)
    setTitulo(rule.titulo)
    setRegra(rule.regra)
    setDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader
        title="Regras Personalizáveis"
        titleTypographyProps={{ fontWeight: 600 }}
        subheader="Regras injetadas no prompt do agente para melhorar a extração"
        action={
          <Button
            startIcon={<AddIcon />}
            size="small"
            onClick={() => {
              setEditingRule(null)
              setTitulo('')
              setRegra('')
              setDialogOpen(true)
            }}
          >
            Nova Regra
          </Button>
        }
      />
      <Divider />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {rules.length === 0 && (
          <Alert severity="info">Nenhuma regra configurada para este tipo de análise.</Alert>
        )}
        {rules.map((rule) => (
          <Box
            key={rule.id}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: rule.ativa ? 'primary.light' : 'divider',
              borderRadius: 2,
              opacity: rule.ativa ? 1 : 0.5,
              bgcolor: rule.ativa ? 'rgba(59,130,246,0.03)' : 'background.default',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="subtitle2" fontWeight={600}>{rule.titulo}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Switch checked={rule.ativa} onChange={() => handleToggle(rule)} size="small" />
                <IconButton size="small" onClick={() => openEdit(rule)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleDelete(rule.id)} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {rule.regra}
            </Typography>
          </Box>
        ))}
      </CardContent>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRule ? 'Editar Regra' : 'Nova Regra'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Título"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            fullWidth
            placeholder="Ex: Regra para nomes de órgãos"
          />
          <TextField
            label="Regra"
            value={regra}
            onChange={(e) => setRegra(e.target.value)}
            multiline
            rows={4}
            fullWidth
            placeholder="Descreva a regra que será injetada no prompt da IA..."
          />
          <Alert severity="info" variant="outlined">
            Esta regra será adicionada à seção "Regras adicionais aprendidas" do prompt do agente de{' '}
            <strong>{TABS.find((t) => t.tipo === tipo)?.label}</strong>.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!titulo || !regra}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

// ─── Seção de Exemplos ────────────────────────────────────────

function ExamplesSection({ tipo }: { tipo: AnaliseTipo }) {
  const [examples, setExamples] = useState<ExemploTreinamento[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [entradaTexto, setEntradaTexto] = useState('')
  const [saidaEsperada, setSaidaEsperada] = useState('')

  const fetchExamples = useCallback(async () => {
    const { data } = await apiClient.get(`/api/training/examples?tipo=${tipo}`)
    setExamples(data)
  }, [tipo])

  useEffect(() => { fetchExamples() }, [fetchExamples])

  const handleSave = async () => {
    let saida: Record<string, unknown>
    try {
      saida = JSON.parse(saidaEsperada)
    } catch {
      return
    }

    await apiClient.post('/api/training/examples', {
      tipo_analise: tipo,
      entrada_texto: entradaTexto,
      saida_esperada: saida,
    })
    setDialogOpen(false)
    setEntradaTexto('')
    setSaidaEsperada('')
    fetchExamples()
  }

  const handleToggleApproval = async (ex: ExemploTreinamento) => {
    await apiClient.put(`/api/training/examples/${ex.id}`, { aprovado: !ex.aprovado })
    fetchExamples()
  }

  const handleDelete = async (id: string) => {
    await apiClient.delete(`/api/training/examples/${id}`)
    fetchExamples()
  }

  return (
    <Card>
      <CardHeader
        title="Exemplos de Referência (Few-Shot)"
        titleTypographyProps={{ fontWeight: 600 }}
        subheader="Exemplos de entrada/saída usados para guiar a IA"
        action={
          <Button
            startIcon={<AddIcon />}
            size="small"
            onClick={() => {
              setEntradaTexto('')
              setSaidaEsperada('')
              setDialogOpen(true)
            }}
          >
            Novo Exemplo
          </Button>
        }
      />
      <Divider />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {examples.length === 0 && (
          <Alert severity="info">Nenhum exemplo configurado para este tipo de análise.</Alert>
        )}
        {examples.map((ex) => (
          <Box
            key={ex.id}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: ex.aprovado ? 'success.light' : 'divider',
              borderRadius: 2,
              bgcolor: ex.aprovado ? 'rgba(16,185,129,0.03)' : 'background.default',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Chip
                icon={ex.aprovado ? <CheckCircleIcon /> : <CancelIcon />}
                label={ex.aprovado ? 'Aprovado' : 'Pendente'}
                color={ex.aprovado ? 'success' : 'default'}
                size="small"
              />
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button
                  size="small"
                  onClick={() => handleToggleApproval(ex)}
                  color={ex.aprovado ? 'warning' : 'success'}
                >
                  {ex.aprovado ? 'Desaprovar' : 'Aprovar'}
                </Button>
                <IconButton size="small" onClick={() => handleDelete(ex.id)} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>Entrada:</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, maxHeight: 80, overflow: 'hidden' }}>
              {ex.entrada_texto.slice(0, 300)}{ex.entrada_texto.length > 300 ? '...' : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>Saída esperada:</Typography>
            <Typography
              variant="body2"
              component="pre"
              sx={{ fontSize: '0.75rem', bgcolor: 'grey.50', p: 1, borderRadius: 1, maxHeight: 120, overflow: 'auto' }}
            >
              {JSON.stringify(ex.saida_esperada, null, 2).slice(0, 500)}
            </Typography>
          </Box>
        ))}
      </CardContent>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Novo Exemplo Few-Shot</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Texto de entrada (trecho do edital)"
            value={entradaTexto}
            onChange={(e) => setEntradaTexto(e.target.value)}
            multiline
            rows={5}
            fullWidth
            placeholder="Cole aqui um trecho de edital como exemplo..."
          />
          <TextField
            label="Saída esperada (JSON)"
            value={saidaEsperada}
            onChange={(e) => setSaidaEsperada(e.target.value)}
            multiline
            rows={8}
            fullWidth
            placeholder='{"campo": "valor_esperado"}'
            error={saidaEsperada.length > 0 && (() => { try { JSON.parse(saidaEsperada); return false } catch { return true } })()}
            helperText="Deve ser um JSON válido representando a saída que a IA deveria produzir"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!entradaTexto || !saidaEsperada || (() => { try { JSON.parse(saidaEsperada); return false } catch { return true } })()}
          >
            Salvar Exemplo
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

// ─── Seção de Categorias de Destaque ──────────────────────────

function CategoriesSection() {
  const [categories, setCategories] = useState<CategoriaDestaque[]>([])
  const [newName, setNewName] = useState('')

  const fetchCategories = useCallback(async () => {
    const { data } = await apiClient.get('/api/training/categories')
    setCategories(data)
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const handleAdd = async () => {
    if (!newName.trim()) return
    await apiClient.post('/api/training/categories', { nome: newName.trim() })
    setNewName('')
    fetchCategories()
  }

  const handleToggle = async (cat: CategoriaDestaque) => {
    await apiClient.put(`/api/training/categories/${cat.id}`, { ativa: !cat.ativa })
    fetchCategories()
  }

  const handleDelete = async (id: string) => {
    await apiClient.delete(`/api/training/categories/${id}`)
    fetchCategories()
  }

  return (
    <Card>
      <CardHeader
        title="Categorias de Destaque"
        titleTypographyProps={{ fontWeight: 600 }}
        subheader="Categorias ativas classificam e destacam itens na tabela do dashboard"
      />
      <Divider />
      <CardContent>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            placeholder="Nova categoria (ex: equipamento)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            sx={{ flex: 1 }}
          />
          <Button variant="contained" onClick={handleAdd} disabled={!newName.trim()} startIcon={<AddIcon />}>
            Adicionar
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.nome}
              color={cat.ativa ? 'primary' : 'default'}
              variant={cat.ativa ? 'filled' : 'outlined'}
              onClick={() => handleToggle(cat)}
              onDelete={() => handleDelete(cat.id)}
              sx={{ opacity: cat.ativa ? 1 : 0.5 }}
            />
          ))}
        </Box>
        {categories.length === 0 && (
          <Alert severity="info" sx={{ mt: 1 }}>Nenhuma categoria configurada.</Alert>
        )}
      </CardContent>
    </Card>
  )
}
