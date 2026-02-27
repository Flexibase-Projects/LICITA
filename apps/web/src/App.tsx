import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './services/supabaseClient'
import AppShell from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import EditalListPage from './pages/EditalListPage'
import EditalDashboardPage from './pages/EditalDashboardPage'
import PNCPBrowserPage from './pages/PNCPBrowserPage'
import TrainingAdminPage from './pages/TrainingAdminPage'
import MapaPage from './pages/MapaPage'
import OperacaoConfigPage from './pages/OperacaoConfigPage'
import ViabilidadeLogisticaPage from './pages/ViabilidadeLogisticaPage'
import ParametrosPage from './pages/ParametrosPage'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null // Carregando
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <AuthGuard>
            <AppShell>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/operacao" element={<OperacaoConfigPage />} />
                <Route path="/editais" element={<EditalListPage />} />
                <Route path="/editais/viabilidade-logistica" element={<ViabilidadeLogisticaPage />} />
                <Route path="/editais/:id" element={<EditalDashboardPage />} />
                <Route path="/pncp" element={<PNCPBrowserPage />} />
                <Route path="/admin/treinamento" element={<TrainingAdminPage />} />
                <Route path="/admin/parametros" element={<ParametrosPage />} />
                <Route path="/mapa" element={<MapaPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </AuthGuard>
        }
      />
    </Routes>
  )
}
