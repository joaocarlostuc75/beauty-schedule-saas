import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiSearch, FiEye, FiTrash2, FiX } from 'react-icons/fi'
import { formatDate } from '../../utils/helpers'

const AdminClients = () => {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientHistory, setClientHistory] = useState([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/admin/clients')
      setClients(data)
    } catch (error) {
      toast.error('Erro ao carregar clientes')
    }
  }

  const handleViewHistory = async (client) => {
    try {
      setSelectedClient(client)
      const { data } = await api.get(`/admin/clients/${client.id}/history`)
      setClientHistory(data)
      setShowModal(true)
    } catch (error) {
      toast.error('Erro ao carregar histórico')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) return
    try {
      await api.delete(`/admin/clients/${id}`)
      toast.success('Cliente excluído')
      fetchClients()
    } catch (error) {
      toast.error('Erro ao excluir cliente')
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-800 mb-2">Clientes</h1>
        <p className="text-gray-600">Gerencie seus clientes</p>
      </div>

      {/* Busca */}
      <div className="card">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="input-field pl-12"
          />
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="grid gap-4">
        {filteredClients.map((client) => (
          <div key={client.id} className="card hover:shadow-glow transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800 mb-1">{client.name}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>📧 {client.email}</p>
                  {client.phone && <p>📱 {client.phone}</p>}
                  <p className="text-xs text-gray-500">Cliente desde {formatDate(client.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewHistory(client)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Ver histórico"
                >
                  <FiEye size={18} />
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-500">
              {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de histórico */}
      {showModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-gray-800">{selectedClient.name}</h2>
                <p className="text-gray-600">{selectedClient.email}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
              </button>
            </div>

            <h3 className="font-semibold text-lg text-gray-800 mb-4">Histórico de Agendamentos</h3>
            {clientHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum agendamento registrado</p>
            ) : (
              <div className="space-y-3">
                {clientHistory.map((appointment) => (
                  <div key={appointment.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-800">{appointment.service_name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(appointment.start_datetime)} às {appointment.start_datetime.split('T')[1]?.substring(0, 5)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminClients