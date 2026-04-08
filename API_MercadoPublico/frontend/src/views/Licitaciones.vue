<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Licitaciones</h1>

    <!-- Filtros -->
    <div class="bg-white rounded shadow p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">Filtros de Búsqueda</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium mb-1">Estado</label>
          <select v-model="filtros.estado" class="w-full border rounded px-3 py-2">
            <option value="">Todos (hoy)</option>
            <option value="publicada">Publicada</option>
            <option value="cerrada">Cerrada</option>
            <option value="adjudicada">Adjudicada</option>
            <option value="desierta">Desierta</option>
            <option value="revocada">Revocada</option>
            <option value="suspendida">Suspendida</option>
          </select>
        </div>

        <!-- Multi-select de Regiones -->
        <div class="relative" ref="regionDropdownRef">
          <label class="block text-sm font-medium mb-1">Regiones</label>
          <div @click="regionDropdownOpen = !regionDropdownOpen"
               class="w-full border rounded px-3 py-2 cursor-pointer bg-white min-h-[42px] flex items-center flex-wrap gap-1">
            <template v-if="filtros.regiones.length > 0">
              <span v-for="region in filtros.regiones" :key="region"
                    class="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                {{ regionCorta(region) }}
                <button @click.stop="removeRegion(region)" class="text-blue-600 hover:text-blue-900 font-bold">&times;</button>
              </span>
            </template>
            <span v-else class="text-gray-400 text-sm">Todas las regiones</span>
          </div>
          <div v-if="regionDropdownOpen"
               class="absolute z-50 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
            <div v-for="region in REGIONES" :key="region"
                 @click="toggleRegion(region)"
                 class="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2 text-sm">
              <input type="checkbox" :checked="filtros.regiones.includes(region)" class="pointer-events-none">
              <span>{{ region }}</span>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Fecha</label>
          <input v-model="filtros.fecha" type="date" class="w-full border rounded px-3 py-2">
        </div>

        <div class="flex items-end gap-2">
          <button @click="buscar" :disabled="store.loading"
                  class="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50">
            {{ store.loading ? 'Buscando...' : 'Buscar' }}
          </button>
          <button @click="limpiar" class="px-4 py-2 border rounded hover:bg-gray-50">
            Limpiar
          </button>
        </div>
      </div>
    </div>

    <!-- Aviso filtro de región sin cache -->
    <div v-if="store.regionSinCache" class="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded mb-4 text-sm">
      El filtro por región funciona con licitaciones que hayas consultado en detalle previamente.
      Haz clic en "Ver Detalle" de las licitaciones para ir construyendo el filtro por región.
    </div>

    <!-- Error -->
    <div v-if="store.error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
      {{ store.error }}
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
      <p class="mt-3 text-gray-500">Cargando licitaciones...</p>
    </div>

    <!-- Resultados -->
    <template v-if="!store.loading">
      <div v-if="store.licitaciones.length > 0" class="mb-4 text-sm text-gray-600">
        Mostrando {{ store.licitaciones.length }}
        <span v-if="store.total > store.licitaciones.length"> de {{ store.total }}</span>
        licitaciones
      </div>

      <div v-if="store.licitaciones.length > 0" class="space-y-3">
        <div v-for="lic in store.licitaciones" :key="lic.CodigoExterno"
             class="bg-white rounded shadow p-5 hover:shadow-lg transition cursor-pointer"
             @click="verDetalle(lic)">
          <!-- Header -->
          <div class="flex justify-between items-start mb-2">
            <div class="flex-1 mr-3">
              <h3 class="font-semibold text-base leading-tight mb-1">{{ lic.Nombre }}</h3>
              <div class="flex flex-wrap gap-x-3 text-sm text-gray-500">
                <span v-if="lic.NombreOrganismo" class="font-medium text-gray-600">{{ lic.NombreOrganismo }}</span>
                <span v-if="lic.RegionUnidad">{{ lic.RegionUnidad }}</span>
                <span class="font-mono text-xs text-gray-400">{{ lic.CodigoExterno }}</span>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0">
              <span v-if="lic.Tipo" class="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">{{ lic.Tipo }}</span>
              <span class="text-xs px-2 py-0.5 rounded font-medium" :class="estadoBadgeClass(lic.CodigoEstado)">
                {{ lic.Estado }}
              </span>
            </div>
          </div>

          <!-- Info row -->
          <div class="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
            <span v-if="lic.MontoEstimado" class="font-semibold text-green-700">
              {{ formatCurrency(lic.MontoEstimado) }}
            </span>
            <span v-if="lic.FechaCierre">
              Cierre: {{ formatFecha(lic.FechaCierre) }}
            </span>
            <span v-if="lic.FechaPublicacion">
              Pub: {{ formatFecha(lic.FechaPublicacion) }}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 mt-3" @click.stop>
            <button @click="verDetalle(lic)"
                    class="flex-1 bg-blue-500 text-white py-1.5 rounded hover:bg-blue-600 text-sm">
              Ver Detalle
            </button>
            <button @click="analizarMatch(lic)" v-if="perfil"
                    class="flex-1 bg-purple-500 text-white py-1.5 rounded hover:bg-purple-600 text-sm">
              Analizar Match
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="!store.loading" class="text-center text-gray-500 py-12 bg-white rounded shadow">
        <p class="text-lg mb-2">No se encontraron licitaciones</p>
        <p class="text-sm">Intenta cambiar los filtros de búsqueda</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useLicitacionesStore } from '../stores/licitacionesStore'
import { usePerfilStore } from '../stores/perfilStore'
import { useAuthStore } from '../stores/authStore'
import { REGIONES_CHILE } from '../config.js'

const router = useRouter()
const store = useLicitacionesStore()
const perfilStore = usePerfilStore()
const authStore = useAuthStore()

const REGIONES = REGIONES_CHILE
const regionDropdownOpen = ref(false)
const regionDropdownRef = ref(null)

const filtros = ref({ estado: '', regiones: [], fecha: '' })
const perfil = computed(() => perfilStore.perfil)

const toggleRegion = (region) => {
  const idx = filtros.value.regiones.indexOf(region)
  if (idx === -1) filtros.value.regiones.push(region)
  else filtros.value.regiones.splice(idx, 1)
}

const removeRegion = (region) => {
  filtros.value.regiones = filtros.value.regiones.filter(r => r !== region)
}

const regionCorta = (region) => region.length > 15 ? region.substring(0, 13) + '...' : region

const handleClickOutside = (event) => {
  if (regionDropdownRef.value && !regionDropdownRef.value.contains(event.target)) {
    regionDropdownOpen.value = false
  }
}

const buscar = () => store.buscarLicitaciones({
  estado: filtros.value.estado || null,
  fecha: filtros.value.fecha || null,
  regiones: filtros.value.regiones
})

const limpiar = () => {
  filtros.value = { estado: '', regiones: [], fecha: '' }
  buscar()
}

const verDetalle = (lic) => {
  router.push({ name: 'DetalleLicitacion', params: { codigo: lic.CodigoExterno } })
}

const analizarMatch = (lic) => {
  router.push({ name: 'DetalleLicitacion', params: { codigo: lic.CodigoExterno }, query: { analizar: '1' } })
}

const formatCurrency = (valor) => {
  if (!valor) return ''
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor)
}

const formatFecha = (fecha) => {
  if (!fecha) return ''
  try { return new Date(fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
  catch { return fecha }
}

const estadoBadgeClass = (codigo) => {
  const c = { 5: 'bg-green-100 text-green-800', 6: 'bg-red-100 text-red-800', 7: 'bg-gray-100 text-gray-800', 8: 'bg-blue-100 text-blue-800', 18: 'bg-orange-100 text-orange-800', 19: 'bg-yellow-100 text-yellow-800' }
  return c[codigo] || 'bg-gray-100 text-gray-800'
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  await buscar()
  if (authStore.usuarioId) await perfilStore.obtenerPerfil(authStore.usuarioId)
})

onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>
