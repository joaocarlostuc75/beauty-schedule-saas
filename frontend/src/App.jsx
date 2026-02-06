import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Public Pages
import SplashScreen from './pages/Public/SplashScreen'
import BookingPage from './pages/Public/BookingPage'
import BookingSuccess from './pages/Public/BookingSuccess'
import ManageBooking from './pages/Public/ManageBooking'

// Admin Pages
import AdminLogin from './pages/Admin/AdminLogin'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminSchedule from './pages/Admin/AdminSchedule'
import AdminServices from './pages/Admin/AdminServices'
import AdminClients from './pages/Admin/AdminClients'
import AdminReports from './pages/Admin/AdminReports'
import AdminSettings from './pages/Admin/AdminSettings'
import AdminUsers from './pages/Admin/AdminUsers'

// Components
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<SplashScreen />} />
      <Route path="/agendar" element={<BookingPage />} />
      <Route path="/agendamento/sucesso" element={<BookingSuccess />} />
      <Route path="/agendamento/gerenciar" element={<ManageBooking />} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/*" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="agenda" element={<AdminSchedule />} />
        <Route path="servicos" element={<AdminServices />} />
        <Route path="clientes" element={<AdminClients />} />
        <Route path="relatorios" element={<AdminReports />} />
        <Route path="configuracoes" element={<AdminSettings />} />
        <Route path="usuarios" element={<AdminUsers />} />
      </Route>
    </Routes>
  )
}

export default App