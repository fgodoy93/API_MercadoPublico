// Utilidades para manejo de datos y conversiones

export const formatCurrencyChilean = (valor) => {
  if (!valor) return 'N/A'
  return new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(valor)
}

export const formatDate = (date, locale = 'es-CL') => {
  if (!date) return 'N/A'
  const d = new Date(date)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d)
}

export const formatDateInput = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export const formatDateMercadoPublico = (date) => {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}${month}${year}`
}

export const parseRUT = (rut) => {
  if (!rut) return null
  const cleanRut = rut.replace(/[^0-9k-]/gi, '')
  const parts = cleanRut.split('-')
  return {
    numero: parts[0],
    digito: parts[1]
  }
}

export const formatRUT = (numero, digito) => {
  if (!numero) return ''
  const clean = numero.replace(/[^0-9]/g, '')
  const formatted = clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return digito ? `${formatted}-${digito}` : formatted
}

export const calculateMatchColor = (porcentaje) => {
  if (porcentaje < 30) return 'bg-red-500'
  if (porcentaje < 60) return 'bg-yellow-500'
  if (porcentaje < 80) return 'bg-blue-500'
  return 'bg-green-500'
}

export const calculateMatchClass = (porcentaje) => {
  if (porcentaje < 30) return 'text-red-600'
  if (porcentaje < 60) return 'text-yellow-600'
  if (porcentaje < 80) return 'text-blue-600'
  return 'text-green-600'
}

export const truncateText = (text, length = 100) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

export const groupLicitacionesByEstado = (licitaciones) => {
  return licitaciones.reduce((acc, lic) => {
    const estado = lic.Estado || 'desconocido'
    if (!acc[estado]) {
      acc[estado] = []
    }
    acc[estado].push(lic)
    return acc
  }, {})
}

export const groupLicitacionesByOrganismo = (licitaciones) => {
  return licitaciones.reduce((acc, lic) => {
    const organismo = lic.NombreOrganismo || 'desconocido'
    if (!acc[organismo]) {
      acc[organismo] = []
    }
    acc[organismo].push(lic)
    return acc
  }, {})
}

export const calculatePromedio = (numeros) => {
  if (numeros.length === 0) return 0
  return Math.round(numeros.reduce((a, b) => a + b, 0) / numeros.length)
}

export const getEstadoLabel = (codigo) => {
  const estados = {
    '5': 'Publicada',
    '6': 'Cerrada',
    '7': 'Desierta',
    '8': 'Adjudicada',
    '18': 'Revocada',
    '19': 'Suspendida',
    'activas': 'Activas',
    'todos': 'Todos'
  }
  return estados[codigo] || 'Desconocido'
}

export const getDaysUntil = (fecha) => {
  if (!fecha) return null
  const today = new Date()
  const target = new Date(fecha)
  const difference = target.getTime() - today.getTime()
  const days = Math.ceil(difference / (1000 * 3600 * 24))
  return days
}

export const isLicitacionProxima = (fecha, dias = 7) => {
  const daysUntil = getDaysUntil(fecha)
  return daysUntil !== null && daysUntil > 0 && daysUntil <= dias
}

export default {
  formatCurrencyChilean,
  formatDate,
  formatDateInput,
  formatDateMercadoPublico,
  parseRUT,
  formatRUT,
  calculateMatchColor,
  calculateMatchClass,
  truncateText,
  groupLicitacionesByEstado,
  groupLicitacionesByOrganismo,
  calculatePromedio,
  getEstadoLabel,
  getDaysUntil,
  isLicitacionProxima
}
