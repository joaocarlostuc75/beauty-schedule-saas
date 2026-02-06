import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiCheckCircle, FiHome } from 'react-icons/fi'
import { formatDate, formatTime } from '../../utils/helpers'

const BookingSuccess = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const appointment = location.state?.appointment

  if (!appointment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <p className="text-gray-600 mb-4">Agendamento não encontrado</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Voltar ao início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center animate-fadeIn">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="text-green-500" size={40} />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-800 mb-2">
            Agendamento Confirmado!
          </h1>
          <p className="text-gray-600">
            Seu horário foi reservado com sucesso
          </p>
        </div>

        <div className="bg-primary-50 rounded-xl p-6 mb-6 text-left">
          <h2 className="font-semibold text-gray-800 mb-3">Detalhes do Agendamento</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Serviço:</span>
              <span className="font-medium text-gray-800">{appointment.service_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Data:</span>
              <span className="font-medium text-gray-800">{formatDate(appointment.start_datetime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Horário:</span>
              <span className="font-medium text-gray-800">{formatTime(appointment.start_datetime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-medium text-gray-800">{appointment.client_name}</span>
            </div>
          </div>
        </div>

        <div className="bg-secondary-50 rounded-xl p-4 mb-6 text-sm text-gray-700">
          <p className="mb-2">
            📧 Enviamos um e-mail para <strong>{appointment.client_email}</strong> com os detalhes e link para gerenciar seu agendamento.
          </p>
          <p>
            📱 Você receberá uma confirmação por WhatsApp em breve!
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <FiHome size={20} />
          Voltar ao Início
        </button>
      </div>
    </div>
  )
}

export default BookingSuccess