import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { FiCalendar, FiDollarSign, FiTrendingUp, FiX } from 'react-icons/fi'
import { formatCurrency } from '../../utils/helpers'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    revenue: 0,
    cancellationRate: 0,
  })
  const [chartData, setChartData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get('/admin/dashboard')
      setStats(data.stats)
      setChartData(data.charts)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Carregando...</div>
      </div>
    )
  }

  const lineChartData = {
    labels: chartData?.appointments.labels || [],
    datasets: [
      {
        label: 'Agendamentos',
        data: chartData?.appointments.data || [],
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        tension: 0.4,
      },
    ],
  }

  const doughnutChartData = {
    labels: chartData?.services.labels || [],
    datasets: [
      {
        data: chartData?.services.data || [],
        backgroundColor: [
          'rgba(236, 72, 153, 0.8)',
          'rgba(167, 139, 250, 0.8)',
          'rgba(251, 207, 232, 0.8)',
          'rgba(196, 181, 253, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Visão geral do seu salão</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 font-medium">Hoje</span>
            <FiCalendar className="text-primary-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.today}</p>
          <p className="text-sm text-gray-600 mt-1">agendamentos</p>
        </div>

        <div className="card bg-gradient-to-br from-secondary-50 to-secondary-100 border border-secondary-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 font-medium">Esta Semana</span>
            <FiTrendingUp className="text-secondary-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.week}</p>
          <p className="text-sm text-gray-600 mt-1">agendamentos</p>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 font-medium">Receita do Mês</span>
            <FiDollarSign className="text-green-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{formatCurrency(stats.revenue)}</p>
          <p className="text-sm text-gray-600 mt-1">serviços concluídos</p>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 font-medium">Cancelamentos</span>
            <FiX className="text-red-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.cancellationRate}%</p>
          <p className="text-sm text-gray-600 mt-1">taxa deste mês</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-lg text-gray-800 mb-4">Agendamentos dos Últimos 7 Dias</h2>
          <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: true }} />
        </div>

        <div className="card">
          <h2 className="font-semibold text-lg text-gray-800 mb-4">Serviços Mais Populares</h2>
          <div className="flex items-center justify-center">
            <div className="w-64 h-64">
              <Doughnut data={doughnutChartData} options={{ responsive: true, maintainAspectRatio: true }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard