import express from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticate)

// GET /api/settings - obter configurações do salão
router.get('/', async (req, res) => {
  try {
    const { data: salon, error } = await supabase
      .from('salons')
      .select('*')
      .eq('id', req.user.salon_id)
      .single()

    if (error) throw error

    // Não retornar senhas SMTP
    const { smtp_pass, ...safeSalon } = salon

    res.json(safeSalon)
  } catch (error) {
    console.error('get settings error:', error)
    res.status(500).json({ error: 'Erro ao carregar configurações' })
  }
})

// PUT /api/settings - atualizar configurações do salão (apenas admin)
router.put('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, email, phone, address, whatsapp_number, opening_time, closing_time, timezone } = req.body

    const { data: salon, error } = await supabase
      .from('salons')
      .update({
        name,
        email,
        phone,
        address,
        whatsapp_number,
        opening_time,
        closing_time,
        timezone
      })
      .eq('id', req.user.salon_id)
      .select('id, name, email, phone, address, whatsapp_number, opening_time, closing_time, timezone, logo_url')
      .single()

    if (error) throw error

    res.json(salon)
  } catch (error) {
    console.error('update settings error:', error)
    res.status(500).json({ error: 'Erro ao atualizar configurações' })
  }
})

// POST /api/settings/logo - atualizar logo (apenas admin)
router.post('/logo', requireRole('ADMIN'), async (req, res) => {
  try {
    const { logo_url } = req.body

    if (!logo_url) {
      return res.status(400).json({ error: 'URL da logo é obrigatória' })
    }

    const { data: salon, error } = await supabase
      .from('salons')
      .update({ logo_url })
      .eq('id', req.user.salon_id)
      .select('logo_url')
      .single()

    if (error) throw error

    res.json(salon)
  } catch (error) {
    console.error('update logo error:', error)
    res.status(500).json({ error: 'Erro ao atualizar logo' })
  }
})

export default router