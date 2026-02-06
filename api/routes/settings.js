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

    if (error || !salon) {
      return res.status(404).json({ error: 'Salão não encontrado' })
    }

    res.json(salon)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/settings - atualizar configurações do salão (apenas admin)
router.put('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, email, phone, address, opening_time, closing_time, timezone, whatsapp_number } = req.body

    const { data: salon, error } = await supabase
      .from('salons')
      .update({
        name,
        email,
        phone,
        address,
        opening_time,
        closing_time,
        timezone,
        whatsapp_number: whatsapp_number?.replace(/\D/g, '')
      })
      .eq('id', req.user.salon_id)
      .select()
      .single()

    if (error) throw error

    res.json(salon)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/settings/logo - upload de logo (apenas admin)
router.post('/logo', requireRole('ADMIN'), async (req, res) => {
  try {
    const { base64Image, fileName } = req.body

    if (!base64Image || !fileName) {
      return res.status(400).json({ error: 'Imagem e nome do arquivo são obrigatórios' })
    }

    // Remover prefixo data:image/...base64, se existir
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload para Supabase Storage
    const filePath = `${req.user.salon_id}/${Date.now()}_${fileName}`
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('logos')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return res.status(500).json({ error: 'Erro ao fazer upload da imagem' })
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase
      .storage
      .from('logos')
      .getPublicUrl(filePath)

    // Atualizar salão com nova logo_url
    const { data: salon, error: updateError } = await supabase
      .from('salons')
      .update({ logo_url: publicUrl })
      .eq('id', req.user.salon_id)
      .select()
      .single()

    if (updateError) throw updateError

    res.json({ logo_url: publicUrl, salon })
  } catch (error) {
    console.error('Logo upload error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router