import { defineStore } from 'pinia'
import axios from 'axios'

export const usePerfilStore = defineStore('perfil', {
  state: () => ({
    perfil: null,
    perfiles: [],
    loading: false,
    error: null
  }),

  actions: {
    getHeaders() {
      return { Authorization: `Bearer ${localStorage.getItem('token')}` }
    },

    async obtenerListaPerfiles(usuarioId) {
      const uid = usuarioId || JSON.parse(localStorage.getItem('usuario') || '{}')?.id || 1
      try {
        const response = await axios.get(`/api/perfil/lista/${uid}`, {
          headers: this.getHeaders()
        })
        this.perfiles = response.data || []
        const activo = this.perfiles.find(p => p.esActivo) || this.perfiles[0] || null
        if (activo && !this.perfil) {
          this.perfil = activo
        }
        return this.perfiles
      } catch (error) {
        console.error('Error obteniendo lista de perfiles:', error)
        return []
      }
    },

    async obtenerPerfil(usuarioId, perfilId = null) {
      this.loading = true
      this.error = null
      const uid = usuarioId || JSON.parse(localStorage.getItem('usuario') || '{}')?.id || 1
      try {
        const [listaResp, perfilResp] = await Promise.all([
          axios.get(`/api/perfil/lista/${uid}`, { headers: this.getHeaders() }).catch(() => ({ data: [] })),
          axios.get(`/api/perfil/${uid}`, {
            params: perfilId ? { perfilId } : {},
            headers: this.getHeaders()
          })
        ])
        this.perfiles = listaResp.data || []
        this.perfil = perfilResp.data
        return this.perfil
      } catch (error) {
        if (error.response?.status !== 404) {
          this.error = error.response?.data?.error || 'Error obteniendo perfil'
        }
        return null
      } finally {
        this.loading = false
      }
    },

    async activarPerfil(perfilId) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.put(`/api/perfil/activar/${perfilId}`, {}, {
          headers: this.getHeaders()
        })
        this.perfil = response.data
        this.perfiles = this.perfiles.map(p => ({
          ...p,
          esActivo: p.id === response.data.id
        }))
        return this.perfil
      } catch (error) {
        this.error = error.response?.data?.error || 'Error activando perfil'
        throw error
      } finally {
        this.loading = false
      }
    },

    async guardarPerfil(usuarioId, datosPerfil) {
      this.loading = true
      this.error = null
      const uid = usuarioId || JSON.parse(localStorage.getItem('usuario') || '{}')?.id || 1
      try {
        const response = await axios.post(`/api/perfil/${uid}`, datosPerfil, {
          headers: this.getHeaders()
        })
        this.perfil = response.data
        await this.obtenerListaPerfiles(uid)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Error guardando perfil'
        throw error
      } finally {
        this.loading = false
      }
    },

    async eliminarPerfil(perfilId, usuarioId) {
      this.loading = true
      this.error = null
      const uid = usuarioId || JSON.parse(localStorage.getItem('usuario') || '{}')?.id || 1
      try {
        const response = await axios.delete(`/api/perfil/item/${perfilId}`, {
          headers: this.getHeaders()
        })
        await this.obtenerListaPerfiles(uid)
        this.perfil = response.data?.nuevoActivo || this.perfiles[0] || null
        return this.perfil
      } catch (error) {
        this.error = error.response?.data?.error || 'Error eliminando perfil'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
