import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { createClient } from '@supabase/supabase-js'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiUpload, FiSave } from 'react-icons/fi'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const AdminSettings = () => {
  const { salon, updateSalon } = useAuthStore()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    whatsapp_number: '',
    opening_time: '09:00',
    closing_time: '18:00',
  })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (salon) {
      setFormData({
        name: salon.name || '',
        email: salon.email || '',
        phone: salon.phone || '',
        address: salon.address || '',
        whatsapp_number: salon.whatsapp_number || '',
        opening_time: salon.opening_time || '09:00',
        closing_time: salon.closing_time || '18:00',
      })
      if (salon.logo_url) {
        setLogoPreview(salon.logo_url)
      }
    }
  }, [salon])

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 2MB')
      return
    }

    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const uploadLogo = async () => {
    if (!logoFile) return salon?.logo_url

    setUploading(true)
    try {
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${salon.id}-${Date.now()}.${fileExt}`
      const { error: uploadError, data } = await supabase.storage
        .from('logos')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      toast.error('Erro ao fazer upload do logo')
      throw error
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      let logo_url = salon?.logo_url
      if (logoFile) {
        logo_url = await uploadLogo()
      }

      const { data } = await api.put('/admin/salon', {
        ...formData,
        logo_url,
      })

      updateSalon(data)
      toast.success('Configurações atualizadas')
      setLogoFile(null)
    } catch (error) {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-800 mb-2">Configurações</h1>
        <p className="text-gray-600">Gerencie as informações do seu salão</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo */}
        <div className="card">
          <h2 className="font-semibold text-lg text-gray-800 mb-4">Logo do Salão</h2>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {logoPreview && (
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <label className="btn-secondary cursor-pointer inline-flex items-center gap-2">
                <FiUpload size={18} />
                Selecionar Logo
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </label>
              <p className="text-sm text-gray-500 mt-2">PNG, JPG ou WEBP. Máximo 2MB</p>
            </div>
          </div>
        </div>

        {/* Informações Básicas */}
        <div className="card">
          <h2 className="font-semibold text-lg text-gray-800 mb-4">Informações Básicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Salão *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp *</label>
              <input
                type="tel"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                className="input-field"
                placeholder="5511999999999"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Horário de Funcionamento */}
        <div className="card">
          <h2 className="font-semibold text-lg text-gray-800 mb-4">Horário de Funcionamento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Abertura</label>
              <input
                type="time"
                value={formData.opening_time}
                onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fechamento</label>
              <input
                type="time"
                value={formData.closing_time}
                onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || uploading}
          className="btn-primary w-full md:w-auto flex items-center justify-center gap-2"
        >
          <FiSave size={20} />
          {saving || uploading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  )
}

export default AdminSettings