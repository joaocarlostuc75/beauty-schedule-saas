const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const supabase = require('../config/supabase')
const { JWT_SECRET } = require('../middleware/auth')

const router = express.Router()

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios' })
    }

    // Buscar usuário
    const { data: user, error } = await supabase
      .from('users')
      .select('*, salon:salons(*)')
      .eq('email', email)
      .eq('active', true)
      .single()

    if (error || !user) {
      return res.status(401).json({ message: 'Credenciais inválidas' })
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas' })
    }

    // Atualizar último login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      salon: user.salon,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Erro ao fazer login' })
  }
})

module.exports = router