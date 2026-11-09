<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4 py-12">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <div class="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center font-extrabold text-2xl text-white shadow-lg mb-3">
          MP
        </div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">MercadoPúblico Intelligence</h1>
        <p class="text-xs text-slate-300 mt-1">Plataforma Inteligente de Licitaciones, Montos y Factibilidad IA</p>
      </div>

      <div class="bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
        <h2 class="text-xl font-extrabold mb-6 text-center text-slate-900">
          {{ mostrarRegistro ? 'Crear Cuenta de Proveedor' : 'Iniciar Sesión' }}
        </h2>

        <form @submit.prevent="enviar" class="space-y-4">
          <div v-if="mostrarRegistro">
            <label class="block text-slate-700 mb-1.5 text-xs font-bold uppercase">Nombre Completo / Empresa</label>
            <input
              v-model="form.nombre"
              type="text"
              class="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej: Francisco Godoy"
              required
            />
          </div>

          <div>
            <label class="block text-slate-700 mb-1.5 text-xs font-bold uppercase">Correo Electrónico</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="correo@empresa.cl"
              required
            />
          </div>

          <div>
            <label class="block text-slate-700 mb-1.5 text-xs font-bold uppercase">Contraseña</label>
            <input
              v-model="form.contrasena"
              type="password"
              class="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••"
              required
            />
          </div>

          <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl disabled:opacity-50 font-bold text-sm shadow transition"
          >
            {{ authStore.loading ? 'Procesando...' : (mostrarRegistro ? 'Crear Cuenta' : 'Ingresar a la Plataforma') }}
          </button>
        </form>

        <button
          @click="mostrarRegistro = !mostrarRegistro"
          class="w-full mt-5 text-blue-600 hover:underline text-xs font-semibold text-center"
        >
          {{ mostrarRegistro ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿Nuevo proveedor? Regístrate gratis' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const mostrarRegistro = ref(false)
const form = ref({
  nombre: '',
  email: '',
  contrasena: ''
})
const error = ref('')

const enviar = async () => {
  try {
    error.value = ''
    if (mostrarRegistro.value) {
      await authStore.registro(form.value.email, form.value.nombre, form.value.contrasena)
    } else {
      await authStore.login(form.value.email, form.value.contrasena)
    }
    router.push('/')
  } catch (err) {
    error.value = authStore.error || 'Error en la operación'
  }
}
</script>
