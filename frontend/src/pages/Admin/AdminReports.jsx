import React, { useState, useEffect } from 'react'
import { FiBarChart2, FiDollarSign, FiCalendar, FiTrendingDown, FiTrendingUp } from 'react-icons/fi'
import { Bar, Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import axios from 'axios'
import toast from 'react-hot-toast'
import { format, startOfMonth, endOfMonth } from 'date-fns'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const AdminReports = () => {
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    revenue: 0,
    appointments: 0,
    cancellations: 0,
    completionRate: 0,
    services: [],
    daily: []
  })

  const getToken = () => {
    const storage = localStorage.getItem('auth-storage')
    return storage ? JSON.parse(storage).state.token : null
  }

  const fetchReports = async () => {
    try {
      const response = await axios.get(`/api/reports?period=${period}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      setData(response.data)
    } catch (error) {
      toast.error('Erro ao carregar relatórios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [period])

  const pieData = {
    labels: data.services.map(s => s.name),
    datasets: [{
      data: data.services.map(s => s.count),
      backgroundColor: [
        '#f9a8d4', '#c4b5fd', '#86efac', '#93c5fd', '#fca5a5', '#fde047'
      ],
      borderWidth: 0
    }]
  }

  const barData = {
    labels: data.daily.map(d => d.date),
    datasets: [{
      label: 'Agendamentos',
      data: data.daily.map(d => d.count),
      backgroundColor: '#f9a8d4',
      borderRadius: 8
    }]
  }

  const stats = [
    { icon: FiDollarSign, value: `R$ ${data.revenue.toFixed(2)}`, label: 'Receita', color: 'green' },
    { icon: FiCalendar, value: data.appointments, label: 'Agendamentos', color: 'primary' },
    { icon: FiTrendingDown, value: `${data.cancellations}%`, label: 'Cancelamentos', color: 'red' },
    { icon: FiTrendingUp, value: `${data.completionRate}%`, label: 'Conclusão', color: 'blue' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-display font-bold text-gray-800">Relatórios</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none"
        >
          <option value="week">Esta Semana</option>
          <option value="month">Este Mês</option>
          <option value="year">Este Ano</option>
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                <stat.icon className={`text-${stat.color}-500`} size={20} />
              </div>
              <span className="text-2xl font-bold text-gray-800">{loading ? '...' : stat.value}</span>
            </div>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">
            Agendamentos por Dia
          </h2>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-2 border-primary-300 border-t-primary-500 rounded-full"></div>
            </div>
          ) : data.daily.length === 0 ? (
            <p className="text-center text-gray-500 py-12">Sem dados para o período</p>
          ) : (
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} height={250} />
          )}
        </div>

        <div className="card">
          <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">
            Distribuição por Serviço
          </h2>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-2 border-primary-300 border-t-primary-500 rounded-full"></div>
            </div>
          ) : data.services.length === 0 ? (
            <p className="text-center text-gray-500 py-12">Sem dados para o período</p>
          ) : (
            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} height={250} />
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminReports