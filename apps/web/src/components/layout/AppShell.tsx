import { useState } from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Sidebar from './Sidebar'

/** Larguras padrão Flexbase: 72px recolhida, 240px expandida */
const SIDEBAR_WIDTH_EXPANDED = 240
const SIDEBAR_WIDTH_COLLAPSED = 72

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const toggleSidebar = () => setSidebarOpen((v) => !v)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar (expandir/recolher pelo botão dentro da própria sidebar) */}
      <Drawer
        variant="permanent"
        sx={{
          width: sidebarOpen ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sidebarOpen ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
          },
        }}
      >
        <Sidebar collapsed={!sidebarOpen} onToggleCollapsed={toggleSidebar} />
      </Drawer>

      {/* Área principal (sem header — título, usuário e sair ficam na sidebar) */}
      <Box component="main" sx={{ flex: 1, p: 3, overflow: 'auto', minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  )
}
