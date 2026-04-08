<template>
  <div class="min-h-screen bg-blue-50 flex items-center justify-center">
    <div class="max-w-md w-full mx-auto mt-20">
      <div class="bg-white rounded shadow p-8">
        <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">{{ mostrarRegistro ? 'Registro' : 'Login' }}</h2>

        <form @submit.prevent="enviar" class="space-y-4">
          <div v-if="mostrarRegistro" class="space-y-4">
            <div>
              <label class="block text-gray-700 mb-2 text-sm font-medium">Nombre</label>
              <input v-model="form.nombre" type="text" class="w-full border rounded px-3 py-2" placeholder="Tu nombre" required>
            </div>
          </div>

          <div>
            <label class="block text-gray-700 mb-2 text-sm font-medium">Email</label>
            <input v-model="form.email" type="email" class="w-full border rounded px-3 py-2" placeholder="correo@ejemplo.com" required>
          </div>

          <div>
            <label class="block text-gray-700 mb-2 text-sm font-medium">Contraseña</label>
            <input v-model="form.contrasena" type="password" class="w-full border rounded px-3 py-2" placeholder="••••••" required>
          </div>

          <div v-if="error" class="bg-red-100 text-red-700 p-3 rounded text-sm">{{ error }}</div>

          <button type="submit" :disabled="authStore.loading" class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50 font-medium">
            {{ authStore.loading ? 'Procesando...' : (mostrarRegistro ? 'Registrarse' : 'Entrar') }}
          </button>
        </form>

        <button @click="mostrarRegistro = !mostrarRegistro" class="w-full mt-4 text-blue-500 hover:underline text-sm">
          {{ mostrarRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate' }}
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
    console.log('Login exitoso, redirigiendo...')
    router.push('/')
  } catch (err) {
    console.error('Error:', err)
    error.value = authStore.error || 'Error en la operación'
  }
}
</script>
