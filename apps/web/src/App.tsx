import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Map from './pages/Map'

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()
  
  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App