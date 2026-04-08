import { defineStore } from 'pinia'
import axios from 'axios'

export const useIaStore = defineStore('ia', {
  state: () => ({
    proveedorDisponible: null,
    analisisEnProceso: false,
    error: null
  }),

  actions: {
    async verificarDisponibilidad() {
      try {
        const response = await axios.get('/api/ia/disponibilidad', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.proveedorDisponible = response.data
      } catch (error) {
        this.error = 'Error verificando disponibilidad de IA'
      }
    },

    async analizarMatch(perfilEmpresa, licitacion, provider = 'best') {
      this.analisisEnProceso = true
      this.error = null
      try {
        const response = await axios.post('/api/ia/analizar-match', {
          perfilEmpresa,
          licitacion,
          provider
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Error en análisis de match'
        throw error
      } finally {
        this.analisisEnProceso = false
      }
    },

    async generarResumen(licitacion, provider = 'best') {
      this.analisisEnProceso = true
      this.error = null
      try {
        const response = await axios.post('/api/ia/resumen', {
          licitacion,
          provider
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Error generando resumen'
        throw error
      } finally {
        this.analisisEnProceso = false
      }
    },

    async generarDocumentacion(perfilEmpresa, licitacion, provider = 'best') {
      this.analisisEnProceso = true
      this.error = null
      try {
        const response = await axios.post('/api/ia/documentacion', {
          perfilEmpresa,
          licitacion,
          provider
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Error generando documentación'
        throw error
      } finally {
        this.analisisEnProceso = false
      }
    }
  }
})
