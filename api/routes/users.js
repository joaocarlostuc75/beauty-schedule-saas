import express from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Todas as rotas precisam de autenticação
router.use(authenticate)

// Listar todos os usuários (apenas admin)
router.get('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, active, created_at, last_login')
      .eq('salon_id', req.user.salon_id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Criar novo usuário (apenas admin)
router.post('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    
    // Validar
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' })
    }
    
    if (!['ADMIN', 'STAFF'].includes(role)) {
      return res.status(400).json({ error: 'Role inválida' })
    }
    
    // Hash da senha
    const bcrypt = await import('bcryptjs')
    const password_hash = await bcrypt.hash(password, 10)
    
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        salon_id: req.user.salon_id,
        name,
        email,
        password_hash,
        role: role || 'STAFF'
      })
      .select('id, name, email, role, active, created_at')
      .single()
    
    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email já cadastrado neste salão' })
      }
      throw error
    }
    
    res.status(201).json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Atualizar usuário (apenas admin)
router.put('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, role, active } = req.body
    
    // Não permitir alterar a si mesmo para evitar lockout
    if (id === req.user.id && active === false) {
      return res.status(400).json({ error: 'Não pode desativar sua própria conta' })
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .update({ name, email, role, active })
      .eq('id', id)
      .eq('salon_id', req.user.salon_id)
      .select('id, name, email, role, active')
      .single()
    
    if (error) throw error
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }
    
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Deletar usuário (apenas admin)
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    
    // Não permitir deletar a si mesmo
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Não pode deletar sua própria conta' })
    }
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .eq('salon_id', req.user.salon_id)
    
    if (error) throw error
    
    res.json({ message: 'Usuário removido com sucesso' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router