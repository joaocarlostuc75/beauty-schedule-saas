/**
 * Gera link wa.me com mensagem pré-preenchida
 * @param {string} phone - Número do WhatsApp (formato: 5511999999999)
 * @param {object} data - Dados do agendamento
 * @returns {string} URL do wa.me
 */
export const generateWhatsAppLink = (phone, data) => {
  const { clientName, serviceName, date, time, salonName } = data
  
  const message = `👋 Olá ${clientName}! Tudo bem? Aqui é do ${salonName}. Estamos confirmando seu agendamento de *${serviceName}* para 📅 ${date} às ⏰ ${time}. Se precisar cancelar ou remarcar, é só avisar. Até breve! ✨`
  
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${phone}?text=${encodedMessage}`
}

/**
 * Formata número de telefone para formato internacional
 * @param {string} phone - Telefone (ex: (11) 99999-9999)
 * @returns {string} Formato: 5511999999999
 */
export const formatPhoneForWhatsApp = (phone) => {
  const cleaned = phone.replace(/\D/g, '')
  // Se não começar com 55 (código do Brasil), adiciona
  return cleaned.startsWith('55') ? cleaned : `55${cleaned}`
}

/**
 * Formata data para exibição
 * @param {string|Date} date
 * @returns {string} Ex: "05/02/2026"
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('pt-BR')
}

/**
 * Formata hora para exibição
 * @param {string|Date} datetime
 * @returns {string} Ex: "14:30"
 */
export const formatTime = (datetime) => {
  return new Date(datetime).toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

/**
 * Formata moeda BRL
 * @param {number} value
 * @returns {string} Ex: "R$ 150,00"
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}