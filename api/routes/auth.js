import express from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '../config/supabase.js'
import { generateToken, authenticate } from '../middleware/auth.js'

const router = express.Router()

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' })
    }
    
    // Find user with salon
    const { data: user, error } = await supabase
      .from('users')
      .select('*, salons(*)')
      .eq('email', email)
      .eq('active', true)
      .single()
    
    if (error || !user) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash)
    
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }
    
    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)
    
    // Generate token
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
      salon: user.salons
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Register (criar primeiro admin - apenas para setup inicial)
router.post('/setup', async (req, res) => {
  try {
    const { salon_name, salon_email, whatsapp_number, admin_name, admin_email, admin_password } = req.body
    
    // Validar dados
    if (!salon_name || !admin_email || !admin_password) {
      return res.status(400).json({ error: 'Dados incompletos' })
    }
    
    // Criar salão
    const { data: salon, error: salonError } = await supabase
      .from('salons')
      .insert({
        name: salon_name,
        email: salon_email || admin_email,
        whatsapp_number: whatsapp_number?.replace(/\D/g, '')
      })
      .select()
      .single()
    
    if (salonError) {
      return res.status(500).json({ error: 'Erro ao criar salão', details: salonError.message })
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(admin_password, 10)
    
    // Criar admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        salon_id: salon.id,
        email: admin_email,
        password_hash,
        name: admin_name,
        role: 'ADMIN'
      })
      .select()
      .single()
    
    if (userError) {
      // Rollback salão
      await supabase.from('salons').delete().eq('id', salon.id)
      return res.status(500).json({ error: 'Erro ao criar usuário', details: userError.message })
    }
    
    // Gerar token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      salon_id: salon.id
    })
    
    res.status(201).json({
      message: 'Setup concluído com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      salon
    })
  } catch (error) {
    console.error('Setup error:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    },
    salon: req.user.salon
  })
})

export default router