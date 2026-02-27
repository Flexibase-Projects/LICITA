import { useNavigate, useLocation } from 'react-router-dom'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import HomeIcon from '@mui/icons-material/Home'
import ListAltIcon from '@mui/icons-material/ListAlt'
import SearchIcon from '@mui/icons-material/Search'
import SchoolIcon from '@mui/icons-material/School'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import MapIcon from '@mui/icons-material/Map'
import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import HelpIcon from '@mui/icons-material/Help'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'
import { supabase } from '../../services/supabaseClient'

/** Seções da sidebar agrupadas por área/agente (padrão Flexbase) */
type NavItem = { id: string; label: string; path: string; icon: React.ElementType }

const SIDEBAR_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'PRINCIPAL',
    items: [{ id: 'home', label: 'Início', path: '/', icon: HomeIcon }],
  },
  {
    title: 'EDITAIS',
    items: [{ id: 'editais', label: 'Meus Editais', path: '/editais', icon: ListAltIcon }],
  },
  {
    title: 'PROSPECÇÃO',
    items: [
      { id: 'pncp', label: 'Buscar no PNCP', path: '/pncp', icon: SearchIcon },
      { id: 'mapa', label: 'Mapa de Prospecção', path: '/mapa', icon: MapIcon },
    ],
  },
  {
    title: 'ADMINISTRAÇÃO',
    items: [{ id: 'treinamento', label: 'Treinamento IA', path: '/admin/treinamento', icon: SchoolIcon }],
  },
]

const borderColor = 'rgba(255,255,255,0.08)'
const textMuted = 'rgba(241,245,249,0.7)'
const hoverBg = 'rgba(255,255,255,0.08)'
const activeBg = 'rgba(59, 130, 246, 0.2)'
const activeColor = '#60A5FA'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapsed?: () => void
  appName?: string
  appSubtitle?: string
  onLogout?: () => void | Promise<void>
  logoutRedirectPath?: string
  /** Se o app tiver tema claro/escuro, passar para o botão Tema do rodapé */
  themeMode?: 'light' | 'dark'
  onThemeToggle?: () => void
}

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  appName = 'LICITA-Pro',
  appSubtitle = 'Análise de editais',
  onLogout,
  logoutRedirectPath = '/login',
  themeMode = 'light',
  onThemeToggle,
}: SidebarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout()
    } else {
      await supabase.auth.signOut()
    }
    navigate(logoutRedirectPath, { replace: true })
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0F172A',
        color: '#F1F5F9',
        borderRight: `1px solid ${borderColor}`,
        transition: 'width 0.3s ease',
      }}
    >
      {/* Header */}
      {collapsed ? (
        <Box sx={{ borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
          <Box sx={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AccountBalanceIcon sx={{ fontSize: 18, color: 'white' }} />
            </Box>
          </Box>
          <Box sx={{ borderTop: `1px solid ${borderColor}` }} />
          {onToggleCollapsed && (
            <Tooltip title="Expandir" placement="right">
              <Box
                component="button"
                onClick={onToggleCollapsed}
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 1.25,
                  border: 'none',
                  background: 'transparent',
                  color: textMuted,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: hoverBg, color: '#F1F5F9' },
                  transition: 'background-color 0.2s, color 0.2s',
                }}
              >
                <MenuIcon sx={{ fontSize: 22 }} />
              </Box>
            </Tooltip>
          )}
          <Box sx={{ borderTop: `1px solid ${borderColor}` }} />
        </Box>
      ) : (
        <Box
          sx={{
            borderBottom: `1px solid ${borderColor}`,
            flexShrink: 0,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            px: 2,
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AccountBalanceIcon sx={{ fontSize: 18, color: 'white' }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#F1F5F9',
                  lineHeight: 1.25,
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {appName}
              </Typography>
              <Typography
                sx={{
                  fontSize: '9px',
                  color: textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {appSubtitle}
              </Typography>
            </Box>
          </Box>
          {onToggleCollapsed && (
            <Tooltip title="Recolher" placement="right">
              <Box
                component="button"
                onClick={onToggleCollapsed}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 0.75,
                  borderRadius: 1,
                  border: 'none',
                  background: 'transparent',
                  color: textMuted,
                  cursor: 'pointer',
                  flexShrink: 0,
                  '&:hover': { bgcolor: hoverBg, color: '#F1F5F9' },
                  transition: 'background-color 0.2s, color 0.2s',
                }}
              >
                <ChevronLeftIcon sx={{ fontSize: 18 }} />
              </Box>
            </Tooltip>
          )}
        </Box>
      )}

      {/* Navegação por seções (agentes/áreas) */}
      <List sx={{ flex: 1, overflowY: 'auto', py: 1.5, px: collapsed ? 1 : 1.5 }}>
        {SIDEBAR_SECTIONS.map((section) => (
          <Box key={section.title} sx={{ mb: 2 }}>
            {!collapsed && (
              <Typography
                sx={{
                  fontSize: '10px',
                  fontWeight: 500,
                  color: textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  mb: 0.75,
                  px: 1,
                }}
              >
                {section.title}
              </Typography>
            )}
            {section.items.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
              return (
                <ListItem key={item.id} disablePadding sx={{ mb: 0.25 }}>
                  <Tooltip title={collapsed ? item.label : ''} placement="right">
                    <ListItemButton
                      onClick={() => navigate(item.path)}
                      sx={{
                        borderRadius: 1,
                        py: 0.75,
                        px: collapsed ? 1.5 : 1.5,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        minHeight: 36,
                        bgcolor: isActive ? activeBg : 'transparent',
                        color: isActive ? activeColor : textMuted,
                        '&:hover': {
                          bgcolor: isActive ? 'rgba(59, 130, 246, 0.25)' : hoverBg,
                          color: isActive ? activeColor : '#F1F5F9',
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
                        <Icon sx={{ fontSize: 18 }} />
                      </ListItemIcon>
                      {!collapsed && (
                        <>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                              fontSize: '0.75rem',
                              fontWeight: isActive ? 600 : 400,
                            }}
                            sx={{ '& .MuiListItemText-primary': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}
                          />
                          {isActive && (
                            <Box
                              sx={{
                                ml: 'auto',
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: 'white',
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </>
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              )
            })}
          </Box>
        ))}
      </List>

      {/* Rodapé: Tema, Ajuda, Sair */}
      <Box
        sx={{
          borderTop: `1px solid ${borderColor}`,
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.25,
          flexShrink: 0,
          ...(collapsed && { alignItems: 'center' }),
        }}
      >
        {onThemeToggle && (
          <Tooltip title={collapsed ? (themeMode === 'dark' ? 'Modo Claro' : 'Modo Escuro') : ''} placement="right">
            <Box
              component="button"
              onClick={onThemeToggle}
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                border: 'none',
                background: 'transparent',
                color: textMuted,
                cursor: 'pointer',
                ...(collapsed && { justifyContent: 'center', px: 1 }),
                '&:hover': { bgcolor: hoverBg, color: '#F1F5F9' },
                transition: 'background-color 0.2s, color 0.2s',
              }}
            >
              {themeMode === 'dark' ? (
                <Brightness7Icon sx={{ fontSize: 18 }} />
              ) : (
                <Brightness4Icon sx={{ fontSize: 18 }} />
              )}
              {!collapsed && (
                <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                  {themeMode === 'dark' ? 'Claro' : 'Escuro'}
                </Typography>
              )}
            </Box>
          </Tooltip>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
          <Tooltip title={collapsed ? 'Ajuda' : ''} placement="right">
            <Box
              component="button"
              onClick={() => {}}
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                border: 'none',
                background: 'transparent',
                color: textMuted,
                cursor: 'pointer',
                minWidth: 0,
                ...(collapsed && { justifyContent: 'center', flex: 'none', px: 1 }),
                '&:hover': { bgcolor: hoverBg, color: '#F1F5F9' },
                transition: 'background-color 0.2s, color 0.2s',
              }}
            >
              <HelpIcon sx={{ fontSize: 18 }} />
              {!collapsed && (
                <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                  Ajuda
                </Typography>
              )}
            </Box>
          </Tooltip>
          <Typography
            component="span"
            sx={{ fontSize: '0.6875rem', color: 'rgba(241,245,249,0.45)', flexShrink: 0 }}
          >
            v1.0.0
          </Typography>
        </Box>
        <Tooltip title={collapsed ? 'Sair' : ''} placement="right">
          <Box
            component="button"
            onClick={handleLogout}
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.75,
              borderRadius: 1,
              border: 'none',
              background: 'transparent',
              color: 'rgba(239, 68, 68, 0.8)',
              cursor: 'pointer',
              ...(collapsed && { justifyContent: 'center', px: 1 }),
              '&:hover': {
                bgcolor: 'rgba(239, 68, 68, 0.12)',
                color: 'rgba(248, 113, 113, 1)',
              },
              transition: 'background-color 0.2s, color 0.2s',
            }}
          >
            <ExitToAppIcon sx={{ fontSize: 18 }} />
            {!collapsed && (
              <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                Sair
              </Typography>
            )}
          </Box>
        </Tooltip>
      </Box>
    </Box>
  )
}
