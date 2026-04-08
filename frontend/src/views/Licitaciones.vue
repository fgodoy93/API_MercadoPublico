<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Licitaciones</h1>

    <!-- Filtros -->
    <div class="bg-white rounded shadow p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">Filtros de Búsqueda</h2>
      
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium mb-1">Estado</label>
          <select v-model="filtros.estado" class="w-full border rounded px-3 py-2">
            <option value="">Todos</option>
            <option value="activas">Activas</option>
            <option value="publicada">Publicada</option>
            <option value="cerrada">Cerrada</option>
            <option value="adjudicada">Adjudicada</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Región</label>
          <input v-model="filtros.region" type="text" placeholder="Región" class="w-full border rounded px-3 py-2">
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Desde</label>
          <input v-model="filtros.fechaInicio" type="date" class="w-full border rounded px-3 py-2">
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Hasta</label>
          <input v-model="filtros.fechaFin" type="date" class="w-full border rounded px-3 py-2">
        </div>

        <div class="flex items-end gap-2">
          <button @click="buscar" class="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
            Buscar
          </button>
          <button @click="limpiar" class="px-4 py-2 border rounded hover:bg-gray-50">
            Limpiar
          </button>
        </div>
      </div>
    </div>

    <!-- Listado de Licitaciones -->
    <div v-if="licitacionesStore.loading" class="text-center text-gray-500">Cargando...</div>
    
    <div v-else-if="licitacionesStore.licitaciones.length > 0" class="space-y-4">
      <div v-for="licitacion in licitacionesStore.licitaciones" :key="licitacion.id" 
           class="bg-white rounded shadow p-6 hover:shadow-lg transition">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-semibold text-lg">{{ licitacion.NombreLicitacion }}</h3>
            <p class="text-sm text-gray-600">{{ licitacion.NombreOrganismo }}</p>
          </div>
          <span class="text-xs bg-gray-200 px-3 py-1 rounded">{{ licitacion.CodigoTipoLicitacion }}</span>
        </div>

        <div class="grid grid-cols-3 gap-4 text-sm mb-4">
          <div>
            <span class="text-gray-600">Presupuesto:</span>
            <p class="font-semibold">{{ formatCurrency(licitacion.MontoEstimado) }}</p>
          </div>
          <div>
            <span class="text-gray-600">Plazo:</span>
            <p class="font-semibold">{{ licitacion.FechaPublicacion }}</p>
          </div>
          <div>
            <span class="text-gray-600">Estado:</span>
            <p class="font-semibold">{{ getEstadoText(licitacion.Estado) }}</p>
          </div>
        </div>

        <div class="flex gap-2">
          <button @click="verDetalle(licitacion)" class="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
            Ver Detalle
          </button>
          <button @click="analizarMatch(licitacion)" v-if="perfil" class="flex-1 bg-purple-500 text-white py-2 rounded hover:bg-purple-600">
            Analizar Match
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-gray-500 py-8">
      No hay licitaciones disponibles
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLicitacionesStore } from '../stores/licitacionesStore'
import { usePerfilStore } from '../stores/perfilStore'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const licitacionesStore = useLicitacionesStore()
const perfilStore = usePerfilStore()
const authStore = useAuthStore()

const filtros = ref({
  estado: 'activas',
  region: '',
  fechaInicio: '',
  fechaFin: ''
})

const perfil = computed(() => perfilStore.perfil)

const buscar = async () => {
  if (filtros.value.estado) {
    await licitacionesStore.obtenerLicitacionesPorEstado(filtros.value.estado, filtros.value.fechaInicio)
  }
}

const limpiar = () => {
  filtros.value = {
    estado: 'activas',
    region: '',
    fechaInicio: '',
    fechaFin: ''
  }
  licitacionesStore.limpiarFiltros()
}

const verDetalle = (licitacion) => {
  router.push({
    name: 'DetalleLicitacion',
    params: { codigo: licitacion.CodigoLicitacion },
    state: { licitacion }
  })
}

const analizarMatch = async (licitacion) => {
  router.push({
    name: 'DetalleLicitacion',
    params: { codigo: licitacion.CodigoLicitacion },
    state: { licitacion, analizarMatch: true }
  })
}

const formatCurrency = (valor) => {
  if (!valor) return 'N/A'
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor)
}

const getEstadoText = (codigo) => {
  const estados = {
    '5': 'Publicada',
    '6': 'Cerrada',
    '7': 'Desierta',
    '8': 'Adjudicada',
    '18': 'Revocada',
    '19': 'Suspendida'
  }
  return estados[codigo] || 'Desconocido'
}

onMounted(async () => {
  await licitacionesStore.obtenerLicitacionesActivas()
  if (authStore.usuarioId) {
    await perfilStore.obtenerPerfil(authStore.usuarioId)
  }
})
</script>
