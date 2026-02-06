import express from 'express'
import { query } from '../config/database.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticate)

// Listar todos os usuários (apenas admin)
router.get('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, role, active, created_at, last_login 
       FROM users 
       WHERE salon_id = $1 
       ORDER BY created_at DESC`,
      [req.user.salon_id]
    )
    
    res.json(result.rows)
  } catch (error) {
    console.error('list users error:', error)
    res.status(500).json({ error: 'Erro ao listar usuários' })
  }
})

// Criar novo usuário (apenas admin)
router.post('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' })
    }
    
    if (!['ADMIN', 'STAFF'].includes(role)) {
      return res.status(400).json({ error: 'Role inválida' })
    }
    
    const bcrypt = await import('bcryptjs')
    const password_hash = await bcrypt.hash(password, 10)
    
    const result = await query(
      `INSERT INTO users (salon_id, name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, role, active, created_at`,
      [req.user.salon_id, name, email, password_hash, role || 'STAFF']
    )
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('create user error:', error)
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email já cadastrado neste salão' })
    }
    res.status(500).json({ error: 'Erro ao criar usuário' })
  }
})

// Atualizar usuário (apenas admin)
router.put('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, role, active } = req.body
    
    if (id === req.user.id && active === false) {
      return res.status(400).json({ error: 'Não pode desativar sua própria conta' })
    }
    
    const result = await query(
      `UPDATE users 
       SET name = $1, email = $2, role = $3, active = $4 
       WHERE id = $5 AND salon_id = $6 
       RETURNING id, name, email, role, active`,
      [name, email, role, active, id, req.user.salon_id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('update user error:', error)
    res.status(500).json({ error: 'Erro ao atualizar usuário' })
  }
})

// Deletar usuário (apenas admin)
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Não pode deletar sua própria conta' })
    }
    
    await query(
      'DELETE FROM users WHERE id = $1 AND salon_id = $2',
      [id, req.user.salon_id]
    )
    
    res.json({ message: 'Usuário removido com sucesso' })
  } catch (error) {
    console.error('delete user error:', error)
    res.status(500).json({ error: 'Erro ao excluir usuário' })
  }
})

export default router