<template>
  <div class="space-y-6">
    <!-- Barra Superior Multi-Perfil: Selector de Empresas y Botón "+ Agregar Otra Empresa" -->
    <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
            Gestión Multi-Empresa & Multi-Rubro
          </span>
          <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Perfiles de Empresa ({{ listaPerfiles.length }})
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Administra múltiples empresas o unidades de negocio de distintos rubros. El perfil activo alimenta el Dashboard, los filtros de 1-Clic y el cálculo de Match IA.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            @click="iniciarNuevoPerfil"
            class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <span>➕</span> Agregar Otra Empresa / Rubro
          </button>
        </div>
      </div>

      <!-- Tarjetas / Pestañas de Perfiles de Empresa -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          v-for="emp in listaPerfiles"
          :key="emp.id"
          @click="seleccionarPerfilExistente(emp)"
          :class="[
            !modoCrearNuevo && form.id === emp.id
              ? 'ring-2 ring-blue-600 bg-blue-50/50 border-blue-400'
              : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
          ]"
          class="p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between relative"
        >
          <div>
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-xs font-extrabold text-slate-900 truncate">
                🏢 {{ emp.nombreEmpresa }}
              </span>
              <span
                v-if="emp.esActivo"
                class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0"
              >
                Activo
              </span>
            </div>
            <p class="text-[11px] text-slate-500 truncate">
              {{ emp.servicios || 'Sin palabras clave aún' }}
            </p>
          </div>

          <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/70 text-[11px]">
            <span class="text-slate-400 font-mono">{{ emp.rutEmpresa || 'Sin RUT' }}</span>
            <div class="flex items-center gap-2">
              <button
                v-if="!emp.esActivo"
                type="button"
                @click.stop="activarComoPredeterminado(emp)"
                class="text-blue-600 hover:underline font-bold"
              >
                Usar este perfil
              </button>
              <button
                v-if="listaPerfiles.length > 1"
                type="button"
                @click.stop="confirmarEliminarPerfil(emp)"
                class="text-rose-600 hover:underline font-semibold"
                title="Eliminar este perfil"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>

        <!-- Tarjeta de "Creando Nueva Empresa" cuando está en modo creación -->
        <div
          v-if="modoCrearNuevo"
          class="p-3.5 rounded-xl border-2 border-dashed border-emerald-500 bg-emerald-50/50 flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold text-emerald-900">
                ✨ Nueva Empresa en Creación
              </span>
              <button
                type="button"
                @click="cancelarNuevoPerfil"
                class="text-xs text-slate-500 hover:text-rose-600 font-bold"
              >
                ✕
              </button>
            </div>
            <p class="text-[11px] text-emerald-700 mt-1">
              Completa los datos abajo y presiona "Crear y Activar Nueva Empresa".
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Layout Principal: Formulario Izquierda (2/3) + Simulador en Vivo Derecha (1/3) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- FORMULARIO ESTRATÉGICO -->
      <form @submit.prevent="guardar" class="lg:col-span-2 space-y-6">
        <!-- 1. Identificación y Elegibilidad en ChileCompra -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 class="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span>🏢</span>
              {{ modoCrearNuevo ? '1. Datos de la Nueva Empresa' : `1. Editando: ${form.nombreEmpresa || 'Empresa'}` }}
            </h2>

            <span class="text-xs font-bold" :class="porcentajeCompletitud >= 80 ? 'text-emerald-600' : 'text-blue-600'">
              Fuerza del Perfil: {{ porcentajeCompletitud }}%
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Nombre Empresa o Línea de Negocio *</label>
              <input
                v-model="form.nombreEmpresa"
                type="text"
                class="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej: Constructora Sur SpA / División Aseo"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">RUT Empresa</label>
              <input
                v-model="form.rutEmpresa"
                type="text"
                class="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="76.XXX.XXX-X"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Estado en ChileProveedores</label>
              <select
                v-model="form.habilitadoChileProveedores"
                class="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="si">✅ Habilitado y al día</option>
                <option value="tramite">⏳ En trámite / Renovación</option>
                <option value="no">⚪ Sin inscripción vigente</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Años de Experiencia Rubro</label>
              <input
                v-model.number="form.experienciaAnos"
                type="number"
                min="0"
                class="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej: 5"
              />
            </div>
          </div>
        </div>

        <!-- 2. Catálogo Oficial de Rubros ONU + Palabras Clave Positivas y Negativas -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
          <div>
            <h2 class="text-sm font-extrabold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
              <span>🎯</span> 2. Rubros ChileCompra y Palabras Clave de este Perfil
            </h2>
            <p class="text-xs text-slate-500 mt-2">
              Haz clic en los macro-rubros de esta empresa para inyectar palabras clave de alta conversión:
            </p>
          </div>

          <!-- Selector de Macro-Rubros -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            <button
              v-for="rubro in catalogoRubros"
              :key="rubro.id"
              type="button"
              @click="toggleRubro(rubro)"
              :class="rubrosSeleccionados.includes(rubro.id)
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300'"
              class="px-3 py-2 rounded-xl border text-xs font-bold text-left transition flex items-center justify-between"
            >
              <span class="truncate">{{ rubro.icono }} {{ rubro.nombre }}</span>
              <span v-if="rubrosSeleccionados.includes(rubro.id)" class="text-[10px] ml-1">✓</span>
            </button>
          </div>

          <!-- Gestor de Etiquetas (Chips) de Servicios / Keywords Positivas -->
          <div class="bg-blue-50/40 border border-blue-200/80 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-extrabold uppercase text-blue-900">
                ✅ Palabras Clave de Servicios ({{ listaServicios.length }})
              </label>
              <button
                v-if="listaServicios.length > 0"
                type="button"
                @click="limpiarTodasKeywords"
                class="text-[11px] font-semibold text-rose-600 hover:underline"
              >
                Vaciar etiquetas
              </button>
            </div>

            <div v-if="listaServicios.length > 0" class="flex flex-wrap gap-1.5">
              <span
                v-for="(kw, i) in listaServicios"
                :key="i"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-sm"
              >
                {{ kw }}
                <button type="button" @click="quitarServicio(kw)" class="hover:text-rose-200 font-black">×</button>
              </span>
            </div>
            <p v-else class="text-xs text-slate-500 italic">
              No has agregado palabras clave aún. Selecciona un rubro arriba o escribe abajo.
            </p>

            <div class="flex gap-2">
              <input
                v-model="nuevoServicioInput"
                @keydown.enter.prevent="agregarServicioManual"
                type="text"
                placeholder="Escribe un producto o servicio y presiona Enter..."
                class="flex-1 border border-slate-300 rounded-xl px-3.5 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                @click="agregarServicioManual"
                class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shrink-0"
              >
                + Agregar
              </button>
            </div>
          </div>

          <!-- Gestor de Palabras Clave Negativas (Exclusiones) -->
          <div class="bg-rose-50/40 border border-rose-200/80 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-extrabold uppercase text-rose-900">
                🚫 Palabras Clave Excluidas ({{ listaExcluidas.length }})
              </label>
            </div>

            <div v-if="listaExcluidas.length > 0" class="flex flex-wrap gap-1.5">
              <span
                v-for="(ex, i) in listaExcluidas"
                :key="i"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-sm"
              >
                {{ ex }}
                <button type="button" @click="quitarExcluida(ex)" class="hover:text-amber-200 font-black">×</button>
              </span>
            </div>
            <p v-else class="text-xs text-slate-500 italic">
              Opcional: Términos que descartarán licitaciones automáticamente para esta empresa.
            </p>

            <div class="flex gap-2">
              <input
                v-model="nuevaExcluidaInput"
                @keydown.enter.prevent="agregarExcluidaManual"
                type="text"
                placeholder="Ej: impresoras, tóner, arriendo vehiculos..."
                class="flex-1 border border-slate-300 rounded-xl px-3.5 py-2 text-xs bg-white focus:ring-2 focus:ring-rose-500 outline-none"
              />
              <button
                type="button"
                @click="agregarExcluidaManual"
                class="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shrink-0"
              >
                + Excluir
              </button>
            </div>
          </div>

          <!-- Descripción técnica detallada para la IA -->
          <div>
            <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
              Resumen de Capacidades Técnicas y Certificaciones (Contexto para Copiloto IA)
            </label>
            <textarea
              v-model="form.descripcion"
              class="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm h-24 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Describe qué vende o ejecuta esta empresa, equipamiento, metodologías o certificaciones..."
            ></textarea>
          </div>
        </div>

        <!-- 3. Cobertura Geográfica Interactiva -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <h2 class="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span>📍</span> 3. Cobertura Territorial y Regiones Operativas
            </h2>

            <label class="inline-flex items-center gap-2 text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 cursor-pointer">
              <input
                type="checkbox"
                v-model="form.coberturaNacional"
                class="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>🇨🇱 Atiendo Licitaciones de Todo Chile</span>
            </label>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="reg in todasLasRegiones"
              :key="reg"
              type="button"
              @click="toggleRegion(reg)"
              :class="regionesSeleccionadas.includes(reg)
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'"
              class="px-3 py-1.5 rounded-xl border text-xs font-semibold transition"
            >
              {{ reg }}
            </button>
          </div>
        </div>

        <!-- 4. Capacidad Financiera, Garantías y Tramos UTM -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <h2 class="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span>💰</span> 4. Capacidad Financiera, Garantías y Tramos Objetivo
            </h2>

            <label class="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 cursor-pointer">
              <input
                type="checkbox"
                v-model="form.interesCompraAgil"
                class="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>⚡ Priorizar Compras Ágiles (&lt; 30 / 100 UTM)</span>
            </label>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase text-slate-600 mb-2">
              Tramos Oficiales de Licitación que te interesan
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                v-for="t in catalogoTipos"
                :key="t.codigo"
                type="button"
                @click="toggleTipo(t.codigo)"
                :class="tiposSeleccionados.includes(t.codigo)
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'"
                class="p-2.5 rounded-xl border text-left transition"
              >
                <span class="text-xs font-extrabold block">{{ t.codigo }} · {{ t.titulo }}</span>
                <span class="text-[10px] opacity-80 block">{{ t.rango }}</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Presupuesto Mínimo (CLP)</label>
              <input
                v-model.number="form.presupuestoMinimo"
                type="number"
                step="500000"
                class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej: 500000"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Presupuesto Máximo (CLP)</label>
              <input
                v-model.number="form.presupuestoMaximo"
                type="number"
                step="5000000"
                class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej: 200000000"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Tope Boleta Garantía (CLP)</label>
              <input
                v-model.number="form.capacidadGarantia"
                type="number"
                step="1000000"
                class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej: 10000000"
              />
            </div>
          </div>
        </div>

        <!-- Mensajes y Botones Guardar -->
        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs font-semibold">
          {{ error }}
        </div>
        <div v-if="exito" class="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold">
          {{ mensajeExito }}
        </div>

        <div class="flex flex-wrap items-center justify-end gap-3">
          <button
            v-if="modoCrearNuevo"
            type="button"
            @click="cancelarNuevoPerfil"
            class="px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            @click="ejecutarSimulacion"
            :disabled="simulando"
            class="px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition"
          >
            {{ simulando ? '⏳ Calculando impacto...' : '🔄 Probar Impacto en Vivo' }}
          </button>

          <button
            type="submit"
            :disabled="perfilStore.loading"
            :class="modoCrearNuevo ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'"
            class="disabled:opacity-50 text-white font-extrabold text-sm px-8 py-3 rounded-xl shadow-md transition"
          >
            {{ perfilStore.loading
              ? 'Guardando...'
              : (modoCrearNuevo ? '✨ Crear y Activar Nueva Empresa' : '💾 Guardar Cambios del Perfil') }}
          </button>
        </div>
      </form>

      <!-- PANEL LATERAL DERECHO: SIMULADOR DE IMPACTO EN VIVO -->
      <aside class="lg:sticky lg:top-20 space-y-4">
        <div class="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-slate-800">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Simulador en Vivo
            </span>
            <button
              @click="ejecutarSimulacion"
              :disabled="simulando"
              class="text-xs text-blue-300 hover:text-white underline"
            >
              {{ simulando ? 'Calculando...' : '↻ Recalcular' }}
            </button>
          </div>

          <h3 class="text-base font-extrabold">
            Impacto para: {{ form.nombreEmpresa || 'Nueva Empresa' }}
          </h3>
          <p class="text-xs text-slate-300 mt-0.5">
            Resultados reales cruzando este perfil contra las licitaciones activas en ChileCompra hoy:
          </p>

          <div class="grid grid-cols-2 gap-3 my-4">
            <div class="bg-white/10 rounded-xl p-3.5 border border-white/10">
              <span class="text-[11px] text-slate-300 block">Total Recomendadas</span>
              <span class="text-2xl font-black text-amber-300">
                {{ simulacion.TotalCoincidencias || 0 }}
              </span>
              <span class="text-[10px] text-slate-400 block">Calzan con este rubro</span>
            </div>

            <div class="bg-white/10 rounded-xl p-3.5 border border-white/10">
              <span class="text-[11px] text-slate-300 block">Compras Ágiles / L1</span>
              <span class="text-2xl font-black text-emerald-300">
                {{ simulacion.TotalComprasAgilesMatch || 0 }}
              </span>
              <span class="text-[10px] text-slate-400 block">Tramo &lt; 100 UTM</span>
            </div>
          </div>

          <!-- Top 4 Muestra de Licitaciones que hacen Match ahora mismo -->
          <div class="space-y-2.5 mt-4 pt-4 border-t border-white/10">
            <span class="text-xs font-bold text-slate-200 block">
              Vista previa de mejores coincidencias:
            </span>

            <div v-if="simulando" class="py-6 text-center text-xs text-slate-300">
              Analizando base de licitaciones activas...
            </div>

            <template v-else-if="simulacion.Listado && simulacion.Listado.length > 0">
              <div
                v-for="lic in simulacion.Listado.slice(0, 4)"
                :key="lic.CodigoExterno"
                @click="verLicitacion(lic)"
                class="p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 cursor-pointer transition"
              >
                <div class="flex items-center justify-between text-[11px] mb-1">
                  <span class="font-mono font-bold text-blue-300">{{ lic.CodigoExterno }} ({{ lic.Tipo }})</span>
                  <span class="font-extrabold text-emerald-300">{{ lic.scoreRecomendacion }}% Match</span>
                </div>
                <p class="text-xs font-semibold text-white line-clamp-2">{{ lic.Nombre }}</p>
                <div class="flex flex-wrap gap-1 mt-1.5">
                  <span
                    v-for="(m, idx) in (lic.motivosRecomendacion || []).slice(0, 2)"
                    :key="idx"
                    class="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-200"
                  >
                    {{ m }}
                  </span>
                </div>
              </div>
            </template>

            <p v-else class="text-xs text-slate-400 italic py-4">
              Agrega más palabras clave o selecciona un rubro para ver licitaciones coincidentes en tiempo real.
            </p>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { usePerfilStore } from '../stores/perfilStore'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const route = useRoute()
const perfilStore = usePerfilStore()
const authStore = useAuthStore()

const error = ref('')
const exito = ref(false)
const mensajeExito = ref('✓ Perfil guardado y calibrado exitosamente.')
const simulando = ref(false)
const modoCrearNuevo = ref(false)
const nuevoServicioInput = ref('')
const nuevaExcluidaInput = ref('')
const perfilesLocales = ref([])

const recargarListaPerfiles = async () => {
  try {
    const uid = authStore.usuarioId || JSON.parse(localStorage.getItem('usuario') || '{}')?.id || 1
    const res = await axios.get(`/api/perfil/lista/${uid}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    if (Array.isArray(res.data)) {
      perfilesLocales.value = res.data
      if ('perfiles' in perfilStore) {
        perfilStore.perfiles = res.data
      }
    }
  } catch (e) {
    console.error('Error cargando lista de perfiles:', e)
  }
}

const listaPerfiles = computed(() => {
  if (perfilesLocales.value.length > 0) {
    return perfilesLocales.value
  }
  if (Array.isArray(perfilStore.perfiles) && perfilStore.perfiles.length > 0) {
    return perfilStore.perfiles
  }
  return perfilStore.perfil ? [perfilStore.perfil] : []
})

const simulacion = ref({
  TotalCoincidencias: 0,
  TotalComprasAgilesMatch: 0,
  Listado: []
})

const catalogoRubros = [
  { id: 'ti', icono: '💻', nombre: 'TI, Software y Datos', sugerencias: ['software', 'desarrollo', 'sistema', 'licencias', 'soporte informático', 'datos', 'nube', 'servidores'] },
  { id: 'computacion', icono: '🖥️', nombre: 'Hardware y Equipamiento', sugerencias: ['computadores', 'notebooks', 'impresoras', 'monitores', 'redes', 'equipamiento tecnológico'] },
  { id: 'obras', icono: '🏗️', nombre: 'Obras, Construcción y Mantención', sugerencias: ['mantención', 'reparación', 'construcción', 'mejoramiento', 'obras menores', 'pintura', 'eléctrica', 'climatización'] },
  { id: 'aseo', icono: '🧹', nombre: 'Aseo, Limpieza y Jardinería', sugerencias: ['servicio de aseo', 'limpieza', 'áreas verdes', 'higienización', 'control de plagas', 'insumos de aseo'] },
  { id: 'salud', icono: '🏥', nombre: 'Salud, Médico y Laboratorio', sugerencias: ['insumos médicos', 'instrumental', 'laboratorio', 'clínico', 'hospital', 'quirúrgico', 'reactivos'] },
  { id: 'consultoria', icono: '📊', nombre: 'Consultoría, Estudios y Capacitación', sugerencias: ['consultoría', 'asesoría', 'capacitación', 'estudio', 'auditoría', 'diseño', 'diagnóstico'] },
  { id: 'logistica', icono: '🚚', nombre: 'Transporte, Vehículos y Logística', sugerencias: ['transporte', 'traslado', 'flete', 'arriendo de vehículos', 'combustible', 'neumáticos', 'mantención vehículos'] },
  { id: 'mobiliario', icono: '🪑', nombre: 'Mobiliario, Oficina y Escolar', sugerencias: ['mobiliario', 'escritorios', 'sillas', 'artículos de oficina', 'escolar', 'vestuario'] },
  { id: 'eventos', icono: '🎤', nombre: 'Eventos, Alimentación y Difusión', sugerencias: ['producción de eventos', 'catering', 'coffee break', 'alimentación', 'difusión', 'imprenta'] }
]

const catalogoTipos = [
  { codigo: 'L1', titulo: 'Pública Menor', rango: '< 100 UTM (~$6,6M)' },
  { codigo: 'LE', titulo: 'Pública Entre 100-1000', rango: '$6,6M a $66,6M' },
  { codigo: 'LP', titulo: 'Pública 1000-2000', rango: '$66,6M a $133M' },
  { codigo: 'LQ', titulo: 'Pública 2000-5000', rango: '$133M a $333M' },
  { codigo: 'LR', titulo: 'Gran Compra Pública', rango: '> 5.000 UTM (> $333M)' },
  { codigo: 'LS', titulo: 'Servicios Especializados', rango: 'Cualquier monto' }
]

const todasLasRegiones = [
  'Arica', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso',
  'Metropolitana', "O'Higgins", 'Maule', 'Ñuble', 'Biobío', 'Araucanía',
  'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
]

const crearFormularioVacio = () => ({
  id: null,
  nombreEmpresa: '',
  rutEmpresa: '',
  descripcion: '',
  servicios: '',
  experienciaAnos: null,
  regiones: '',
  tiposLicitacion: 'L1, LE, LP',
  presupuestoMinimo: null,
  presupuestoMaximo: null,
  rubrosPrincipales: '',
  palabrasExcluidas: '',
  coberturaNacional: true,
  habilitadoChileProveedores: 'si',
  capacidadGarantia: null,
  interesCompraAgil: true,
  certificaciones: ''
})

const form = ref(crearFormularioVacio())

const cargarDatosEnFormulario = (p) => {
  if (!p) return
  modoCrearNuevo.value = false
  form.value = {
    id: p.id || null,
    nombreEmpresa: p.nombreEmpresa || p.nombre_empresa || '',
    rutEmpresa: p.rutEmpresa || p.rut_empresa || '',
    descripcion: p.descripcion || '',
    servicios: p.servicios || '',
    experienciaAnos: p.experienciaAnos ?? p.experiencia_anos ?? null,
    regiones: p.regiones || '',
    tiposLicitacion: p.tiposLicitacion || p.tipos_licitacion || 'L1, LE, LP',
    presupuestoMinimo: p.presupuestoMinimo ? Number(p.presupuestoMinimo) : (p.presupuesto_minimo ? Number(p.presupuesto_minimo) : null),
    presupuestoMaximo: p.presupuestoMaximo ? Number(p.presupuestoMaximo) : (p.presupuesto_maximo ? Number(p.presupuesto_maximo) : null),
    rubrosPrincipales: p.rubrosPrincipales || p.rubros_principales || '',
    palabrasExcluidas: p.palabrasExcluidas || p.palabras_excluidas || '',
    coberturaNacional: p.coberturaNacional !== undefined ? p.coberturaNacional : true,
    habilitadoChileProveedores: p.habilitadoChileProveedores || 'si',
    capacidadGarantia: p.capacidadGarantia ? Number(p.capacidadGarantia) : null,
    interesCompraAgil: p.interesCompraAgil !== undefined ? p.interesCompraAgil : true,
    certificaciones: p.certificaciones || ''
  }
}

const iniciarNuevoPerfil = () => {
  modoCrearNuevo.value = true
  form.value = crearFormularioVacio()
  simulacion.value = { TotalCoincidencias: 0, TotalComprasAgilesMatch: 0, Listado: [] }
}

const cancelarNuevoPerfil = () => {
  modoCrearNuevo.value = false
  if (perfilStore.perfil) {
    cargarDatosEnFormulario(perfilStore.perfil)
    ejecutarSimulacion()
  }
}

const seleccionarPerfilExistente = async (emp) => {
  cargarDatosEnFormulario(emp)
  await activarComoPredeterminado(emp)
  await ejecutarSimulacion()
}

const activarComoPredeterminado = async (emp) => {
  try {
    const res = await axios.put(`/api/perfil/activar/${emp.id}`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    perfilStore.perfil = res.data
    await recargarListaPerfiles()
    window.dispatchEvent(new CustomEvent('perfiles-actualizados'))
    mensajeExito.value = `✓ Perfil "${emp.nombreEmpresa}" activado como principal.`
    exito.value = true
    setTimeout(() => { exito.value = false }, 3000)
  } catch (e) {
    console.error(e)
  }
}

const confirmarEliminarPerfil = async (emp) => {
  const uid = authStore.usuarioId || JSON.parse(localStorage.getItem('usuario') || '{}')?.id || 1
  try {
    const res = await axios.delete(`/api/perfil/item/${emp.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    const nuevo = res.data.nuevoActivo || res.data.perfilActivo
    if (nuevo) {
      perfilStore.perfil = nuevo
      cargarDatosEnFormulario(nuevo)
      await ejecutarSimulacion()
    }
    await recargarListaPerfiles()
    window.dispatchEvent(new CustomEvent('perfiles-actualizados'))
  } catch (e) {
    error.value = e.response?.data?.error || perfilStore.error || 'No se pudo eliminar el perfil'
  }
}

const listaServicios = computed(() => {
  return (form.value.servicios || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
})

const listaExcluidas = computed(() => {
  return (form.value.palabrasExcluidas || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
})

const rubrosSeleccionados = computed(() => {
  return (form.value.rubrosPrincipales || '')
    .split(',')
    .map(r => r.trim())
    .filter(Boolean)
})

const regionesSeleccionadas = computed(() => {
  return (form.value.regiones || '')
    .split(',')
    .map(r => r.trim())
    .filter(Boolean)
})

const tiposSeleccionados = computed(() => {
  return (form.value.tiposLicitacion || '')
    .split(',')
    .map(t => t.trim().toUpperCase())
    .filter(Boolean)
})

const porcentajeCompletitud = computed(() => {
  let pts = 0
  if (form.value.nombreEmpresa) pts += 15
  if (form.value.rutEmpresa) pts += 10
  if (listaServicios.value.length >= 2) pts += 25
  else if (listaServicios.value.length === 1) pts += 15
  if (form.value.descripcion && form.value.descripcion.length > 20) pts += 20
  if (tiposSeleccionados.value.length > 0) pts += 15
  if (form.value.presupuestoMaximo || form.value.capacidadGarantia) pts += 15
  return Math.min(100, pts)
})

const toggleRubro = (rubro) => {
  const actuales = new Set(rubrosSeleccionados.value)
  const serviciosSet = new Set(listaServicios.value.map(s => s.toLowerCase()))

  if (actuales.has(rubro.id)) {
    actuales.delete(rubro.id)
  } else {
    actuales.add(rubro.id)
    rubro.sugerencias.forEach(sug => serviciosSet.add(sug))
  }
  form.value.rubrosPrincipales = Array.from(actuales).join(', ')
  form.value.servicios = Array.from(serviciosSet).join(', ')
  ejecutarSimulacion()
}

const limpiarTodasKeywords = () => {
  form.value.servicios = ''
  form.value.rubrosPrincipales = ''
  ejecutarSimulacion()
}

const agregarServicioManual = () => {
  const val = nuevoServicioInput.value.trim().toLowerCase()
  if (!val) return
  const partes = val.split(',').map(p => p.trim()).filter(Boolean)
  const actuales = new Set(listaServicios.value.map(s => s.toLowerCase()))
  partes.forEach(p => actuales.add(p))
  form.value.servicios = Array.from(actuales).join(', ')
  nuevoServicioInput.value = ''
  ejecutarSimulacion()
}

const quitarServicio = (kw) => {
  form.value.servicios = listaServicios.value.filter(s => s !== kw).join(', ')
  ejecutarSimulacion()
}

const agregarExcluidaManual = () => {
  const val = nuevaExcluidaInput.value.trim().toLowerCase()
  if (!val) return
  const partes = val.split(',').map(p => p.trim()).filter(Boolean)
  const actuales = new Set(listaExcluidas.value.map(s => s.toLowerCase()))
  partes.forEach(p => actuales.add(p))
  form.value.palabrasExcluidas = Array.from(actuales).join(', ')
  nuevaExcluidaInput.value = ''
  ejecutarSimulacion()
}

const quitarExcluida = (ex) => {
  form.value.palabrasExcluidas = listaExcluidas.value.filter(s => s !== ex).join(', ')
  ejecutarSimulacion()
}

const toggleRegion = (reg) => {
  const actuales = new Set(regionesSeleccionadas.value)
  if (actuales.has(reg)) actuales.delete(reg)
  else actuales.add(reg)
  form.value.regiones = Array.from(actuales).join(', ')
  ejecutarSimulacion()
}

const toggleTipo = (codigo) => {
  const actuales = new Set(tiposSeleccionados.value)
  if (actuales.has(codigo)) actuales.delete(codigo)
  else actuales.add(codigo)
  form.value.tiposLicitacion = Array.from(actuales).join(', ')
  ejecutarSimulacion()
}

const ejecutarSimulacion = async () => {
  simulando.value = true
  try {
    const response = await axios.post('/api/licitaciones/simular-perfil', { ...form.value }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    simulacion.value = response.data
  } catch (e) {
    console.error('Error en simulación:', e)
  } finally {
    simulando.value = false
  }
}

const verLicitacion = (lic) => {
  router.push({
    name: 'DetalleLicitacion',
    params: { codigo: lic.CodigoExterno },
    state: { licitacion: lic }
  })
}

const guardar = async () => {
  try {
    error.value = ''
    exito.value = false

    if (nuevoServicioInput.value.trim()) {
      const partes = nuevoServicioInput.value.trim().toLowerCase().split(',').map(p => p.trim()).filter(Boolean)
      const actuales = new Set(listaServicios.value.map(s => s.toLowerCase()))
      partes.forEach(p => actuales.add(p))
      form.value.servicios = Array.from(actuales).join(', ')
      nuevoServicioInput.value = ''
    }

    if (nuevaExcluidaInput.value.trim()) {
      const partes = nuevaExcluidaInput.value.trim().toLowerCase().split(',').map(p => p.trim()).filter(Boolean)
      const actuales = new Set(listaExcluidas.value.map(s => s.toLowerCase()))
      partes.forEach(p => actuales.add(p))
      form.value.palabrasExcluidas = Array.from(actuales).join(', ')
      nuevaExcluidaInput.value = ''
    }

    if (!authStore.usuarioId) {
      authStore.restoreSession()
    }
    const uid = authStore.usuarioId || JSON.parse(localStorage.getItem('usuario') || '{}')?.id || 1

    const eraNuevo = modoCrearNuevo.value
    const res = await axios.post(`/api/perfil/${uid}`, {
      ...form.value,
      crearNuevo: eraNuevo
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    const guardado = res.data
    perfilStore.perfil = guardado

    await recargarListaPerfiles()
    window.dispatchEvent(new CustomEvent('perfiles-actualizados'))
    cargarDatosEnFormulario(guardado)
    await ejecutarSimulacion()

    mensajeExito.value = eraNuevo
      ? `✨ Nueva empresa "${guardado.nombreEmpresa}" creada y activada.`
      : `✓ Cambios guardados en "${guardado.nombreEmpresa}".`
    exito.value = true
    setTimeout(() => { exito.value = false }, 4000)
  } catch (err) {
    error.value = perfilStore.error || err.message || 'Error guardando el perfil'
  }
}

watch(() => perfilStore.perfil?.id, async (newId) => {
  await recargarListaPerfiles()
  if (newId && !modoCrearNuevo.value && perfilStore.perfil) {
    cargarDatosEnFormulario(perfilStore.perfil)
    ejecutarSimulacion()
  }
})

onMounted(async () => {
  if (!authStore.usuarioId) {
    authStore.restoreSession()
  }
  const uid = authStore.usuarioId || JSON.parse(localStorage.getItem('usuario') || '{}')?.id || 1
  await recargarListaPerfiles()
  await perfilStore.obtenerPerfil(uid)
  if (route.query.nuevo === '1') {
    iniciarNuevoPerfil()
  } else if (perfilStore.perfil) {
    cargarDatosEnFormulario(perfilStore.perfil)
    await ejecutarSimulacion()
  }
})
</script>
