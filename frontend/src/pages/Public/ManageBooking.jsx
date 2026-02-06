import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiX, FiCalendar } from 'react-icons/fi'
import { formatDate, formatTime } from '../../utils/helpers'

const ManageBooking = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState(null) // 'cancel' | 'reschedule'

  useEffect(() => {
    if (!token) {
      toast.error('Token inválido')
      navigate('/')
      return
    }
    fetchAppointment()
  }, [token])

  const fetchAppointment = async () => {
    try {
      const { data } = await api.get(`/public/appointments/${token}`)
      setAppointment(data)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Agendamento não encontrado')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return
    
    try {
      await api.post(`/public/appointments/${token}/cancel`)
      toast.success('Agendamento cancelado com sucesso')
      setTimeout(() => navigate('/'), 2000)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao cancelar')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!appointment) {
    return null
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-gray-800 mb-8 text-center">
          Gerenciar Agendamento
        </h1>

        <div className="card mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-xl text-gray-800 mb-1">
                {appointment.service_name}
              </h2>
              <p className="text-gray-600">{appointment.client_name}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
              appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
              appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {appointment.status === 'CONFIRMED' ? 'Confirmado' :
               appointment.status === 'PENDING' ? 'Pendente' :
               appointment.status === 'CANCELLED' ? 'Cancelado' :
               appointment.status}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <FiCalendar size={18} className="text-primary-500" />
              <span>{formatDate(appointment.start_datetime)} às {formatTime(appointment.start_datetime)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              📧 {appointment.client_email}
            </div>
            {appointment.client_phone && (
              <div className="flex items-center gap-2 text-gray-700">
                📱 {appointment.client_phone}
              </div>
            )}
          </div>
        </div>

        {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
          <div className="grid gap-4">
            <button
              onClick={() => setAction('reschedule')}
              className="btn-secondary w-full flex items-center justify-center gap-2"
              disabled
            >
              <FiCalendar size={20} />
              Remarcar (em breve)
            </button>
            
            <button
              onClick={handleCancel}
              className="w-full py-3 px-6 rounded-2xl border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
            >
              <FiX size={20} />
              Cancelar Agendamento
            </button>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="mt-8 text-primary-500 mx-auto block hover:underline"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  )
}

export default ManageBooking