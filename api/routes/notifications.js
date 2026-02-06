import express from 'express'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticate)

// Gerar mensagem de WhatsApp
function generateWhatsAppMessage(appointment, salon) {
  const dateFormatted = format(new Date(appointment.start_datetime), "dd 'de' MMMM", { locale: ptBR })
  const timeFormatted = format(new Date(appointment.start_datetime), 'HH:mm')
  
  return `👋 Olá ${appointment.client_name}! Tudo bem? Aqui é do *${salon.name}*. Estamos confirmando seu agendamento de *${appointment.service_name}* para 📅 ${dateFormatted} às ⏰ ${timeFormatted}. Se precisar cancelar ou remarcar, é só avisar. Até breve! ✨`
}

// Gerar link wa.me
function generateWhatsAppLink(phone, message) {
  // Remove tudo que não é dígito do telefone
  const cleanPhone = phone.replace(/\D/g, '')
  // Codifica a mensagem para URL
  const encodedMessage = encodeURIComponent(message)
  // Retorna link wa.me
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

// POST /api/notifications/whatsapp - Gerar link para envio manual
router.post('/whatsapp', async (req, res) => {
  try {
    const { appointment_id, type = 'CONFIRMATION' } = req.body
    
    if (!appointment_id) {
      return res.status(400).json({ error: 'ID do agendamento é obrigatório' })
    }
    
    // Buscar dados do agendamento com serviço e salão
    const { data: appointment, error: appError } = await req.app.locals.supabase
      .from('appointments')
      .select(`
        *,
        services(name),
        salons(whatsapp_number)
      `)
      .eq('id', appointment_id)
      .eq('salon_id', req.user.salon_id)
      .single()
    
    if (appError || !appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado' })
    }
    
    // Verificar se salão tem WhatsApp configurado
    const salon = appointment.salons
    if (!salon.whatsapp_number) {
      return res.status(400). { error: 'WhatsApp do salão não configurado. Configure em Configurações.' })
    }
    
    // Preparar dados formatados
    const appointmentData = {
      client_name: appointment.client_name,
      client_phone: appointment.client_phone,
      service_name: appointment.services.name,
      start_datetime: appointment.start_datetime,
    }
    
    // Gerar mensagem
    const message = generateWhatsAppMessage(appointmentData, salon)
    
    // Gerar link wa.me (abre conversa do admin com o cliente)
    // Se o cliente tem telefone, abre conversa com ele
    // Senão, abre conversa do salão para o admin enviar manualmente
    const targetPhone = appointment.client_phone || salon.whatsapp_number
    const waLink = generateWhatsAppLink(targetPhone, message)
    
    // Registrar log de notificação
    await req.app.locals.supabase
      .from('notification_logs')
      .insert({
        appointment_id,
        type,
        sent_by: req.user.id,
        channel: 'WHATSAPP',
        status: 'PENDING'
      })
    
    res.json({
      success: true,
      wa_link: waLink,
      message,
      target_phone: targetPhone,
      instructions: 'Clique no link para abrir o WhatsApp com a mensagem pré-preenchida. Revise e envie.'
    })
  } catch (error) {
    console.error('WhatsApp notification error:', error)
    res.status(500).json({ error: 'Erro ao gerar link do WhatsApp' })
  }
})

// GET /api/notifications/templates - Templates de mensagens
router.get('/templates', async (req, res) => {
  const templates = {
    CONFIRMATION: {
      name: 'Confirmação de Agendamento',
      emoji: '✅',
      template: '👋 Olá {cliente}! Tudo bem? Aqui é do *{salao}*. Estamos confirmando seu agendamento de *{servico}* para 📅 {data} às ⏰ {hora}. Se precisar cancelar ou remarcar, é só avisar. Até breve! ✨'
    },
    REMINDER: {
      name: 'Lembrete',
      emoji: '⏰',
      template: '👋 Olá {cliente}! Passando para lembrar do seu agendamento de *{servico}* amanhã 📅 {data} às ⏰ {hora} no *{salao}*. Nos vemos lá! ✨'
    },
    CANCELLATION: {
      name: 'Cancelamento',
      emoji: '❌',
      template: 'Olá {cliente}. Seu agendamento de *{servico}* para 📅 {data} às ⏰ {hora} no *{salao}* foi cancelado. Para reagendar, é só entrar em contato. ✨'
    },
    RESCHEDULED: {
      name: 'Remarcação',
      emoji: '🔄',
      template: '👋 Olá {cliente}! Seu agendamento foi remarcado para *{servico}* em 📅 {data} às ⏰ {hora} no *{salao}*. Confirmado? ✨'
    }
  }
  
  res.json(templates)
})

export default router