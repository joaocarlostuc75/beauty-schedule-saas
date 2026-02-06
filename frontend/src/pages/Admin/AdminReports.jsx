import React, { useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiDownload, FiBarChart2 } from 'react-icons/fi'
import { formatCurrency } from '../../utils/helpers'

const AdminReports = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)

  const generateReport = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/reports?start=${dateRange.start}&end=${dateRange.end}`)
      setReportData(data)
    } catch (error) {
      toast.error('Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (!reportData) return
    // Simplificado - implementação real seria mais complexa
    const csv = `Receita Total,${reportData.revenue}\nAgendamentos,${reportData.totalAppointments}\nCancelamentos,${reportData.cancellations}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_${dateRange.start}_${dateRange.end}.csv`
    a.click()
    toast.success('Relatório exportado')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-800 mb-2">Relatórios</h1>
        <p className="text-gray-600">Análises e estatísticas do seu negócio</p>
      </div>

      {/* Filtros */}
      <div className="card">
        <h2 className="font-semibold text-lg text-gray-800 mb-4">Período</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex items-end">
            <button onClick={generateReport} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              <FiBarChart2 size={20} />
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
              <h3 className="text-gray-700 font-medium mb-2">Receita Total</h3>
              <p className="text-3xl font-bold text-gray-800">{formatCurrency(reportData.revenue)}</p>
            </div>
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <h3 className="text-gray-700 font-medium mb-2">Agendamentos</h3>
              <p className="text-3xl font-bold text-gray-800">{reportData.totalAppointments}</p>
            </div>
            <div className="card bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
              <h3 className="text-gray-700 font-medium mb-2">Cancelamentos</h3>
              <p className="text-3xl font-bold text-gray-800">{reportData.cancellations}</p>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-gray-800">Serviços Mais Populares</h2>
              <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
                <FiDownload size={18} />
                Exportar CSV
              </button>
            </div>
            <div className="space-y-3">
              {reportData.topServices?.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800">{service.name}</p>
                    <p className="text-sm text-gray-600">{service.count} agendamentos</p>
                  </div>
                  <p className="text-primary-600 font-semibold">{formatCurrency(service.revenue)}</p>
                </div>
              )) || <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>}
            </div>
          </div>
        </>
      )}

      {!reportData && !loading && (
        <div className="card text-center py-12">
          <FiBarChart2 size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Selecione um período e gere seu relatório</p>
        </div>
      )}
    </div>
  )
}

export default AdminReports