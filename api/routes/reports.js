import express from 'express'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, parseISO } from 'date-fns'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticate)

// GET /api/reports/dashboard - métricas para o dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date()
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString()
    
    const weekStart = startOfWeek(today).toISOString()
    const weekEnd = endOfWeek(today).toISOString()
    const monthStart = startOfMonth(today).toISOString()
    const monthEnd = endOfMonth(today).toISOString()

    // Agendamentos de hoje
    const { count: todayCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact' })
      .eq('salon_id', req.user.salon_id)
      .gte('start_datetime', todayStart)
      .lte('start_datetime', todayEnd)

    // Agendamentos da semana
    const { count: weekCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact' })
      .eq('salon_id', req.user.salon_id)
      .gte('start_datetime', weekStart)
      .lte('start_datetime', weekEnd)

    // Receita do mês (apenas concluídos)
    const { data: completedMonth } = await supabase
      .from('appointments')
      .select('services(price)')
      .eq('salon_id', req.user.salon_id)
      .eq('status', 'COMPLETED')
      .gte('start_datetime', monthStart)
      .lte('start_datetime', monthEnd)

    const revenue = completedMonth?.reduce((sum, app) => {
      return sum + (app.services?.price || 0)
    }, 0) || 0

    // Taxa de conclusão do mês
    const { count: totalMonth } = await supabase
      .from('appointments')
      .select('*', { count: 'exact' })
      .eq('salon_id', req.user.salon_id)
      .gte('start_datetime', monthStart)
      .lte('start_datetime', monthEnd)

    const { count: completedCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact' })
      .eq('salon_id', req.user.salon_id)
      .eq('status', 'COMPLETED')
      .gte('start_datetime', monthStart)
      .lte('start_datetime', monthEnd)

    const completionRate = totalMonth > 0 ? Math.round((completedCount / totalMonth) * 100) : 0

    res.json({
      todayAppointments: todayCount || 0,
      weekAppointments: weekCount || 0,
      revenue,
      completionRate
    })
  } catch (error) {
    console.error('dashboard stats error:', error)
    res.status(500).json({ error: 'Erro ao carregar estatísticas' })
  }
})

// GET /api/reports - relatórios detalhados
router.get('/', async (req, res) => {
  try {
    const { period = 'month' } = req.query
    const today = new Date()
    
    let start, end
    
    if (period === 'week') {
      start = startOfWeek(today)
      end = endOfWeek(today)
    } else if (period === 'year') {
      start = startOfYear(today)
      end = endOfYear(today)
    } else {
      start = startOfMonth(today)
      end = endOfMonth(today)
    }

    const startISO = start.toISOString()
    const endISO = end.toISOString()

    // Buscar agendamentos do período
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*, services(name, price)')
      .eq('salon_id', req.user.salon_id)
      .gte('start_datetime', startISO)
      .lte('start_datetime', endISO)

    // Calcular métricas
    const total = appointments?.length || 0
    const completed = appointments?.filter(a => a.status === 'COMPLETED').length || 0
    const cancelled = appointments?.filter(a => a.status === 'CANCELLED').length || 0
    const revenue = appointments
      ?.filter(a => a.status === 'COMPLETED')
      .reduce((sum, a) => sum + (a.services?.price || 0), 0) || 0

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0

    // Agendamentos por serviço
    const serviceMap = {}
    appointments?.forEach(app => {
      const serviceName = app.services?.name || 'Desconhecido'
      if (!serviceMap[serviceName]) {
        serviceMap[serviceName] = { name: serviceName, count: 0 }
      }
      serviceMap[serviceName].count++
    })

    // Agendamentos por dia
    const days = eachDayOfInterval({ start, end })
    const dailyData = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const count = appointments?.filter(a => 
        format(parseISO(a.start_datetime), 'yyyy-MM-dd') === dayStr
      ).length || 0
      return { date: format(day, 'dd/MM'), count }
    })

    res.json({
      revenue,
      appointments: total,
      cancellations: cancellationRate,
      completionRate,
      services: Object.values(serviceMap).sort((a, b) => b.count - a.count),
      daily: dailyData
    })
  } catch (error) {
    console.error('reports error:', error)
    res.status(500).json({ error: 'Erro ao gerar relatórios' })
  }
})

export default router