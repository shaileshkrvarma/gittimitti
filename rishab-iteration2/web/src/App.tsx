import { AppBar, Box, Button, CircularProgress, Container, Toolbar, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { Link as RouterLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import { dashboardPath } from './roles'
import { APP_NAME } from './constants'
import type { Role } from './types'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MarketplacePage from './pages/MarketplacePage'
import QuoteRequestPage from './pages/QuoteRequestPage'
import EnquiryPage from './pages/EnquiryPage'
import OrderPage from './pages/OrderPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/admin/AdminPage'
import SupplierPage from './pages/supplier/SupplierPage'

function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <CircularProgress sx={{ m: 4 }} />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={dashboardPath(user.role)} replace />
  return <>{children}</>
}

export default function App() {
  const { user, logout } = useAuth()

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ gap: 1 }}>
          <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
            {APP_NAME}
          </Typography>
          <Button color="inherit" component={RouterLink} to="/">
            Marketplace
          </Button>
          <Button color="inherit" component={RouterLink} to="/enquiry">
            Enquiry
          </Button>
          {user ? (
            <>
              <Button color="inherit" component={RouterLink} to={dashboardPath(user.role)}>
                Dashboard
              </Button>
              <Button color="inherit" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 3 }}>
        <Box>
          <Routes>
            <Route path="/" element={<MarketplacePage />} />
            <Route path="/suppliers" element={<Navigate to="/?by=supplier" replace />} />
            <Route path="/enquiry" element={<EnquiryPage />} />
            <Route path="/quote/:productId" element={<RequireAuth roles={['user', 'admin']}><QuoteRequestPage /></RequireAuth>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/orders/:id" element={<RequireAuth roles={['user', 'admin']}><OrderPage /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth roles={['user', 'admin']}><DashboardPage /></RequireAuth>} />
            <Route path="/supplier/*" element={<RequireAuth roles={['supplier']}><SupplierPage /></RequireAuth>} />
            <Route path="/admin/*" element={<RequireAuth roles={['admin']}><AdminPage /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Container>
    </>
  )
}
