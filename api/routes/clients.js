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
      .order('name', { ascending: true })

    if (error) throw error

    res.json(clients)
  } catch (error) {
    console.error('list clients error:', error)
    res.status(500).json({ error: 'Erro ao listar clientes' })
  }
})

// POST /api/clients - criar novo cliente
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
        return res.status(409).json({ error: 'Cliente com este email já existe' })
      }
      throw error
    }

    res.status(201).json(client)
  } catch (error) {
    console.error('create client error:', error)
    res.status(500).json({ error: 'Erro ao criar cliente' })
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
    console.error('update client error:', error)
    res.status(500).json({ error: 'Erro ao atualizar cliente' })
  }
})

// DELETE /api/clients/:id - deletar cliente
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
    console.error('delete client error:', error)
    res.status(500).json({ error: 'Erro ao excluir cliente' })
  }
})

export default router