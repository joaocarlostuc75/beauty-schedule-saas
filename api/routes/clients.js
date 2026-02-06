import express from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticate)

// GET /api/clients - listar todos os clientes do salão
router.get('/', async (req, res) => {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('salon_id', req.user.salon_id)
      .order('name')

    if (error) throw error
    res.json(clients)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/clients/:id - detalhes de um cliente
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data: client, error } = await supabase
      .from('clients')
      .select('*, appointments(*, services(name))')
      .eq('id', id)
      .eq('salon_id', req.user.salon_id)
      .single()

    if (error || !client) {
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }

    res.json(client)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/clients - criar cliente
router.post('/', async (req, res) => {
  try {
    const { name, email, phone } = req.body

    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' })
    }

    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        salon_id: req.user.salon_id,
        name,
        email,
        phone,
        lgpd_consent: true,
        consent_date: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email já cadastrado para este salão' })
      }
      throw error
    }

    res.status(201).json(client)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/clients/:id - atualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, phone } = req.body

    const { data: client, error } = await supabase
      .from('clients')
      .update({ name, email, phone })
      .eq('id', id)
      .eq('salon_id', req.user.salon_id)
      .select()
      .single()

    if (error) throw error

    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }

    res.json(client)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/clients/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('salon_id', req.user.salon_id)

    if (error) throw error

    res.json({ message: 'Cliente removido com sucesso' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router