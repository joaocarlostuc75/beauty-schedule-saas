import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { FiSend, FiCheck, FiX, FiCalendar, FiClock } from 'react-icons/fi'
import { formatDate, formatTime, generateWhatsAppLink, formatPhoneForWhatsApp } from '../../utils/helpers'

const AdminSchedule = () => {
  const { salon } = useAuthStore()
  const [appointments, setAppointments] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)

  useEffect(() => {
    fetchAppointments()
  }, [selectedDate])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/appointments?date=${selectedDate}`)
      setAppointments(data)
    } catch (error) {
      toast.error('Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      await api.patch(`/admin/appointments/${appointmentId}`, { status })
      toast.success('Status atualizado')
      fetchAppointments()
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const handleSendWhatsApp = (appointment) => {
    const phone = formatPhoneForWhatsApp(appointment.client_phone)
    const link = generateWhatsAppLink(phone, {
      clientName: appointment.client_name,
      serviceName: appointment.service_name,
      date: formatDate(appointment.start_datetime),
      time: formatTime(appointment.start_datetime),
      salonName: salon?.name || 'Nosso Salão',
    })
    
    // Registrar log de envio
    api.post(`/admin/whatsapp/log`, {
      appointment_id: appointment.id,
      type: 'MANUAL',
      phone,
    })

    window.open(link, '_blank')
    toast.success('Abrindo WhatsApp...')
  }

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      CONFIRMED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
      COMPLETED: 'bg-blue-100 text-blue-700',
      RESCHEDULED: 'bg-purple-100 text-purple-700',
    }
    const labels = {
      PENDING: 'Pendente',
      CONFIRMED: 'Confirmado',
      CANCELLED: 'Cancelado',
      COMPLETED: 'Concluído',
      RESCHEDULED: 'Remarcado',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800 mb-2">Agenda</h1>
          <p className="text-gray-600">Gerencie seus agendamentos</p>
        </div>
        <button
          onClick={() => setShowBlockModal(true)}
          className="btn-secondary"
        >
          Bloquear Datas
        </button>
      </div>

      {/* Seletor de data */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">Selecionar Data</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input-field max-w-xs"
        />
      </div>

      {/* Lista de agendamentos */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-pulse text-gray-500">Carregando agendamentos...</div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="card text-center py-12">
          <FiCalendar size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum agendamento nesta data</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="card hover:shadow-glow transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Informações do agendamento */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">{appointment.service_name}</h3>
                      <p className="text-gray-600">{appointment.client_name}</p>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                    <span className="flex items-center gap-1">
                      <FiClock size={16} />
                      {formatTime(appointment.start_datetime)}
                    </span>
                    <span>📱 {appointment.client_phone}</span>
                    <span>📧 {appointment.client_email}</span>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSendWhatsApp(appointment)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all text-sm font-medium"
                    title="Enviar WhatsApp"
                  >
                    <FiSend size={16} />
                    WhatsApp
                  </button>
                  
                  {appointment.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleUpdateStatus(appointment.id, 'COMPLETED')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all text-sm font-medium"
                      title="Marcar como concluído"
                    >
                      <FiCheck size={16} />
                      Concluído
                    </button>
                  )}
                  
                  {appointment.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleUpdateStatus(appointment.id, 'CANCELLED')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all text-sm font-medium"
                      title="Cancelar agendamento"
                    >
                      <FiX size={16} />
                      Cancelar
                    </button>
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