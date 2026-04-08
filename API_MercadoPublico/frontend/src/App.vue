<template>
  <div id="vite-app">
    <div class="min-h-screen bg-gray-50">
      <!-- Navigation -->
      <nav class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-xl font-bold text-blue-600">MercadoPublico Analyzer</h1>
          <div class="flex gap-4 items-center">
            <span v-if="usuario" class="text-gray-600">{{ usuario.nombre }}</span>
            <button v-if="usuario" @click="logout" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <div class="flex">
        <!-- Sidebar -->
        <aside v-if="usuario" class="w-64 bg-white shadow min-h-screen shrink-0">
          <nav class="p-4 space-y-2">
            <router-link to="/" class="block px-4 py-2 rounded hover:bg-blue-50 text-gray-700"
                         active-class="bg-blue-50 text-blue-700 font-semibold">
              Dashboard
            </router-link>
            <router-link to="/licitaciones" class="block px-4 py-2 rounded hover:bg-blue-50 text-gray-700"
                         active-class="bg-blue-50 text-blue-700 font-semibold">
              Licitaciones
            </router-link>
            <router-link to="/perfil" class="block px-4 py-2 rounded hover:bg-blue-50 text-gray-700"
                         active-class="bg-blue-50 text-blue-700 font-semibold">
              Mi Perfil
            </router-link>
          </nav>
        </aside>

        <!-- Main Content -->
        <main :class="usuario ? 'flex-1 min-w-0' : 'w-full'" class="p-8">
          <router-view v-if="appReady" />
          <div v-else class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/authStore'
import { useRouter } from 'vue-router'
import { computed, ref, onMounted } from 'vue'

const authStore = useAuthStore()
const router = useRouter()

const appReady = ref(false)
const usuario = computed(() => authStore.usuario)

const logout = () => {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  // Restaurar sesión ANTES de renderizar contenido
  authStore.restoreSession()
  appReady.value = true

  if (!authStore.isAuthenticated) {
    router.push('/login')
  }
})
</script>
