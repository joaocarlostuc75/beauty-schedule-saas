import React, { useState, useEffect } from 'react'
import { FiUsers, FiCalendar, FiDollarSign, FiTrendingUp } from 'react-icons/fi'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'

const AdminDashboard = () => {
  const { salon } = useAuthStore()
  const [stats, setStats] = useState({
    todayAppointments: 0,
    weekAppointments: 0,
    revenue: 0,
    completionRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth-storage') 
        ? JSON.parse(localStorage.getItem('auth-storage')).state.token 
        : null

      const response = await axios.get('/api/reports/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    {
      icon: FiCalendar,
      title: 'Agendamentos Hoje',
      value: stats.todayAppointments,
      color: 'primary'
    },
    {
      icon: FiUsers,
      title: 'Agendamentos Semana',
      value: stats.weekAppointments,
      color: 'secondary'
    },
    {
      icon: FiDollarSign,
      title: 'Receita Confirmada',
      value: `R$ ${stats.revenue.toFixed(2)}`,
      color: 'green'
    },
    {
      icon: FiTrendingUp,
      title: 'Taxa de Conclusão',
      value: `${stats.completionRate}%`,
      color: 'blue'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-800">
          Dashboard
        </h1>
        <span className="text-sm text-gray-500">
          {salon?.name}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <div key={index} className="card hover:shadow-glow transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800">
                  {loading ? '...' : card.value}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${card.color}-100`}>
                <card.icon className={`text-${card.color}-500`} size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">
          Bem-vindo ao Beauty Schedule
        </h2>
        <p className="text-gray-600 leading-relaxed">
          Use o menu lateral para navegar entre as funcionalidades:
        </p>
        <ul className="mt-4 space-y-2 text-gray-600">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary-400 rounded-full"></span>
            <strong>Agenda</strong> - Gerencie agendamentos e envie notificações WhatsApp
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-secondary-400 rounded-full"></span>
            <strong>Serviços</strong> - Cadastre procedimentos com duração e preço
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <strong>Relatórios</strong> - Visualize receita e estatísticas
          </li>
        </ul>
      </div>
    </div>
  )
}

export default AdminDashboard