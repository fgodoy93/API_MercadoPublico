<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Dashboard</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded shadow p-6">
        <h3 class="text-gray-600 text-sm font-semibold mb-2">Licitaciones de Hoy</h3>
        <p class="text-3xl font-bold text-blue-600">{{ totalHoy }}</p>
      </div>
      <div class="bg-white rounded shadow p-6">
        <h3 class="text-gray-600 text-sm font-semibold mb-2">Guardadas</h3>
        <p class="text-3xl font-bold text-green-600">{{ licitacionesGuardadas.length }}</p>
      </div>
      <div class="bg-white rounded shadow p-6">
        <h3 class="text-gray-600 text-sm font-semibold mb-2">Mejor Match</h3>
        <p class="text-3xl font-bold text-purple-600">{{ mejorMatch }}%</p>
      </div>
    </div>

    <div class="bg-white rounded shadow p-6">
      <h2 class="text-xl font-bold mb-4">Licitaciones Recientes</h2>
      <div v-if="loading" class="text-center py-4">
        <div class="inline-block animate-spin rounded-full h-6 w-6 border-4 border-blue-500 border-t-transparent"></div>
      </div>
      <div v-else-if="licitacionesRecientes.length > 0" class="space-y-4">
        <div v-for="lic in licitacionesRecientes.slice(0, 5)" :key="lic.CodigoExterno" class="border-b pb-4">
          <div class="flex justify-between items-start">
            <div>
              <p class="font-semibold">{{ lic.Nombre }}</p>
              <p class="text-sm text-gray-600">{{ lic.NombreOrganismo || '' }}</p>
            </div>
            <span class="text-xs px-3 py-1 rounded"
                  :class="lic.CodigoEstado == 5 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
              {{ getEstadoText(lic.CodigoEstado) }}
            </span>
          </div>
        </div>
      </div>
      <p v-else class="text-gray-500">No hay licitaciones disponibles</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useLicitacionesStore } from '../stores/licitacionesStore'

const authStore = useAuthStore()
const licitacionesStore = useLicitacionesStore()

const loading = ref(true)
const totalHoy = ref(0)
const mejorMatch = ref(0)

const licitacionesGuardadas = computed(() => licitacionesStore.licitacionesGuardadas)
const licitacionesRecientes = computed(() => licitacionesStore.licitaciones)

const getEstadoText = (codigo) => {
  const estados = { 5: 'Publicada', 6: 'Cerrada', 7: 'Desierta', 8: 'Adjudicada', 18: 'Revocada', 19: 'Suspendida' }
  return estados[codigo] || 'Desconocido'
}

onMounted(async () => {
  try {
    await licitacionesStore.obtenerLicitacionesHoy()
    await licitacionesStore.obtenerLicitacionesGuardadas(authStore.usuarioId)

    totalHoy.value = licitacionesRecientes.value.length

    if (licitacionesGuardadas.value.length > 0) {
      mejorMatch.value = Math.max(...licitacionesGuardadas.value.map(l => l.nivel_match || 0))
    }
  } finally {
    loading.value = false
  }
})
</script>
