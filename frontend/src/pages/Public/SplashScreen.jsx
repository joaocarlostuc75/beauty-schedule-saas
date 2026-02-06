import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'

const SplashScreen = () => {
  const navigate = useNavigate()
  const [salon, setSalon] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSalon = async () => {
      try {
        // Buscar configurações do salão (assumindo salon_id fixo para single-tenant)
        const { data } = await api.get('/public/salon')
        setSalon(data)
      } catch (error) {
        console.error('Erro ao carregar salão:', error)
        toast.error('Erro ao carregar informações')
      } finally {
        setLoading(false)
      }
    }
    fetchSalon()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-24 h-24 bg-primary-200 rounded-3xl mx-auto mb-4"></div>
          <div className="h-4 bg-primary-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
      {/* Logo do Salão */}
      <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
        {salon?.logo_url ? (
          <img 
            src={salon.logo_url} 
            alt={salon.name} 
            className="w-32 h-32 object-contain drop-shadow-2xl"
          />
        ) : (
          <div className="w-32 h-32 bg-white rounded-3xl shadow-glow flex items-center justify-center">
            <span className="text-primary-500 font-display text-5xl font-bold">B</span>
          </div>
        )}
      </div>

      {/* Nome do Salão */}
      <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-800 mb-4 text-center">
        {salon?.name || 'Beauty Schedule'}
      </h1>
      
      <p className="text-gray-600 text-lg mb-12 text-center max-w-md">
        Agende seu momento de cuidado e bem-estar
      </p>

      {/* CTA Button */}
      <button
        onClick={() => navigate('/agendar')}
        className="btn-primary text-xl px-12 py-4 shadow-glow hover:scale-105 transform transition-all"
      >
        ENTRAR
      </button>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-primary-100 rounded-full opacity-50 blur-2xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-secondary-100 rounded-full opacity-50 blur-3xl"></div>
    </div>
  )
}

export default SplashScreen