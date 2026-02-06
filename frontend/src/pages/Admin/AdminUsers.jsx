import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi'

const AdminUsers = () => {
  const { user } = useAuthStore()
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STAFF',
  })

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchUsers()
    }
  }, [])

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users')
      setUsers(data)
    } catch (error) {
      toast.error('Erro ao carregar usuários')
    }
  }

  const handleOpenModal = (userToEdit = null) => {
    if (userToEdit) {
      setEditingUser(userToEdit)
      setFormData({
        name: userToEdit.name,
        email: userToEdit.email,
        password: '',
        role: userToEdit.role,
      })
    } else {
      setEditingUser(null)
      setFormData({ name: '', email: '', password: '', role: 'STAFF' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({ name: '', email: '', password: '', role: 'STAFF' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, formData)
        toast.success('Usuário atualizado')
      } else {
        await api.post('/admin/users', formData)
        toast.success('Usuário criado')
      }
      handleCloseModal()
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar usuário')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return
    try {
      await api.delete(`/admin/users/${id}`)
      toast.success('Usuário excluído')
      fetchUsers()
    } catch (error) {
      toast.error('Erro ao excluir usuário')
    }
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Você não tem permissão para acessar esta página</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800 mb-2">Usuários</h1>
          <p className="text-gray-600">Gerencie a equipe do salão</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <FiPlus size={20} />
          Novo Usuário
        </button>
      </div>

      <div className="grid gap-4">
        {users.map((u) => (
          <div key={u.id} className="card hover:shadow-glow transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg text-gray-800">{u.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    u.role === 'ADMIN' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {u.role === 'ADMIN' ? 'Administrador' : 'Funcionário'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{u.email}</p>
              </div>
              {u.id !== user.id && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(u)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <FiEdit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-500">Nenhum usuário cadastrado</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-gray-800">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha {editingUser && '(deixe em branco para manter)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Função *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="STAFF">Funcionário</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingUser ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers