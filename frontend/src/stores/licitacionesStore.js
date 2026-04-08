import { defineStore } from 'pinia'
import axios from 'axios'

export const useLicitacionesStore = defineStore('licitaciones', {
  state: () => ({
    licitaciones: [],
    licitacionesGuardadas: [],
    loading: false,
    error: null,
    filtros: {
      proveedor: '',
      region: '',
      estado: '',
      fechaInicio: '',
      fechaFin: ''
    }
  }),

  actions: {
    async obtenerLicitacionesActivas() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/api/licitaciones/activas', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.licitaciones = response.data.Listado || []
      } catch (error) {
        this.error = error.response?.data?.error || 'Error obteniendo licitaciones'
      } finally {
        this.loading = false
      }
    },

    async obtenerLicitacionesPorFecha(fecha) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`/api/licitaciones/fecha/${fecha}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.licitaciones = response.data.Listado || []
      } catch (error) {
        this.error = error.response?.data?.error || 'Error obteniendo licitaciones'
      } finally {
        this.loading = false
      }
    },

    async obtenerLicitacionesPorEstado(estado, fecha = null) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`/api/licitaciones/estado/${estado}`, {
          params: { fecha },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.licitaciones = response.data.Listado || []
      } catch (error) {
        this.error = error.response?.data?.error || 'Error obteniendo licitaciones'
      } finally {
        this.loading = false
      }
    },

    async guardarLicitacion(usuarioId, codigoLicitacion, datosLicitacion, nivelMatch, analisisIa) {
      try {
        const response = await axios.post('/api/licitaciones/guardar', {
          usuarioId,
          codigoLicitacion,
          datosLicitacion,
          nivelMatch,
          analisisIa
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
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`/api/licitaciones/guardadas/${usuarioId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.licitacionesGuardadas = response.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Error obteniendo licitaciones guardadas'
      } finally {
        this.loading = false
      }
    },

    setFiltros(nuevosFiltros) {
      this.filtros = { ...this.filtros, ...nuevosFiltros }
    },

    limpiarFiltros() {
      this.filtros = {
        proveedor: '',
        region: '',
        estado: '',
        fechaInicio: '',
        fechaFin: ''
      }
    }
  }
})
