import express from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { query } from '../config/database.js'
import { generateToken } from '../middleware/auth.js'

const router = express.Router()

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' })
    }
    
    const result = await query(
      `SELECT u.*, s.id as salon_id, s.name as salon_name, s.email as salon_email, 
              s.logo_url, s.whatsapp_number, s.opening_time, s.closing_time
       FROM users u
       JOIN salons s ON s.id = u.salon_id
       WHERE u.email = $1 AND u.active = true`,
      [email]
    )
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }
    
    const user = result.rows[0]
    const isValid = await bcrypt.compare(password, user.password_hash)
    
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }
    
    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id])
    
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      salon_id: user.salon_id
    })
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      salon: {
        id: user.salon_id,
        name: user.salon_name,
        email: user.salon_email,
        logo_url: user.logo_url,
        whatsapp_number: user.whatsapp_number,
        opening_time: user.opening_time,
        closing_time: user.closing_time
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Setup inicial
router.post('/setup', async (req, res) => {
  try {
    const { salon_name, salon_email, whatsapp_number, admin_name, admin_email, admin_password } = req.body
    
    if (!salon_name || !admin_email || !admin_password) {
      return res.status(400).json({ error: 'Dados incompletos' })
    }
    
    // Criar salão
    const salonResult = await query(
      `INSERT INTO salons (name, email, whatsapp_number) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [salon_name, salon_email || admin_email, whatsapp_number?.replace(/\D/g, '')]
    )
    
    const salon = salonResult.rows[0]
    
    // Hash password
    const password_hash = await bcrypt.hash(admin_password, 10)
    
    // Criar admin
    const userResult = await query(
      `INSERT INTO users (salon_id, email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, role`,
      [salon.id, admin_email, password_hash, admin_name, 'ADMIN']
    )
    
    const user = userResult.rows[0]
    
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      salon_id: salon.id
    })
    
    res.status(201).json({
      message: 'Setup concluído com sucesso',
      token,
      user,
      salon
    })
  } catch (error) {
    console.error('Setup error:', error)
    res.status(500).json({ error: 'Erro ao criar setup' })
  }
})

export default router