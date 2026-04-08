<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Mi Perfil de Empresa</h1>

    <form @submit.prevent="guardar" class="bg-white rounded shadow p-6 space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Nombre Empresa</label>
          <input v-model="form.nombreEmpresa" type="text" class="w-full border rounded px-3 py-2" required>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">RUT Empresa</label>
          <input v-model="form.rutEmpresa" type="text" class="w-full border rounded px-3 py-2" placeholder="XX.XXX.XXX-X">
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium mb-1">Descripción</label>
          <textarea v-model="form.descripcion" class="w-full border rounded px-3 py-2 h-24" placeholder="Descripción de tu empresa y servicios"></textarea>
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium mb-1">Servicios Principales</label>
          <textarea v-model="form.servicios" class="w-full border rounded px-3 py-2 h-20" placeholder="Lista de servicios separados por comas"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Años de Experiencia</label>
          <input v-model.number="form.experienciaAnos" type="number" class="w-full border rounded px-3 py-2">
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Regiones de Operación</label>
          <input v-model="form.regiones" type="text" class="w-full border rounded px-3 py-2" placeholder="e.g., Metropolitana, Valparaíso">
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Tipos de Licitación</label>
          <input v-model="form.tiposLicitacion" type="text" class="w-full border rounded px-3 py-2" placeholder="e.g., L1, LE, LP">
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Presupuesto Mínimo (CLP)</label>
          <input v-model.number="form.presupuestoMinimo" type="number" class="w-full border rounded px-3 py-2">
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Presupuesto Máximo (CLP)</label>
          <input v-model.number="form.presupuestoMaximo" type="number" class="w-full border rounded px-3 py-2">
        </div>
      </div>

      <div v-if="error" class="bg-red-100 text-red-700 p-3 rounded">{{ error }}</div>
      <div v-if="exito" class="bg-green-100 text-green-700 p-3 rounded">Perfil guardado exitosamente</div>

      <button type="submit" :disabled="perfilStore.loading" 
              class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50">
        {{ perfilStore.loading ? 'Guardando...' : 'Guardar Perfil' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePerfilStore } from '../stores/perfilStore'
import { useAuthStore } from '../stores/authStore'

const perfilStore = usePerfilStore()
const authStore = useAuthStore()

const error = ref('')
const exito = ref(false)

const form = ref({
  nombreEmpresa: '',
  rutEmpresa: '',
  descripcion: '',
  servicios: '',
  experienciaAnos: null,
  regiones: '',
  tiposLicitacion: '',
  presupuestoMinimo: null,
  presupuestoMaximo: null
})

const guardar = async () => {
  try {
    error.value = ''
    exito.value = false
    
    await perfilStore.guardarPerfil(authStore.usuarioId, {
      nombreEmpresa: form.value.nombreEmpresa,
      rutEmpresa: form.value.rutEmpresa,
      descripcion: form.value.descripcion,
      servicios: form.value.servicios,
      experienciaAnos: form.value.experienciaAnos,
      regiones: form.value.regiones,
      tiposLicitacion: form.value.tiposLicitacion,
      presupuestoMinimo: form.value.presupuestoMinimo,
      presupuestoMaximo: form.value.presupuestoMaximo
    })
    
    exito.value = true
    setTimeout(() => { exito.value = false }, 3000)
  } catch (err) {
    error.value = perfilStore.error
  }
}

onMounted(async () => {
  await perfilStore.obtenerPerfil(authStore.usuarioId)
  if (perfilStore.perfil) {
    form.value = {
      nombreEmpresa: perfilStore.perfil.nombre_empresa || '',
      rutEmpresa: perfilStore.perfil.rut_empresa || '',
      descripcion: perfilStore.perfil.descripcion || '',
      servicios: perfilStore.perfil.servicios || '',
      experienciaAnos: perfilStore.perfil.experiencia_anos || null,
      regiones: perfilStore.perfil.regiones || '',
      tiposLicitacion: perfilStore.perfil.tipos_licitacion || '',
      presupuestoMinimo: perfilStore.perfil.presupuesto_minimo || null,
      presupuestoMaximo: perfilStore.perfil.presupuesto_maximo || null
    }
  }
})
</script>
