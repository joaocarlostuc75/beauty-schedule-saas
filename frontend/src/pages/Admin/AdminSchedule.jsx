import React, { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FiCalendar, FiClock, FiUser, FiScissors, FiPhone, FiCheck, FiX, FiRefreshCw, FiMessageCircle } from 'react-icons/fi'
import axios from 'axios'
import toast from 'react-hot-toast'

const AdminSchedule = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  const getToken = () => {
    const storage = localStorage.getItem('auth-storage')
    return storage ? JSON.parse(storage).state.token : null
  }

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/api/appointments?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      setAppointments(response.data)
    } catch (error) {
      toast.error('Erro ao carregar agendamentos')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [selectedDate])

  const updateStatus = async (id, status, reason = null) => {
    try {
      await axios.patch(`/api/appointments/${id}/status`, {
        status,
        cancellation_reason: reason
      }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      toast.success(`Status atualizado para ${translateStatus(status)}`)
      fetchAppointments()
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const sendWhatsApp = async (appointment) => {
    try {
      const response = await axios.post('/api/notifications/whatsapp', {
        appointment_id: appointment.id,
        type: appointment.status === 'CONFIRMED' ? 'CONFIRMATION' : 'REMINDER'
      }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })

      const { wa_link, message } = response.data
      
      // Abre WhatsApp em nova aba
      window.open(wa_link, '_blank')
      
      toast.success('WhatsApp aberto com mensagem pré-preenchida!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao gerar link do WhatsApp')
    }
  }

  const translateStatus = (status) => {
    const map = {
      'PENDING': 'Pendente',
      'CONFIRMED': 'Confirmado',
      'CANCELLED': 'Cancelado',
      'RESCHEDULED': 'Remarcado',
      'COMPLETED': 'Concluído'
    }
    return map[status] || status
  }

  const getStatusColor = (status) => {
    const map = {
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'CONFIRMED': 'bg-green-100 text-green-700',
      'CANCELLED': 'bg-red-100 text-red-700',
      'RESCHEDULED': 'bg-blue-100 text-blue-700',
      'COMPLETED': 'bg-gray-100 text-gray-700'
    }
    return map[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-display font-bold text-gray-800">
          Agenda
        </h1>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none"
          />
          <button
            onClick={fetchAppointments}
            className="btn-secondary"
          >
            Atualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-300 border-t-primary-500 rounded-full"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="card text-center py-12">
          <FiCalendar className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">Nenhum agendamento para esta data</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="card hover:shadow-glow transition-all">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Info do agendamento */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {translateStatus(appointment.status)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {format(parseISO(appointment.start_datetime), 'HH:mm')} - {' '}
                      {format(parseISO(appointment.end_datetime), 'HH:mm')}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                        <FiUser className="text-primary-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{appointment.client_name}</p>
                        <p className="text-sm text-gray-500">{appointment.client_email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center">
                        <FiScissors className="text-secondary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{appointment.services?.name}</p>
                        <p className="text-sm text-gray-500">
                          {appointment.services?.duration_minutes} min • R$ {appointment.services?.price}
                        </p>
                      </div>
                    </div>
                  </div>

                  {appointment.client_phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FiPhone size={16} />
                      <span>{appointment.client_phone}</span>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex flex-wrap gap-2">
                  {appointment.status === 'PENDING' && (
                    <button
                      onClick={() => updateStatus(appointment.id, 'CONFIRMED')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl text-sm font-medium transition-colors"
                    >
                      <FiCheck size={16} />
                      Confirmar
                    </button>
                  )}

                  {['PENDING', 'CONFIRMED', 'RESCHEDULED'].includes(appointment.status) && (
                    <>
                      <button
                        onClick={() => sendWhatsApp(appointment)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        <FiMessageCircle size={16} />
                        WhatsApp
                      </button>

                      <button
                        onClick={() => updateStatus(appointment.id, 'COMPLETED')}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-600 rounded-xl text-sm font-medium transition-colors"
                      >
                        <FiCheck size={16} />
                        Concluído
                      </button>

                      <button
                        onClick={() => {
                          const reason = prompt('Motivo do cancelamento:')
                          if (reason !== null) {
                            updateStatus(appointment.id, 'CANCELLED', reason)
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl text-sm font-medium transition-colors"
                      >
                        <FiX size={16} />
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminSchedule