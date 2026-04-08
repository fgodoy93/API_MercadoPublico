import { defineStore } from 'pinia'
import axios from 'axios'

export const useLicitacionesStore = defineStore('licitaciones', {
  state: () => ({
    licitaciones: [],
    licitacionesGuardadas: [],
    total: 0,
    loading: false,
    error: null,
    regionSinCache: false
  }),

  actions: {
    async buscarLicitaciones({ estado, fecha, regiones } = {}) {
      this.loading = true
      this.error = null
      this.regionSinCache = false
      try {
        const params = {}
        if (estado && estado !== 'todos') params.estado = estado
        if (fecha) params.fecha = fecha
        if (regiones && regiones.length > 0) params.regiones = regiones.join(',')

        const response = await axios.get('/api/licitaciones/buscar', {
          params,
          timeout: 60000,
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.licitaciones = response.data.Listado || []
        this.total = response.data.Total || this.licitaciones.length
        this.regionSinCache = response.data.RegionSinCache || false
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          this.error = 'La búsqueda tardó demasiado. Intenta de nuevo.'
        } else {
          this.error = error.response?.data?.error || 'Error buscando licitaciones'
        }
      } finally {
        this.loading = false
      }
    },

    async obtenerLicitacionesHoy() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/api/licitaciones/hoy', {
          timeout: 60000,
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.licitaciones = response.data.Listado || []
        this.total = this.licitaciones.length
      } catch (error) {
        this.error = error.response?.data?.error || 'Error obteniendo licitaciones'
      } finally {
        this.loading = false
      }
    },

    async obtenerDetalleLicitacion(codigo) {
      const response = await axios.get(`/api/licitaciones/codigo/${codigo}`, {
        timeout: 120000,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const listado = response.data.Listado || []
      return listado.length > 0 ? listado[0] : null
    },

    async guardarLicitacion(usuarioId, codigoLicitacion, datosLicitacion, nivelMatch, analisisIa) {
      try {
        const response = await axios.post('/api/licitaciones/guardar', {
          usuarioId, codigoLicitacion, datosLicitacion, nivelMatch, analisisIa
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Error guardando licitación'
        throw error
      }
    },

    async obtenerLicitacionesGuardadas(usuarioId) {
      if (!usuarioId) return
      try {
        const response = await axios.get(`/api/licitaciones/guardadas/${usuarioId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.licitacionesGuardadas = response.data
      } catch (error) { /* silencioso */ }
    },

    limpiarFiltros() {
      this.licitaciones = []
      this.total = 0
      this.regionSinCache = false
    }
  }
})
