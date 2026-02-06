import express from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, parseISO } from 'date-fns'

const router = express.Router()

router.use(authenticate)

// GET /api/reports/dashboard - estatísticas para o dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Agendamentos de hoje
    const { count: todayAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact' })
      .eq('salon_id', req.user.salon_id)
      .gte('start_datetime', `${todayStr}T00:00:00`)
      .lte('start_datetime', `${todayStr}T23:59:59`)

    // Agendamentos da semana
    const weekStart = startOfWeek(today).toISOString()
    const weekEnd = endOfWeek(today).toISOString()
    const { count: weekAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact' })
      .eq('salon_id', req.user.salon_id)
      .gte('start_datetime', weekStart)
      .lte('start_datetime', weekEnd)

    // Receita do mês (só agendamentos COMPLETED)
    const monthStart = startOfMonth(today).toISOString()
    const monthEnd = endOfMonth(today).toISOString()
    
    const { data: completedAppointments } = await supabase
      .from('appointments')
      .select('services(price)')
      .eq('salon_id', req.user.salon_id)
      .eq('status', 'COMPLETED')
      .gte('start_datetime', monthStart)
      .lte('start_datetime', monthEnd)

    const revenue = completedAppointments?.reduce((sum, app) => {
      return sum + (app.services?.price || 0)
    }, 0) || 0

    // Taxa de conclusão
    const { count: totalMonth } = await supabase
      .from('appointments')
      .select('*', { count: 'exact' })
      .eq('salon_id', req.user.salon_id)
      .gte('start_datetime', monthStart)
      .lte('start_datetime', monthEnd)

    const { count: completedMonth } = await supabase
      .from('appointments')
      .select('*', { count: 'exact' })
      .eq('salon_id', req.user.salon_id)
      .eq('status', 'COMPLETED')
      .gte('start_datetime', monthStart)
      .lte('start_datetime', monthEnd)

    const completionRate = totalMonth > 0 ? Math.round((completedMonth / totalMonth) * 100) : 0

    res.json({
      todayAppointments: todayAppointments || 0,
      weekAppointments: weekAppointments || 0,
      revenue,
      completionRate
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/reports - relatórios detalhados
router.get('/', async (req, res) => {
  try {
    const { period = 'month' } = req.query
    const today = new Date()
    
    let start, end
    switch (period) {
      case 'week':
        start = startOfWeek(today)
        end = endOfWeek(today)
        break
      case 'year':
        start = startOfYear(today)
        end = endOfYear(today)
        break
      default: // month
        start = startOfMonth(today)
        end = endOfMonth(today)
    }

    // Dados dos agendamentos do período
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*, services(*)')
      .eq('salon_id', req.user.salon_id)
      .gte('start_datetime', start.toISOString())
      .lte('start_datetime', end.toISOString())

    // Cálculos
    const total = appointments?.length || 0
    const cancelled = appointments?.filter(a => a.status === 'CANCELLED').length || 0
    const completed = appointments?.filter(a => a.status === 'COMPLETED').length || 0
    const revenue = appointments
      ?.filter(a => a.status === 'COMPLETED')
      .reduce((sum, a) => sum + (a.services?.price || 0), 0) || 0

    // Agrupar por serviço
    const servicesMap = {}
    appointments?.forEach(app => {
      const serviceName = app.services?.name || 'Desconhecido'
      if (!servicesMap[serviceName]) {
        servicesMap[serviceName] = 0
      }
      servicesMap[serviceName]++
    })
    const services = Object.entries(servicesMap).map(([name, count]) => ({ name, count }))

    // Agrupar por dia
    const dailyMap = {}
    appointments?.forEach(app => {
      const date = format(parseISO(app.start_datetime), 'dd/MM')
      if (!dailyMap[date]) {
        dailyMap[date] = 0
      }
      dailyMap[date]++
    })
    const daily = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

    res.json({
      revenue,
      appointments: total,
      cancellations: total > 0 ? Math.round((cancelled / total) * 100) : 0,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      services,
      daily
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router