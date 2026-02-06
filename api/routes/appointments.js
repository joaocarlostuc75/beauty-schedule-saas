import express from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { addMinutes, startOfDay, endOfDay, getDay } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// ---------- Helpers ----------

async function checkAvailability({ salon_id, start, end, excludeId = null }) {
  const { data, error } = await supabase.rpc('check_availability', {
    p_salon_id: salon_id,
    p_start: start.toISOString(),
    p_end: end.toISOString(),
    p_exclude_id: excludeId,
  })

  if (error) {
    console.error('check_availability error:', error)
    throw new Error('Erro ao verificar disponibilidade')
  }

  return data === true
}

// Gera slots de horário possíveis para um serviço em um dia
async function generateAvailableSlots({ service, salon, date }) {
  const duration = service.duration_minutes
  if (!duration) return []

  const tzDate = new Date(date + 'T00:00:00')
  const dayOfWeek = getDay(tzDate) // 0 domingo

  if (service.available_days && !service.available_days.includes(dayOfWeek)) {
    return []
  }

  // Horário base: interseção entre horário do salão e do serviço
  const baseStart = service.start_time || salon.opening_time
  const baseEnd = service.end_time || salon.closing_time

  if (!baseStart || !baseEnd) return []

  const [startHour, startMin] = baseStart.split(':').map(Number)
  const [endHour, endMin] = baseEnd.split(':').map(Number)

  const startDate = new Date(date)
  startDate.setHours(startHour, startMin, 0, 0)

  const endDate = new Date(date)
  endDate.setHours(endHour, endMin, 0, 0)

  const slots = []
  let cursor = new Date(startDate)

  while (addMinutes(cursor, duration) <= endDate) {
    const slotStart = new Date(cursor)
    const slotEnd = addMinutes(slotStart, duration)

    const available = await checkAvailability({
      salon_id: service.salon_id,
      start: slotStart,
      end: slotEnd,
    })

    if (available) {
      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
      })
    }

    cursor = addMinutes(cursor, duration)
  }

  return slots
}

// ---------- Rotas públicas ----------

// GET /api/appointments/available-slots?service_id=...&date=YYYY-MM-DD
router.get('/available-slots', async (req, res) => {
  try {
    const { service_id, date } = req.query

    if (!service_id || !date) {
      return res.status(400).json({ error: 'service_id e date são obrigatórios' })
    }

    // Buscar serviço + salão
    const { data: service, error } = await supabase
      .from('services')
      .select('*, salons(*)')
      .eq('id', service_id)
      .single()

    if (error || !service) {
      return res.status(404).json({ error: 'Serviço não encontrado' })
    }

    const salon = service.salons

    const slots = await generateAvailableSlots({ service, salon, date })

    res.json({
      date,
      service_id,
      slots,
    })
  } catch (error) {
    console.error('available-slots error:', error)
    res.status(500).json({ error: 'Erro ao buscar horários disponíveis' })
  }
})

// POST /api/appointments/public - criar agendamento público (sem login)
router.post('/public', async (req, res) => {
  try {
    const { service_id, date, time, client_name, client_email, client_phone } = req.body

    if (!service_id || !date || !time || !client_name || !client_email) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' })
    }

    // Buscar serviço + salão
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*, salons(*)')
      .eq('id', service_id)
      .single()

    if (serviceError || !service) {
      return res.status(404).json({ error: 'Serviço não encontrado' })
    }

    const salon = service.salons

    // Montar datetime
    const start = new Date(`${date}T${time}:00`)
    const end = addMinutes(start, service.duration_minutes)

    // Verificar disponibilidade
    const available = await checkAvailability({
      salon_id: service.salon_id,
      start,
      end,
    })

    if (!available) {
      return res.status(409).json({ error: 'Horário indisponível, escolha outro horário.' })
    }

    // Encontrar ou criar cliente
    const { data: existingClient } = await supabase
      .from('clients')
      .select('*')
      .eq('salon_id', service.salon_id)
      .eq('email', client_email)
      .maybeSingle()

    let clientId = existingClient?.id

    if (!clientId) {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          salon_id: service.salon_id,
          name: client_name,
          email: client_email,
          phone: client_phone,
          lgpd_consent: true,
          consent_date: new Date().toISOString(),
        })
        .select()
        .single()

      if (clientError) {
        console.error('create client error:', clientError)
        return res.status(500).json({ error: 'Erro ao criar cliente' })
      }

      clientId = newClient.id
    }

    const management_token = uuidv4()
    const token_expires_at = addMinutes(new Date(), 60 * 24) // 24h

    // Criar agendamento
    const { data: appointment, error: appError } = await supabase
      .from('appointments')
      .insert({
        salon_id: service.salon_id,
        client_id: clientId,
        service_id,
        status: 'PENDING',
        start_datetime: start.toISOString(),
        end_datetime: end.toISOString(),
        client_name,
        client_email,
        client_phone,
        management_token,
        token_expires_at,
      })
      .select('id, start_datetime, end_datetime, status, management_token')
      .single()

    if (appError) {
      console.error('create appointment error:', appError)
      return res.status(500).json({ error: 'Erro ao criar agendamento' })
    }

    res.status(201).json({
      message: 'Agendamento criado com sucesso',
      appointment,
    })
  } catch (error) {
    console.error('public create appointment error:', error)
    res.status(500).json({ error: 'Erro ao criar agendamento' })
  }
})

// GET /api/appointments/by-token?token=...
router.get('/by-token', async (req, res) => {
  try {
    const { token } = req.query

    if (!token) {
      return res.status(400).json({ error: 'Token é obrigatório' })
    }

    const nowIso = new Date().toISOString()

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('*, services(*), salons(name)')
      .eq('management_token', token)
      .gte('token_expires_at', nowIso)
      .not('status', 'in', '(CANCELLED,COMPLETED)')
      .maybeSingle()

    if (error) {
      console.error('by-token error:', error)
      return res.status(500).json({ error: 'Erro ao buscar agendamento' })
    }

    if (!appointment) {
      return res.status(404).json({ error: 'Link inválido ou expirado' })
    }

    res.json(appointment)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar agendamento' })
  }
})

// POST /api/appointments/cancel-by-token
router.post('/cancel-by-token', async (req, res) => {
  try {
    const { token, reason } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Token é obrigatório' })
    }

    const nowIso = new Date().toISOString()

    const { data: appointment, error: appError } = await supabase
      .from('appointments')
      .select('*')
      .eq('management_token', token)
      .gte('token_expires_at', nowIso)
      .not('status', 'in', '(CANCELLED,COMPLETED)')
      .maybeSingle()

    if (appError) {
      console.error('cancel-by-token fetch error:', appError)
      return res.status(500).json({ error: 'Erro ao buscar agendamento' })
    }

    if (!appointment) {
      return res.status(404).json({ error: 'Link inválido ou expirado' })
    }

    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'CANCELLED',
        cancellation_reason: reason || 'Cancelado pelo cliente via link',
      })
      .eq('id', appointment.id)

    if (updateError) {
      console.error('cancel-by-token update error:', updateError)
      return res.status(500).json({ error: 'Erro ao cancelar agendamento' })
    }

    res.json({ message: 'Agendamento cancelado com sucesso' })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cancelar agendamento' })
  }
})

// POST /api/appointments/reschedule-by-token
router.post('/reschedule-by-token', async (req, res) => {
  try {
    const { token, date, time } = req.body

    if (!token || !date || !time) {
      return res.status(400).json({ error: 'Token, data e horário são obrigatórios' })
    }

    const nowIso = new Date().toISOString()

    const { data: appointment, error: appError } = await supabase
      .from('appointments')
      .select('*, services(*), salons(*)')
      .eq('management_token', token)
      .gte('token_expires_at', nowIso)
      .not('status', 'in', '(CANCELLED,COMPLETED)')
      .maybeSingle()

    if (appError) {
      console.error('reschedule fetch error:', appError)
      return res.status(500).json({ error: 'Erro ao buscar agendamento' })
    }

    if (!appointment) {
      return res.status(404).json({ error: 'Link inválido ou expirado' })
    }

    const service = appointment.services
    const start = new Date(`${date}T${time}:00`)
    const end = addMinutes(start, service.duration_minutes)

    const available = await checkAvailability({
      salon_id: appointment.salon_id,
      start,
      end,
      excludeId: appointment.id,
    })

    if (!available) {
      return res.status(409).json({ error: 'Horário indisponível, escolha outro horário.' })
    }

    const { data: updated, error: updateError } = await supabase
      .from('appointments')
      .update({
        start_datetime: start.toISOString(),
        end_datetime: end.toISOString(),
        status: 'RESCHEDULED',
      })
      .eq('id', appointment.id)
      .select('id, start_datetime, end_datetime, status')
      .single()

    if (updateError) {
      console.error('reschedule update error:', updateError)
      return res.status(500).json({ error: 'Erro ao remarcar agendamento' })
    }

    res.json({ message: 'Agendamento remarcado com sucesso', appointment: updated })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remarcar agendamento' })
  }
})

// ---------- Rotas autenticadas (admin/staff) ----------

router.use(authenticate)

// GET /api/appointments - listar agendamentos por dia
router.get('/', async (req, res) => {
  try {
    const { date } = req.query

    const targetDate = date ? new Date(date) : new Date()
    const start = startOfDay(targetDate)
    const end = endOfDay(targetDate)

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*, clients(*), services(*)')
      .eq('salon_id', req.user.salon_id)
      .gte('start_datetime', start.toISOString())
      .lte('start_datetime', end.toISOString())
      .order('start_datetime', { ascending: true })

    if (error) throw error

    res.json(appointments)
  } catch (error) {
    console.error('list appointments error:', error)
    res.status(500).json({ error: 'Erro ao listar agendamentos' })
  }
})

// PATCH /api/appointments/:id/status - atualizar status (CANCELLED, COMPLETED, CONFIRMED)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status, cancellation_reason } = req.body

    const allowedStatuses = ['CANCELLED', 'COMPLETED', 'CONFIRMED']
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' })
    }

    const updates = { status }
    if (status === 'CANCELLED' && cancellation_reason) {
      updates.cancellation_reason = cancellation_reason
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .eq('salon_id', req.user.salon_id)
      .select('id, status, cancellation_reason')
      .single()

    if (error) throw error

    if (!appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado' })
    }

    res.json(appointment)
  } catch (error) {
    console.error('update status error:', error)
    res.status(500).json({ error: 'Erro ao atualizar status do agendamento' })
  }
})

// POST /api/appointments - criar agendamento via painel (admin/staff)
router.post('/', async (req, res) => {
  try {
    const { service_id, date, time, client_id, client_name, client_email, client_phone } = req.body

    if (!service_id || !date || !time) {
      return res.status(400).json({ error: 'Serviço, data e horário são obrigatórios' })
    }

    // Buscar serviço
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', service_id)
      .eq('salon_id', req.user.salon_id)
      .single()

    if (serviceError || !service) {
      return res.status(404).json({ error: 'Serviço não encontrado' })
    }

    const start = new Date(`${date}T${time}:00`)
    const end = addMinutes(start, service.duration_minutes)

    const available = await checkAvailability({
      salon_id: req.user.salon_id,
      start,
      end,
    })

    if (!available) {
      return res.status(409).json({ error: 'Horário indisponível, escolha outro horário.' })
    }

    let finalClientId = client_id

    // Se não passar client_id, criar/usar por email
    if (!finalClientId && client_email) {
      const { data: existingClient } = await supabase
        .from('clients')
        .select('*')
        .eq('salon_id', req.user.salon_id)
        .eq('email', client_email)
        .maybeSingle()

      if (existingClient) {
        finalClientId = existingClient.id
      } else if (client_name) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            salon_id: req.user.salon_id,
            name: client_name,
            email: client_email,
            phone: client_phone,
            lgpd_consent: true,
            consent_date: new Date().toISOString(),
          })
          .select()
          .single()

        if (clientError) {
          console.error('create client (admin) error:', clientError)
          return res.status(500).json({ error: 'Erro ao criar cliente' })
        }

        finalClientId = newClient.id
      }
    }

    const { data: appointment, error: appError } = await supabase
      .from('appointments')
      .insert({
        salon_id: req.user.salon_id,
        client_id: finalClientId,
        service_id,
        status: 'CONFIRMED',
        start_datetime: start.toISOString(),
        end_datetime: end.toISOString(),
        client_name: client_name || null,
        client_email: client_email || null,
        client_phone: client_phone || null,
      })
      .select('id, start_datetime, end_datetime, status')
      .single()

    if (appError) {
      console.error('create appointment (admin) error:', appError)
      return res.status(500).json({ error: 'Erro ao criar agendamento' })
    }

    res.status(201).json(appointment)
  } catch (error) {
    console.error('create appointment (admin) error:', error)
    res.status(500).json({ error: 'Erro ao criar agendamento' })
  }
})

export default router