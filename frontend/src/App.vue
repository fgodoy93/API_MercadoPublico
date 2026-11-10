<template>
  <div id="vite-app" class="min-h-screen bg-[#e8eef5] text-slate-900 flex flex-col lg:flex-row">
    <!-- SIDEBAR IZQUIERDO PROFESIONAL (Desktop) -->
    <aside
      v-if="usuario"
      class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-slate-950 text-slate-300 border-r border-slate-800/80 z-30 select-none"
    >
      <!-- 1. Brand / Logo -->
      <div class="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
        <router-link to="/" class="flex items-center gap-3 group">
          <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-white text-sm shadow-sm group-hover:bg-blue-500 transition">
            MP
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-sm font-extrabold text-white tracking-tight">MercadoPúblico</span>
              <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PRO
              </span>
            </div>
            <p class="text-[10px] text-slate-400">Inteligencia Multi-Empresa</p>
          </div>
        </router-link>
      </div>

      <!-- 2. Selector de Empresa Activa (Workspace Switcher) -->
      <div class="p-3.5 border-b border-slate-800/80">
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Empresa Activa
            </span>
            <router-link
              to="/perfil?nuevo=1"
              class="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition"
              title="Agregar otra empresa de otro rubro"
            >
              + Nueva
            </router-link>
          </div>

          <select
            v-if="perfiles.length > 0"
            :value="perfilActivo?.id"
            @change="cambiarEmpresaActiva($event.target.value)"
            aria-label="Seleccionar empresa activa"
            class="w-full bg-slate-950 border border-slate-700/80 hover:border-slate-600 rounded-lg px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition"
          >
            <option
              v-for="emp in perfiles"
              :key="emp.id"
              :value="emp.id"
              class="bg-slate-900 text-white"
            >
              🏢 {{ emp.nombreEmpresa }}
            </option>
          </select>

          <div v-if="perfilActivo" class="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
            <span class="font-mono">{{ perfilActivo.rutEmpresa || 'Sin RUT' }}</span>
            <router-link to="/perfil" class="text-slate-300 hover:text-white underline">
              Calibrar
            </router-link>
          </div>
        </div>
      </div>

      <!-- 3. Navegación Categorizada -->
      <nav class="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <div>
          <p class="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Inteligencia Comercial
          </p>
          <div class="space-y-1">
            <router-link
              to="/"
              exact-active-class="bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 font-bold"
              class="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              <span class="flex items-center gap-2.5">
                <span class="text-sm">🌐</span>
                <span>Todas las Licitaciones</span>
              </span>
            </router-link>

            <router-link
              to="/recomendadas"
              active-class="bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 font-bold"
              class="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              <span class="flex items-center gap-2.5">
                <span class="text-sm">🎯</span>
                <span>Recomendadas por Rubro</span>
              </span>
            </router-link>

            <router-link
              to="/compras-agiles"
              active-class="bg-emerald-500/15 text-emerald-400 border-l-2 border-emerald-500 font-bold"
              class="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              <span class="flex items-center gap-2.5">
                <span class="text-sm">⚡</span>
                <span>Compras Ágiles</span>
              </span>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                &lt;100 UTM
              </span>
            </router-link>
          </div>
        </div>

        <div>
          <p class="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Gestión & Postulación
          </p>
          <div class="space-y-1">
            <router-link
              to="/postulaciones"
              active-class="bg-amber-500/15 text-amber-300 border-l-2 border-amber-400 font-bold"
              class="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              <span class="flex items-center gap-2.5">
                <span class="text-sm">📋</span>
                <span>Pipeline Kanban CRM</span>
              </span>
            </router-link>

            <router-link
              to="/perfil"
              active-class="bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 font-bold"
              class="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              <span class="flex items-center gap-2.5">
                <span class="text-sm">🏢</span>
                <span>Perfiles de Empresa</span>
              </span>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {{ perfiles.length }}
              </span>
            </router-link>
          </div>
        </div>

        <!-- Tarjeta de Referencia Normativa UTM -->
        <div class="px-2 pt-2">
          <div class="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3 text-[11px] space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-slate-400 font-semibold">Estado API MP</span>
              <span class="text-emerald-400 font-bold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Valor UTM Ref.</span>
              <span class="font-mono font-bold text-slate-200 tabular-nums">$66.600 CLP</span>
            </div>
          </div>
        </div>
      </nav>

      <!-- 4. Pie de Sidebar: Usuario Conectado -->
      <div class="p-3.5 border-t border-slate-800/80 bg-slate-950">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-xs font-bold text-white truncate">{{ usuario.nombre }}</p>
            <p class="text-[11px] text-slate-400 truncate">{{ usuario.email }}</p>
          </div>
          <button
            @click="logout"
            class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition shrink-0"
            title="Cerrar sesión"
          >
            Salir
          </button>
        </div>
      </div>
    </aside>

    <!-- CONTENEDOR PRINCIPAL DERECHO -->
    <div :class="usuario ? 'lg:pl-64 flex-1 flex flex-col min-w-0' : 'w-full'">
      <!-- Barra Superior Contextual (Sticky Header) -->
      <header
        v-if="usuario"
        class="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4"
      >
        <!-- Título de Sección Actual -->
        <div class="min-w-0">
          <h2 class="text-sm sm:text-base font-extrabold text-slate-900 truncate">
            {{ tituloSeccionActual }}
          </h2>
          <p class="text-[11px] text-slate-500 hidden sm:block truncate">
            Empresa activa: <strong class="text-slate-800">{{ perfilActivo?.nombreEmpresa || 'Cargando...' }}</strong>
            <span v-if="perfilActivo?.rutEmpresa" class="font-mono text-slate-400 ml-1">({{ perfilActivo.rutEmpresa }})</span>
          </p>
        </div>

        <!-- Buscador Rápido por Código + Selector Móvil -->
        <div class="flex items-center gap-2.5">
          <form @submit.prevent="irACodigoRapido" class="hidden md:flex items-center relative">
            <input
              v-model="codigoRapidoInput"
              type="text"
              placeholder="Ir a código licitación (ej: 1867-54-LE26)..."
              class="w-64 lg:w-72 border border-slate-300/90 rounded-xl pl-3 pr-16 py-1.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            <button
              type="submit"
              class="absolute right-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-[11px] font-bold transition"
            >
              Abrir
            </button>
          </form>

          <!-- Selector Rápido de Empresa en Móvil / Tablet -->
          <div v-if="perfiles.length > 0" class="flex lg:hidden items-center gap-1 bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-1.5">
            <span class="text-xs">🏢</span>
            <select
              :value="perfilActivo?.id"
              @change="cambiarEmpresaActiva($event.target.value)"
              aria-label="Cambiar empresa activa"
              class="bg-transparent text-xs font-bold text-slate-800 focus:outline-none max-w-[130px] truncate"
            >
              <option v-for="emp in perfiles" :key="emp.id" :value="emp.id">
                {{ emp.nombreEmpresa }}
              </option>
            </select>
          </div>

          <router-link
            to="/postulaciones"
            class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
          >
            <span>📋</span> Pipeline
          </router-link>
        </div>
      </header>

      <!-- Navegación Inferior / Superior Compacta para Móvil -->
      <div
        v-if="usuario"
        class="lg:hidden flex items-center justify-around bg-slate-900 text-slate-300 px-2 py-2 border-b border-slate-800 text-xs overflow-x-auto"
      >
        <router-link to="/" exact-active-class="text-blue-400 font-bold" class="px-2 py-1 whitespace-nowrap">🌐 Todas</router-link>
        <router-link to="/recomendadas" active-class="text-blue-400 font-bold" class="px-2 py-1 whitespace-nowrap">🎯 Recomendadas</router-link>
        <router-link to="/compras-agiles" active-class="text-emerald-400 font-bold" class="px-2 py-1 whitespace-nowrap">⚡ Ágiles</router-link>
        <router-link to="/postulaciones" active-class="text-amber-400 font-bold" class="px-2 py-1 whitespace-nowrap">📋 Pipeline</router-link>
        <router-link to="/perfil" active-class="text-blue-400 font-bold" class="px-2 py-1 whitespace-nowrap">🏢 Empresas</router-link>
      </div>

      <!-- Área de Contenido Principal -->
      <main :class="usuario ? 'max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1' : 'w-full'">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/authStore'
import { usePerfilStore } from './stores/perfilStore'
import { useRouter, useRoute } from 'vue-router'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import axios from 'axios'

const authStore = useAuthStore()
const perfilStore = usePerfilStore()
const router = useRouter()
const route = useRoute()

const perfilesHeader = ref([])
const codigoRapidoInput = ref('')

const tituloSeccionActual = computed(() => {
  const map = {
    Dashboard: 'Radar de Oportunidades y Recomendaciones',
    Licitaciones: 'Buscador Nacional de Licitaciones Activas',
    ComprasAgiles: 'Compras Ágiles y Contrataciones Menores (< 100 UTM)',
    Postulaciones: 'Pipeline Kanban CRM y Control de Cronogramas',
    PerfilEmpresa: 'Configuración y Calibración Multi-Empresa',
    DetalleLicitacion: `Ficha Técnica de Licitación ${route.params.codigo || ''}`
  }
  return map[route.name] || 'Plataforma de Inteligencia ChileCompra'
})

const irACodigoRapido = () => {
  const val = codigoRapidoInput.value.trim()
  if (!val) return
  codigoRapidoInput.value = ''
  router.push({ name: 'DetalleLicitacion', params: { codigo: val } })
}

const cargarListaHeader = async () => {
  try {
    const uid = authStore.usuario?.id || 1
    const res = await axios.get(`/api/perfil/lista/${uid}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    if (Array.isArray(res.data)) {
      perfilesHeader.value = res.data
    }
  } catch (e) {
    console.error('Error cargando lista de empresas en header:', e)
  }
}

const usuario = computed(() => authStore.usuario)
const perfiles = computed(() => {
  if (perfilesHeader.value.length > 0) return perfilesHeader.value
  return perfilStore.perfiles || (perfilStore.perfil ? [perfilStore.perfil] : [])
})
const perfilActivo = computed(() => perfilStore.perfil)

const cambiarEmpresaActiva = async (id) => {
  if (!id) return
  const res = await axios.put(`/api/perfil/activar/${Number(id)}`, {}, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  })
  perfilStore.perfil = res.data
  await cargarListaHeader()
  window.dispatchEvent(new CustomEvent('perfiles-actualizados'))
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}

watch(usuario, async (val) => {
  if (val) {
    await perfilStore.obtenerPerfil(val.id)
    await cargarListaHeader()
  }
})

onMounted(async () => {
  window.addEventListener('perfiles-actualizados', cargarListaHeader)
  authStore.restoreSession()
  if (!usuario.value) {
    router.push('/login')
  } else {
    await perfilStore.obtenerPerfil(usuario.value.id)
    await cargarListaHeader()
  }
})

onUnmounted(() => {
  window.removeEventListener('perfiles-actualizados', cargarListaHeader)
})
</script>
