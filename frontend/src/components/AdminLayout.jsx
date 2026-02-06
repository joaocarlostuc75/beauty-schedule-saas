import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { 
  FiHome, FiCalendar, FiScissors, FiUsers, 
  FiBarChart2, FiSettings, FiUserPlus, FiLogOut, FiMenu 
} from 'react-icons/fi'

const AdminLayout = () => {
  const navigate = useNavigate()
  const { user, salon, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const navItems = [
    { path: '/admin', icon: FiHome, label: 'Dashboard' },
    { path: '/admin/agenda', icon: FiCalendar, label: 'Agenda' },
    { path: '/admin/servicos', icon: FiScissors, label: 'Serviços' },
    { path: '/admin/clientes', icon: FiUsers, label: 'Clientes' },
    { path: '/admin/relatorios', icon: FiBarChart2, label: 'Relatórios' },
    { path: '/admin/configuracoes', icon: FiSettings, label: 'Configurações' },
  ]

  // Só admin vê gerenciamento de usuários
  if (user?.role === 'ADMIN') {
    navItems.push({ path: '/admin/usuarios', icon: FiUserPlus, label: 'Usuários' })
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-soft transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {salon?.logo_url ? (
              <img src={salon.logo_url} alt={salon.name} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <span className="text-primary-500 font-bold text-lg">B</span>
              </div>
            )}
            <h1 className="font-display font-semibold text-gray-800 text-lg">Beauty</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500">
            <FiMenu size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-primary-50 text-primary-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
                }
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
              <span className="text-secondary-400 font-medium">{user?.name?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role === 'ADMIN' ? 'Administrador' : 'Funcionário'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <FiLogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <FiMenu size={24} />
          </button>
          <span className="font-display font-semibold">Beauty Schedule</span>
          <div className="w-6" />
        </header>
        
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default AdminLayout