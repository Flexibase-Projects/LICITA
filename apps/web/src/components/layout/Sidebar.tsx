import { useNavigate, useLocation } from 'react-router-dom'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import HomeIcon from '@mui/icons-material/Home'
import ListAltIcon from '@mui/icons-material/ListAlt'
import SearchIcon from '@mui/icons-material/Search'
import SchoolIcon from '@mui/icons-material/School'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import MapIcon from '@mui/icons-material/Map'

const NAV_ITEMS = [
  { label: 'Início', icon: <HomeIcon />, path: '/' },
  { label: 'Meus Editais', icon: <ListAltIcon />, path: '/editais' },
  { label: 'Buscar no PNCP', icon: <SearchIcon />, path: '/pncp' },
  { label: 'Mapa de Prospecção', icon: <MapIcon />, path: '/mapa' },
  { label: 'Treinamento IA', icon: <SchoolIcon />, path: '/admin/treinamento' },
]

interface SidebarProps {
  collapsed: boolean
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          px: collapsed ? 1.5 : 2.5,
          gap: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <AccountBalanceIcon sx={{ color: '#60A5FA', fontSize: 28, flexShrink: 0 }} />
        {!collapsed && (
          <Typography variant="h6" sx={{ color: '#F1F5F9', fontWeight: 700, letterSpacing: '-0.01em' }}>
            LICITA-Pro
          </Typography>
        )}
      </Box>

      {/* Navegação */}
      <List sx={{ px: collapsed ? 0.5 : 1, py: 1.5, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={collapsed ? item.label : ''} placement="right">
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    minHeight: 44,
                    px: collapsed ? 1.5 : 2,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    bgcolor: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    color: active ? '#60A5FA' : 'rgba(241,245,249,0.7)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.08)',
                      color: '#F1F5F9',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? 0 : 36,
                      color: 'inherit',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400 }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          )
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* Versão */}
      {!collapsed && (
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" sx={{ color: 'rgba(241,245,249,0.3)' }}>
            v1.0 · OLLAMA llama3.2:3b
          </Typography>
        </Box>
      )}
    </Box>
  )
}
