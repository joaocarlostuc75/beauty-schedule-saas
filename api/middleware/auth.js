const jwt = require('jsonwebtoken')
const supabase = require('../config/supabase')

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined')
}

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET)

    // Buscar usuário no banco
    const { data: user, error } = await supabase
      .from('users')
      .select('*, salon:salons(*)')
      .eq('id', decoded.userId)
      .eq('active', true)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' })
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      salon_id: user.salon_id,
      salon: user.salon,
    }

    next()
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' })
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' })
    }

    next()
  }
}

module.exports = { authenticate, requireRole, JWT_SECRET }