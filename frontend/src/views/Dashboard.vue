<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Dashboard</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded shadow p-6">
        <h3 class="text-gray-600 text-sm font-semibold mb-2">Licitaciones Activas</h3>
        <p class="text-3xl font-bold text-blue-600">{{ totalActivas }}</p>
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
      <div v-if="licitacionesRecientes.length > 0" class="space-y-4">
        <div v-for="lic in licitacionesRecientes.slice(0, 5)" :key="lic.id" class="border-b pb-4">
          <div class="flex justify-between items-start">
            <div>
              <p class="font-semibold">{{ lic.NombreLicitacion }}</p>
              <p class="text-sm text-gray-600">{{ lic.NombreOrganismo }}</p>
            </div>
            <span v-if="lic.nivel_match" class="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
              {{ lic.nivel_match }}%
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

const totalActivas = ref(0)
const mejorMatch = ref(0)

const licitacionesGuardadas = computed(() => licitacionesStore.licitacionesGuardadas)
const licitacionesRecientes = computed(() => licitacionesStore.licitaciones)

onMounted(async () => {
  await licitacionesStore.obtenerLicitacionesActivas()
  await licitacionesStore.obtenerLicitacionesGuardadas(authStore.usuarioId)
  
  totalActivas.value = licitacionesRecientes.value.length
  
  if (licitacionesGuardadas.value.length > 0) {
    mejorMatch.value = Math.max(...licitacionesGuardadas.value.map(l => l.nivel_match || 0))
  }
})
</script>
