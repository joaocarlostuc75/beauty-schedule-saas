import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiChevronRight, FiClock, FiDollarSign } from 'react-icons/fi'
import { formatCurrency, formatDate } from '../../utils/helpers'

const BookingPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [clientData, setClientData] = useState({ name: '', email: '', phone: '' })
  const [lgpdConsent, setLgpdConsent] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchAvailableSlots()
    }
  }, [selectedService, selectedDate])

  const fetchServices = async () => {
    try {
      const { data } = await api.get('/public/services')
      setServices(data)
    } catch (error) {
      toast.error('Erro ao carregar serviços')
    }
  }

  const fetchAvailableSlots = async () => {
    try {
      const { data } = await api.get(`/public/available-slots?service_id=${selectedService.id}&date=${selectedDate}`)
      setAvailableSlots(data)
    } catch (error) {
      toast.error('Erro ao carregar horários')
    }
  }

  const handleServiceSelect = (service) => {
    setSelectedService(service)
    setStep(2)
  }

  const handleDateTimeSelect = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Selecione data e horário')
      return
    }
    setStep(3)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!lgpdConsent) {
      toast.error('Você precisa aceitar a política de privacidade')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/public/appointments', {
        service_id: selectedService.id,
        date: selectedDate,
        time: selectedTime,
        client_name: clientData.name,
        client_email: clientData.email,
        client_phone: clientData.phone,
        lgpd_consent: lgpdConsent,
      })
      
      navigate('/agendamento/sucesso', { state: { appointment: data } })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao agendar')
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div>
      <h2 className="font-display text-2xl font-semibold text-gray-800 mb-6">Escolha um serviço</h2>
      <div className="grid gap-4">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => handleServiceSelect(service)}
            className="card hover:shadow-glow transition-all text-left group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800 mb-1">{service.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <FiClock size={16} />
                    {service.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1 text-primary-600 font-medium">
                    <FiDollarSign size={16} />
                    {formatCurrency(service.price)}
                  </span>
                </div>
              </div>
              <FiChevronRight className="text-gray-400 group-hover:text-primary-500 transition-colors" size={24} />
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div>
      <button onClick={() => setStep(1)} className="text-primary-500 mb-4 flex items-center gap-1 hover:gap-2 transition-all">
        ← Voltar
      </button>
      <h2 className="font-display text-2xl font-semibold text-gray-800 mb-2">Escolha data e horário</h2>
      <p className="text-gray-600 mb-6">Serviço: <strong>{selectedService?.name}</strong></p>
      
      <div className="card mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="input-field"
        />
      </div>

      {selectedDate && (
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-3">Horários disponíveis</label>
          {availableSlots.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhum horário disponível nesta data</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={`py-3 px-4 rounded-xl border-2 transition-all ${
                    selectedTime === slot
                      ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                      : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedDate && selectedTime && (
        <button onClick={handleDateTimeSelect} className="btn-primary w-full mt-6">
          Continuar
        </button>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div>
      <button onClick={() => setStep(2)} className="text-primary-500 mb-4 flex items-center gap-1 hover:gap-2 transition-all">
        ← Voltar
      </button>
      <h2 className="font-display text-2xl font-semibold text-gray-800 mb-6">Confirme seus dados</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome completo *</label>
          <input
            type="text"
            value={clientData.name}
            onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
            className="input-field"
            required
          />
        </div>

        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">E-mail *</label>
          <input
            type="email"
            value={clientData.email}
            onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
            className="input-field"
            required
          />
        </div>

        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp (com DDD) *</label>
          <input
            type="tel"
            value={clientData.phone}
            onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
            placeholder="(11) 99999-9999"
            className="input-field"
            required
          />
        </div>

        <div className="card bg-primary-50 border border-primary-100">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={lgpdConsent}
              onChange={(e) => setLgpdConsent(e.target.checked)}
              className="mt-1 w-5 h-5 text-primary-600 rounded"
            />
            <span className="text-sm text-gray-700">
              Concordo com a coleta e uso dos meus dados conforme a{' '}
              <a href="#" className="text-primary-600 underline">Política de Privacidade</a> (LGPD)
            </span>
          </label>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Agendando...' : 'AGENDAR SERVIÇO'}
        </button>
      </form>
    </div>
  )

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-gray-800">Novo Agendamento</h1>
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-12 rounded-full transition-all ${
                  step >= s ? 'bg-primary-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  )
}

export default BookingPage