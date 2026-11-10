import { defineStore } from 'pinia'
import axios from 'axios'

export const useLicitacionesStore = defineStore('licitaciones', {
  state: () => ({
    licitaciones: [],
    comprasAgiles: [],
    totalComprasAgiles: 0,
    paginaComprasAgiles: 1,
    totalPaginasComprasAgiles: 1,
    fuenteComprasAgiles: '',
    licitacionesGuardadas: [],
    totalResultados: 0,
    paginaActual: 1,
    totalPaginas: 1,
    estadisticas: {},
    loading: false,
    loadingDetalle: false,
    enriqueciendoCodigos: {},
    error: null,
    filtros: {
      palabraClave: '',
      region: '',
      estado: 'activas',
      tipo: '',
      fecha: '',
      precioMin: null,
      precioMax: null,
      soloCierreProximo: false,
      ordenarPor: 'recientes_desc',
      pagina: 1,
      porPagina: 24
    }
  }),

  actions: {
    getHeaders() {
      return { Authorization: `Bearer ${localStorage.getItem('token')}` }
    },

    async obtenerLicitacionesActivas() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/api/licitaciones/activas', {
          headers: this.getHeaders()
        })
        this.licitaciones = response.data.Listado || []
        this.totalResultados = response.data.Cantidad || this.licitaciones.length
      } catch (error) {
        this.error = error.response?.data?.error || 'Error obteniendo licitaciones'
      } finally {
        this.loading = false
      }
    },

    async obtenerDetallePorCodigo(codigo) {
      this.loadingDetalle = true
      this.error = null
      try {
        const response = await axios.get(`/api/licitaciones/codigo/${encodeURIComponent(codigo)}`, {
          headers: this.getHeaders()
        })
        const detalle = response.data?.Listado?.[0] || null
        if (detalle) {
          const idx = this.licitaciones.findIndex(l => l.CodigoExterno === codigo)
          if (idx !== -1) {
            this.licitaciones[idx] = { ...this.licitaciones[idx], ...detalle }
          }
          const idxCA = this.comprasAgiles.findIndex(l => l.CodigoExterno === codigo)
          if (idxCA !== -1) {
            this.comprasAgiles[idxCA] = { ...this.comprasAgiles[idxCA], ...detalle }
          }
        }
        return detalle
      } catch (error) {
        this.error = error.response?.data?.error || 'Error obteniendo detalle de la licitación'
        return null
      } finally {
        this.loadingDetalle = false
      }
    },

    async enriquecerLicitacionIndividual(codigo) {
      if (this.enriqueciendoCodigos[codigo]) return null
      this.enriqueciendoCodigos[codigo] = true
      try {
        const detalle = await this.obtenerDetallePorCodigo(codigo)
        return detalle
      } finally {
        this.enriqueciendoCodigos[codigo] = false
      }
    },

    async enriquecerLote(codigos = []) {
      if (!codigos.length) return
      try {
        const response = await axios.post('/api/licitaciones/enriquecer', { codigos }, {
          headers: this.getHeaders()
        })
        const mapa = response.data || {}
        this.licitaciones = this.licitaciones.map(lic => {
          if (mapa[lic.CodigoExterno]) {
            return { ...lic, ...mapa[lic.CodigoExterno] }
          }
          return lic
        })
        this.comprasAgiles = this.comprasAgiles.map(lic => {
          if (mapa[lic.CodigoExterno]) {
            return { ...lic, ...mapa[lic.CodigoExterno] }
          }
          return lic
        })
        return mapa
      } catch (error) {
        console.error('Error enriqueciendo lote:', error)
      }
    },

    async obtenerLicitacionesPorFecha(fecha) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`/api/licitaciones/fecha/${fecha}`, {
          headers: this.getHeaders()
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
          headers: this.getHeaders()
        })
        this.licitaciones = response.data.Listado || []
      } catch (error) {
        this.error = error.response?.data?.error || 'Error obteniendo licitaciones'
      } finally {
        this.loading = false
      }
    },

    async buscarLicitaciones(filtros) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('/api/licitaciones/buscar', filtros, {
          headers: this.getHeaders()
        })
        this.licitaciones = response.data.Listado || []
        this.totalResultados = response.data.Total || 0
        this.paginaActual = response.data.Pagina || 1
        this.totalPaginas = response.data.TotalPaginas || 1
        this.estadisticas = response.data.Estadisticas || {}
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Error en la búsqueda'
      } finally {
        this.loading = false
      }
    },

    async buscarComprasAgiles(filtros) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('/api/licitaciones/compras-agiles', filtros, {
          headers: this.getHeaders()
        })
        this.comprasAgiles = response.data.Listado || []
        this.totalComprasAgiles = response.data.Total || 0
        this.paginaComprasAgiles = response.data.Pagina || 1
        this.totalPaginasComprasAgiles = response.data.TotalPaginas || 1
        this.fuenteComprasAgiles = response.data.Fuente || ''
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Error obteniendo compras ágiles'
      } finally {
        this.loading = false
      }
    },

    async obtenerLicitacionesRecomendadas(usuarioId, perfilId = null) {
      try {
        const response = await axios.get(`/api/licitaciones/recomendadas/${usuarioId}`, {
          params: perfilId ? { perfilId } : {},
          headers: this.getHeaders()
        })
        return response.data.Listado || []
      } catch (error) {
        this.error = error.response?.data?.error || 'Error obteniendo recomendadas'
        return []
      }
    },

    async simularPerfil(datosPerfil) {
      try {
        const response = await axios.post('/api/licitaciones/simular-perfil', datosPerfil, {
          headers: this.getHeaders()
        })
        return response.data
      } catch (error) {
        console.error('Error simulando perfil:', error)
        return { Cantidad: 0, TotalCoincidencias: 0, TotalComprasAgilesMatch: 0, Listado: [] }
      }
    },

    async guardarLicitacion(usuarioId, codigoLicitacion, datosLicitacion, nivelMatch = null, analisisIa = {}) {
      try {
        const response = await axios.post('/api/licitaciones/guardar', {
          usuarioId,
          codigoLicitacion,
          datosLicitacion,
          nivelMatch,
          analisisIa
        }, {
          headers: this.getHeaders()
        })
        await this.obtenerLicitacionesGuardadas(usuarioId)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Error guardando licitación'
        throw error
      }
    },

    async eliminarGuardada(usuarioId, codigoLicitacion) {
      try {
        await axios.delete(`/api/licitaciones/guardadas/${usuarioId}/${encodeURIComponent(codigoLicitacion)}`, {
          headers: this.getHeaders()
        })
        await this.obtenerLicitacionesGuardadas(usuarioId)
      } catch (error) {
        console.error('Error eliminando licitación guardada:', error)
      }
    },

    async obtenerLicitacionesGuardadas(usuarioId) {
      if (!usuarioId) return
      try {
        const response = await axios.get(`/api/licitaciones/guardadas/${usuarioId}`, {
          headers: this.getHeaders()
        })
        this.licitacionesGuardadas = response.data || []
      } catch (error) {
        this.error = error.response?.data?.error || 'Error obteniendo licitaciones guardadas'
      }
    }
  }
})
