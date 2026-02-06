import express from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticate)

// Listar todos os serviços
router.get('/', async (req, res) => {
  try {
    const { active } = req.query
    
    let query = supabase
      .from('services')
      .select('*')
      .eq('salon_id', req.user.salon_id)
      .order('name')
    
    if (active !== undefined) {
      query = query.eq('active', active === 'true')
    }
    
    const { data: services, error } = await query
    
    if (error) throw error
    
    res.json(services)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Criar serviço (apenas admin)
router.post('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, description, price, duration_minutes, available_days, start_time, end_time } = req.body
    
    // Validar
    if (!name || !price || !duration_minutes) {
      return res.status(400).json({ error: 'Nome, preço e duração são obrigatórios' })
    }
    
    const { data: service, error } = await supabase
      .from('services')
      .insert({
        salon_id: req.user.salon_id,
        name,
        description,
        price,
        duration_minutes,
        available_days: available_days || [0, 1, 2, 3, 4, 5, 6],
        start_time,
        end_time,
        active: true
      })
      .select()
      .single()
    
    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Serviço com mesmo nome e duração já existe' })
      }
      throw error
    }
    
    res.status(201).json(service)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Atualizar serviço (apenas admin)
router.put('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    
    const { data: service, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .eq('salon_id', req.user.salon_id)
      .select()
      .single()
    
    if (error) throw error
    
    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado' })
    }
    
    res.json(service)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Deletar serviço (apenas admin)
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    
    // Verificar se há agendamentos futuros
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id')
      .eq('service_id', id)
      .eq('salon_id', req.user.salon_id)
      .in('status', ['PENDING', 'CONFIRMED', 'RESCHEDULED'])
      .gte('start_datetime', new Date().toISOString())
      .limit(1)
    
    if (appointments && appointments.length > 0) {
      return res.status(400).json({ 
        error: 'Não pode excluir serviço com agendamentos futuros. Desative-o em vez disso.' 
      })
    }
    
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
      .eq('salon_id', req.user.salon_id)
    
    if (error) throw error
    
    res.json({ message: 'Serviço removido com sucesso' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router