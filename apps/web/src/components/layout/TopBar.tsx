import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Avatar from '@mui/material/Avatar'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutIcon from '@mui/icons-material/Logout'
import { supabase } from '../../services/supabaseClient'
import { useNavigate, useLocation } from 'react-router-dom'

const BREADCRUMBS: Record<string, string> = {
  '/': 'Início',
  '/editais': 'Meus Editais',
  '/pncp': 'Portal PNCP',
  '/mapa': 'Mapa de Prospecção',
  '/admin/treinamento': 'Treinamento IA',
}

interface TopBarProps {
  onToggleSidebar: () => void
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const title = BREADCRUMBS[pathname] ?? 'Dashboard do Edital'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <AppBar position="sticky" sx={{ zIndex: (t) => t.zIndex.drawer - 1 }}>
      <Toolbar sx={{ gap: 1 }}>
        <Tooltip title="Recolher menu">
          <IconButton onClick={onToggleSidebar} size="small" sx={{ color: 'text.secondary' }}>
            <MenuIcon />
          </IconButton>
        </Tooltip>

        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', flex: 1 }}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
            U
          </Avatar>
          <Tooltip title="Sair">
            <IconButton onClick={handleLogout} size="small" sx={{ color: 'text.secondary' }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
