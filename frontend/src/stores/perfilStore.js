import { defineStore } from 'pinia'
import axios from 'axios'

export const usePerfilStore = defineStore('perfil', {
  state: () => ({
    perfil: null,
    loading: false,
    error: null
  }),

  actions: {
    async obtenerPerfil(usuarioId) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`/api/perfil/${usuarioId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.perfil = response.data
      } catch (error) {
        if (error.response?.status !== 404) {
          this.error = error.response?.data?.error || 'Error obteniendo perfil'
        }
      } finally {
        this.loading = false
      }
    },

    async guardarPerfil(usuarioId, datosPerfil) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post(`/api/perfil/${usuarioId}`, datosPerfil, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.perfil = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Error guardando perfil'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
