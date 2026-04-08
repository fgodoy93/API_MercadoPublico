import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    usuario: null,
    token: null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    usuarioId: (state) => state.usuario?.id
  },

  actions: {
    async registro(email, nombre, contrasena) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('/api/auth/registro', {
          email,
          nombre,
          contrasena
        })
        this.usuario = response.data.usuario
        this.token = response.data.token
        localStorage.setItem('token', this.token)
        localStorage.setItem('usuario', JSON.stringify(this.usuario))
      } catch (error) {
        this.error = error.response?.data?.error || 'Error en el registro'
        throw error
      } finally {
        this.loading = false
      }
    },

    async login(email, contrasena) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('/api/auth/login', {
          email,
          contrasena
        })
        this.usuario = response.data.usuario
        this.token = response.data.token
        localStorage.setItem('token', this.token)
        localStorage.setItem('usuario', JSON.stringify(this.usuario))
      } catch (error) {
        this.error = error.response?.data?.error || 'Error en el login'
        throw error
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.usuario = null
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
    },

    restoreSession() {
      const token = localStorage.getItem('token')
      const usuario = localStorage.getItem('usuario')
      if (token && usuario) {
        this.token = token
        this.usuario = JSON.parse(usuario)
      }
    }
  }
})
