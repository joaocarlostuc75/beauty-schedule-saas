const express = require('express')
const supabase = require('../config/supabase')

const router = express.Router()

// Buscar configurações do salão (assumindo single-tenant por enquanto)
router.get('/salon', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('salons')
      .select('id, name, email, phone, address, logo_url, opening_time, closing_time')
      .limit(1)
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Get salon error:', error)
    res.status(500).json({ message: 'Erro ao carregar salão' })
  }
})

// Listar serviços disponíveis
router.get('/services', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('active', true)
      .order('name')

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Get services error:', error)
    res.status(500).json({ message: 'Erro ao carregar serviços' })
  }
})

// Buscar horários disponíveis
router.get('/available-slots', async (req, res) => {
  try {
    const { service_id, date } = req.query

    if (!service_id || !date) {
      return res.status(400).json({ message: 'service_id e date são obrigatórios' })
    }

    // Buscar serviço
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('id', service_id)
      .single()

    if (serviceError) throw serviceError

    // Buscar salão (horários)
    const { data: salon, error: salonError } = await supabase
      .from('salons')
      .select('opening_time, closing_time')
      .limit(1)
      .single()

    if (salonError) throw salonError

    // Gerar slots (simplificado - cada 30 minutos)
    const slots = []
    const opening = parseInt(salon.opening_time.split(':')[0])
    const closing = parseInt(salon.closing_time.split(':')[0])

    for (let hour = opening; hour < closing; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }

    // Filtrar slots ocupados (buscar agendamentos nessa data)
    const startOfDay = `${date}T00:00:00Z`
    const endOfDay = `${date}T23:59:59Z`

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('start_datetime, end_datetime')
      .gte('start_datetime', startOfDay)
      .lte('start_datetime', endOfDay)
      .in('status', ['PENDING', 'CONFIRMED', 'RESCHEDULED'])

    if (appointmentsError) throw appointmentsError

    // Remover slots ocupados (implementação simplificada)
    const occupiedTimes = appointments.map(a => a.start_datetime.substring(11, 16))
    const availableSlots = slots.filter(slot => !occupiedTimes.includes(slot))

    res.json(availableSlots)
  } catch (error) {
    console.error('Get available slots error:', error)
    res.status(500).json({ message: 'Erro ao buscar horários' })
  }
})

// Criar agendamento
router.post('/appointments', async (req, res) => {
  try {
    const {
      service_id,
      date,
      time,
      client_name,
      client_email,
      client_phone,
      lgpd_consent,
    } = req.body

    // Validações
    if (!service_id || !date || !time || !client_name || !client_email || !client_phone) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' })
    }

    if (!lgpd_consent) {
      return res.status(400).json({ message: 'Consentimento LGPD é obrigatório' })
    }

    // Buscar serviço para pegar duração
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*, salon:salons(id)')
      .eq('id', service_id)
      .single()

    if (serviceError) throw serviceError

    const salonId = service.salon.id

    // Criar ou buscar cliente
    let clientId
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('salon_id', salonId)
      .eq('email', client_email)
      .single()

    if (existingClient) {
      clientId = existingClient.id
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          salon_id: salonId,
          name: client_name,
          email: client_email,
          phone: client_phone,
          lgpd_consent,
          consent_date: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (clientError) throw clientError
      clientId = newClient.id
    }

    // Calcular horários
    const startDatetime = `${date}T${time}:00Z`
    const endDatetime = new Date(new Date(startDatetime).getTime() + service.duration_minutes * 60000).toISOString()

    // Verificar disponibilidade
    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id')
      .eq('salon_id', salonId)
      .in('status', ['PENDING', 'CONFIRMED', 'RESCHEDULED'])
      .lte('start_datetime', endDatetime)
      .gte('end_datetime', startDatetime)

    if (conflicts && conflicts.length > 0) {
      return res.status(409).json({ message: 'Horário indisponível' })
    }

    // Gerar token de gerenciamento
    const managementToken = require('crypto').randomBytes(32).toString('hex')

    // Criar agendamento
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        salon_id: salonId,
        client_id: clientId,
        service_id,
        status: 'CONFIRMED',
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        client_name,
        client_email,
        client_phone,
        management_token: managementToken,
        token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
      })
      .select('*, service:services(name)')
      .single()

    if (appointmentError) throw appointmentError

    res.status(201).json({
      ...appointment,
      service_name: appointment.service.name,
    })
  } catch (error) {
    console.error('Create appointment error:', error)
    res.status(500).json({ message: 'Erro ao criar agendamento' })
  }
})

// Buscar agendamento por token
router.get('/appointments/:token', async (req, res) => {
  try {
    const { token } = req.params

    const { data, error } = await supabase
      .from('appointments')
      .select('*, service:services(name)')
      .eq('management_token', token)
      .single()

    if (error || !data) {
      return res.status(404).json({ message: 'Agendamento não encontrado' })
    }

    // Verificar expiração
    if (new Date(data.token_expires_at) < new Date()) {
      return res.status(410).json({ message: 'Link expirado' })
    }

    res.json({
      ...data,
      service_name: data.service.name,
    })
  } catch (error) {
    console.error('Get appointment error:', error)
    res.status(500).json({ message: 'Erro ao buscar agendamento' })
  }
})

// Cancelar agendamento
router.post('/appointments/:token/cancel', async (req, res) => {
  try {
    const { token } = req.params

    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, status, token_expires_at')
      .eq('management_token', token)
      .single()

    if (fetchError || !appointment) {
      return res.status(404).json({ message: 'Agendamento não encontrado' })
    }

    if (new Date(appointment.token_expires_at) < new Date()) {
      return res.status(410).json({ message: 'Link expirado' })
    }

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Agendamento já foi cancelado' })
    }

    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'CANCELLED', cancellation_reason: 'Cancelado pelo cliente' })
      .eq('id', appointment.id)

    if (updateError) throw updateError

    res.json({ message: 'Agendamento cancelado com sucesso' })
  } catch (error) {
    console.error('Cancel appointment error:', error)
    res.status(500).json({ message: 'Erro ao cancelar agendamento' })
  }
})

module.exports = router