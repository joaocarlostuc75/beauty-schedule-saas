import React, { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiScissors, FiClock, FiDollarSign } from 'react-icons/fi'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'

const AdminServices = () => {
  const { user } = useAuthStore()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
    active: true
  })

  const getToken = () => {
    const storage = localStorage.getItem('auth-storage')
    return storage ? JSON.parse(storage).state.token : null
  }

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/services', {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      setServices(response.data)
    } catch (error) {
      toast.error('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        duration_minutes: parseInt(formData.duration_minutes)
      }

      if (editingService) {
        await axios.put(`/api/services/${editingService.id}`, data, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
        toast.success('Serviço atualizado!')
      } else {
        await axios.post('/api/services', data, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
        toast.success('Serviço criado!')
      }

      setShowForm(false)
      setEditingService(null)
      setFormData({ name: '', description: '', price: '', duration_minutes: '', active: true })
      fetchServices()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar serviço')
    }
  }

  const handleEdit = (service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration_minutes: service.duration_minutes.toString(),
      active: service.active
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return

    try {
      await axios.delete(`/api/services/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      toast.success('Serviço excluído!')
      fetchServices()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao excluir serviço')
    }
  }

  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-800">
          Serviços
        </h1>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingService(null)
              setFormData({ name: '', description: '', price: '', duration_minutes: '', active: true })
              setShowForm(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus size={20} />
            Novo Serviço
          </button>
        )}
      </div>

      {showForm && (
        <div className="card">
          <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">
            {editingService ? 'Editar Serviço' : 'Novo Serviço'}
          </h2>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duração (minutos)</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Ativo</span>
              </label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">
                {editingService ? 'Atualizar' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-300 border-t-primary-500 rounded-full"></div>
        </div>
      ) : services.length === 0 ? (
        <div className="card text-center py-12">
          <FiScissors className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">Nenhum serviço cadastrado</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div key={service.id} className={`card ${!service.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{service.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${service.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {service.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{service.description || 'Sem descrição'}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-primary-600">
                  <FiDollarSign size={16} />
                  <span className="font-semibold">R$ {parseFloat(service.price).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1 text-secondary-400">
                  <FiClock size={16} />
                  <span>{service.duration_minutes} min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminServices