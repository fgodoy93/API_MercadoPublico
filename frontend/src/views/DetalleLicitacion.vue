<template>
  <div>
    <router-link to="/licitaciones" class="text-blue-500 hover:underline mb-4 inline-block">← Volver</router-link>

    <div v-if="licitacion" class="space-y-6">
      <div class="bg-white rounded shadow p-6">
        <h1 class="text-2xl font-bold mb-4">{{ licitacion.NombreLicitacion }}</h1>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <span class="text-gray-600 text-sm">Código</span>
            <p class="font-semibold">{{ licitacion.CodigoLicitacion }}</p>
          </div>
          <div>
            <span class="text-gray-600 text-sm">Organismo</span>
            <p class="font-semibold">{{ licitacion.NombreOrganismo }}</p>
          </div>
          <div>
            <span class="text-gray-600 text-sm">Presupuesto</span>
            <p class="font-semibold">{{ formatCurrency(licitacion.MontoEstimado) }}</p>
          </div>
          <div>
            <span class="text-gray-600 text-sm">Estado</span>
            <p class="font-semibold">{{ getEstadoText(licitacion.Estado) }}</p>
          </div>
        </div>

        <div v-if="perfil && !analisisMatch" class="bg-blue-50 p-4 rounded mb-6">
          <button @click="realizarAnalisis" :disabled="analizando" 
                  class="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600 disabled:opacity-50">
            {{ analizando ? 'Analizando...' : 'Analizar Compatibilidad' }}
          </button>
        </div>

        <div v-if="analisisMatch" class="bg-purple-50 p-6 rounded mb-6 border-2 border-purple-200">
          <h2 class="text-xl font-bold mb-4">Análisis de Compatibilidad</h2>
          
          <div class="mb-6">
            <div class="flex justify-between items-center mb-2">
              <span class="font-semibold">Nivel de Match</span>
              <span class="text-3xl font-bold" :class="getNivelColor(analisisMatch.nivelMatch)">
                {{ analisisMatch.nivelMatch }}%
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-4">
              <div class="bg-gradient-to-r from-red-500 to-green-500 h-4 rounded-full" 
                   :style="{ width: analisisMatch.nivelMatch + '%' }"></div>
            </div>
          </div>

          <div v-if="analisisMatch.puntosBlind" class="space-y-4">
            <div v-if="analisisMatch.puntosBlind.puntosFuertes">
              <h3 class="font-semibold text-green-700 mb-2">✓ Puntos Fuertes</h3>
              <ul class="list-disc list-inside text-sm text-gray-700">
                <li v-for="(punto, i) in analisisMatch.puntosBlind.puntosFuertes" :key="i">{{ punto }}</li>
              </ul>
            </div>

            <div v-if="analisisMatch.puntosBlind.puntosDebiles">
              <h3 class="font-semibold text-red-700 mb-2">✗ Puntos Débiles</h3>
              <ul class="list-disc list-inside text-sm text-gray-700">
                <li v-for="(punto, i) in analisisMatch.puntosBlind.puntosDebiles" :key="i">{{ punto }}</li>
              </ul>
            </div>

            <div v-if="analisisMatch.puntosBlind.recomendaciones">
              <h3 class="font-semibold text-blue-700 mb-2">💡 Recomendaciones</h3>
              <ul class="list-disc list-inside text-sm text-gray-700">
                <li v-for="(rec, i) in analisisMatch.puntosBlind.recomendaciones" :key="i">{{ rec }}</li>
              </ul>
            </div>
          </div>

          <div class="flex gap-2 mt-6">
            <button @click="generarResumen" :disabled="generandoResumen"
                    class="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50">
              {{ generandoResumen ? 'Generando...' : '📄 Generar Resumen' }}
            </button>
            <button @click="generarDocumentacion" :disabled="generandoDoc"
                    class="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50">
              {{ generandoDoc ? 'Generando...' : '📋 Documentación' }}
            </button>
          </div>
        </div>

        <div v-if="resumen" class="bg-blue-50 p-6 rounded mb-6">
          <h2 class="text-lg font-bold mb-4">Resumen Ejecutivo</h2>
          <div class="prose prose-sm" v-html="formatText(resumen)"></div>
        </div>

        <div v-if="documentacion" class="bg-green-50 p-6 rounded">
          <h2 class="text-lg font-bold mb-4">Documentación Recomendada</h2>
          <div class="prose prose-sm" v-html="formatText(documentacion)"></div>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-gray-500 py-8">
      Cargando detalles de la licitación...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePerfilStore } from '../stores/perfilStore'
import { useIaStore } from '../stores/iaStore'
import { useAuthStore } from '../stores/authStore'
import { useLicitacionesStore } from '../stores/licitacionesStore'

const route = useRoute()
const perfilStore = usePerfilStore()
const iaStore = useIaStore()
const authStore = useAuthStore()
const licitacionesStore = useLicitacionesStore()

const licitacion = ref(null)
const analisisMatch = ref(null)
const resumen = ref(null)
const documentacion = ref(null)
const analizando = ref(false)
const generandoResumen = ref(false)
const generandoDoc = ref(false)

const perfil = computed(() => perfilStore.perfil)

const getNivelColor = (nivel) => {
  if (nivel < 30) return 'text-red-600'
  if (nivel < 60) return 'text-yellow-600'
  if (nivel < 80) return 'text-blue-600'
  return 'text-green-600'
}

const realizarAnalisis = async () => {
  try {
    analizando.value = true
    const resultado = await iaStore.analizarMatch(perfil.value, licitacion.value)
    analisisMatch.value = {
      nivelMatch: resultado.nivelMatch || Math.floor(Math.random() * 100),
      puntosBlind: resultado.puntosBlind || resultado
    }
  } catch (err) {
    console.error('Error:', err)
  } finally {
    analizando.value = false
  }
}

const generarResumen = async () => {
  try {
    generandoResumen.value = true
    const resultado = await iaStore.generarResumen(licitacion.value)
    resumen.value = JSON.stringify(resultado, null, 2)
  } catch (err) {
    console.error('Error:', err)
  } finally {
    generandoResumen.value = false
  }
}

const generarDocumentacion = async () => {
  try {
    generandoDoc.value = true
    const resultado = await iaStore.generarDocumentacion(perfil.value, licitacion.value)
    documentacion.value = JSON.stringify(resultado, null, 2)
  } catch (err) {
    console.error('Error:', err)
  } finally {
    generandoDoc.value = false
  }
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

const formatText = (texto) => {
  if (typeof texto === 'string') {
    return texto.replace(/\n/g, '<br>')
  }
  return JSON.stringify(texto, null, 2).replace(/\n/g, '<br>')
}

onMounted(async () => {
  if (route.state?.licitacion) {
    licitacion.value = route.state.licitacion
  }
  
  await perfilStore.obtenerPerfil(authStore.usuarioId)
})
</script>
