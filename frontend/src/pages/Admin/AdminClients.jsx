import React, { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiPhone, FiMail, FiSearch } from 'react-icons/fi'
import axios from 'axios'
import toast from 'react-hot-toast'

const AdminClients = () => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })

  const getToken = () => {
    const storage = localStorage.getItem('auth-storage')
    return storage ? JSON.parse(storage).state.token : null
  }

  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/clients', {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      setClients(response.data)
    } catch (error) {
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingClient) {
        await axios.put(`/api/clients/${editingClient.id}`, formData, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
        toast.success('Cliente atualizado!')
      } else {
        await axios.post('/api/clients', formData, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
        toast.success('Cliente criado!')
      }
      setShowForm(false)
      setEditingClient(null)
      setFormData({ name: '', email: '', phone: '' })
      fetchClients()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar cliente')
    }
  }

  const handleEdit = (client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return
    try {
      await axios.delete(`/api/clients/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      toast.success('Cliente excluído!')
      fetchClients()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao excluir cliente')
    }
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-display font-bold text-gray-800">Clientes</h1>
        <button
          onClick={() => {
            setEditingClient(null)
            setFormData({ name: '', email: '', phone: '' })
            setShowForm(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none"
        />
      </div>

      {showForm && (
        <div className="card">
          <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">
            {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
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
            <div className="sm:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">
                {editingClient ? 'Atualizar' : 'Criar'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
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
      ) : filteredClients.length === 0 ? (
        <div className="card text-center py-12">
          <FiUsers className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClients.map((client) => (
            <div key={client.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <span className="text-primary-500 font-semibold text-lg">{client.name[0]}</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{client.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <FiMail size={14} />
                      {client.email}
                    </span>
                    {client.phone && (
                      <span className="flex items-center gap-1">
                        <FiPhone size={14} />
                        {client.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(client)}
                  className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <FiEdit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminClients