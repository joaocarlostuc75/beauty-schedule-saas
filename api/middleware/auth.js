import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { supabase } from '../config/supabase.js'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = '24h'

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET)
}

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' })
    }
    
    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    // Verify user still exists and is active
    const { data: user, error } = await supabase
      .from('users')
      .select('*, salons(*)')
      .eq('id', decoded.id)
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
      salon: user.salons
    }
    
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissão negada' })
    }
    next()
  }
}