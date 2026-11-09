<template>
  <div class="space-y-5">
    <!-- Banner Superior Compacto de Compras Ágiles -->
    <div class="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl px-6 py-4 shadow-md border border-emerald-700/40">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
              ⚡ Contratación Rápida y Simplificada
            </span>
            <span class="text-xs text-emerald-200/80">
              Tramo PYME: Hasta 30 UTM (~$2,0M) y Menores a 100 UTM (~$6,66M)
            </span>
          </div>
          <h1 class="text-xl sm:text-2xl font-extrabold mt-1">
            Compras Ágiles y Licitaciones Rápidas Publicadas
          </h1>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            @click="mostrarSidebarMovil = !mostrarSidebarMovil"
            class="lg:hidden bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-white/20 flex items-center gap-1.5"
          >
            <span>🎛️</span> {{ mostrarSidebarMovil ? 'Ocultar Filtros' : 'Mostrar Filtros' }}
          </button>

          <div class="bg-white/10 backdrop-blur border border-white/15 rounded-xl px-4 py-2 text-right">
            <span class="text-[11px] text-emerald-200 block leading-none">Disponibles hoy</span>
            <span class="text-xl font-black text-emerald-300">
              {{ licitacionesStore.totalComprasAgiles.toLocaleString('es-CL') }}
            </span>
          </div>

          <button
            @click="enriquecerPagina"
            :disabled="cargandoLote || licitacionesStore.comprasAgiles.length === 0"
            class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2"
          >
            <span>{{ cargandoLote ? '⏳ Extrayendo montos...' : '⚡ Revelar Montos Exactos' }}</span>
          </button>

          <a
            href="https://buscador.mercadopublico.cl/compra-agil"
            target="_blank"
            rel="noopener"
            class="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold px-3.5 py-2.5 rounded-xl transition"
          >
            🌐 Portal Oficial ↗
          </a>
        </div>
      </div>
    </div>

    <!-- Layout Principal: Sidebar Izquierda (Filtros) + Contenido Central (Compras Ágiles) -->
    <div class="flex flex-col lg:flex-row items-start gap-6">
      <!-- SIDEBAR DE FILTROS -->
      <aside
        :class="mostrarSidebarMovil ? 'block' : 'hidden lg:block'"
        class="w-full lg:w-80 xl:w-88 shrink-0 lg:sticky lg:top-20 bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto"
      >
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 class="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <span>⚡</span> Filtros Compra Ágil
          </h2>
          <button
            @click="limpiar"
            class="text-xs font-semibold text-emerald-600 hover:text-emerald-800 hover:underline"
          >
            Restablecer
          </button>
        </div>

        <!-- Selector Multi-Palabra Clave de Mi Rubro -->
        <div v-if="perfil" class="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-1">
            <div>
              <span class="text-[11px] font-extrabold uppercase text-emerald-900 block">
                🎯 {{ perfil.nombreEmpresa }}
              </span>
              <span class="text-[10px] font-semibold text-emerald-700">
                {{ keywordsSeleccionadas.length > 0 ? `${keywordsSeleccionadas.length} de ${keywordsPerfil.length} seleccionadas` : 'Haz clic en 1 o varias etiquetas' }}
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                @click="filtrarConMiPerfil"
                class="text-[11px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg transition shadow-sm"
              >
                ✓ Todas ({{ keywordsPerfil.length }})
              </button>
              <button
                v-if="keywordsSeleccionadas.length > 0"
                type="button"
                @click="limpiarKeywordsSeleccionadas"
                class="text-[11px] font-bold bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-emerald-200 px-2 py-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>
          </div>
          <div v-if="keywordsPerfil.length > 0" class="flex flex-wrap gap-1 max-h-40 overflow-y-auto pr-1">
            <button
              v-for="(kw, i) in keywordsPerfil"
              :key="i"
              type="button"
              @click="filtrarPorKeywordPerfil(kw)"
              :class="esKeywordSeleccionada(kw)
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100'"
              class="px-2 py-0.5 rounded-md text-[11px] font-semibold border transition flex items-center gap-1"
            >
              <span v-if="esKeywordSeleccionada(kw)" class="text-[10px]">✓</span>
              <span>{{ kw }}</span>
            </button>
          </div>
        </div>

        <!-- Modalidad / Tramo Rápido -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">
            Tramo Simplificado
          </label>
          <div class="space-y-1.5">
            <button
              v-for="mod in modalidades"
              :key="mod.id"
              @click="cambiarModalidad(mod.id)"
              :class="filtros.modalidad === mod.id
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'"
              class="w-full text-xs font-bold px-3 py-2 rounded-xl border transition text-left"
            >
              {{ mod.label }}
            </button>
          </div>
        </div>

        <!-- Palabra clave -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">
            Producto, Servicio o Código
          </label>
          <input
            v-model="filtros.palabraClave"
            @keyup.enter="buscar(1)"
            type="text"
            placeholder="Ej: insumos, notebooks, aseo..."
            class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <!-- Región -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">
            Región
          </label>
          <select
            v-model="filtros.region"
            @change="buscar(1)"
            class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="">🇨🇱 Todo Chile</option>
            <option value="Arica">Arica y Parinacota</option>
            <option value="Tarapacá">Tarapacá</option>
            <option value="Antofagasta">Antofagasta</option>
            <option value="Atacama">Atacama</option>
            <option value="Coquimbo">Coquimbo</option>
            <option value="Valparaíso">Valparaíso</option>
            <option value="Metropolitana">Región Metropolitana</option>
            <option value="O'Higgins">O'Higgins</option>
            <option value="Maule">Maule</option>
            <option value="Ñuble">Ñuble</option>
            <option value="Biobío">Biobío</option>
            <option value="Araucanía">La Araucanía</option>
            <option value="Los Ríos">Los Ríos</option>
            <option value="Los Lagos">Los Lagos</option>
            <option value="Aysén">Aysén</option>
            <option value="Magallanes">Magallanes</option>
          </select>
        </div>

        <!-- Presupuesto Máximo CLP -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">
            Presupuesto Máximo (CLP)
          </label>
          <input
            v-model.number="filtros.precioMax"
            type="number"
            step="500000"
            placeholder="Hasta $6.660.000"
            class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <!-- Ordenar Por -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">
            Ordenar Por
          </label>
          <select
            v-model="filtros.ordenarPor"
            @change="buscar(1)"
            class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="cierre_asc">⏳ Cierre más próximo</option>
            <option value="cierre_desc">📅 Más plazo para cotizar</option>
            <option value="monto_desc">💰 Mayor Presupuesto</option>
            <option value="monto_asc">💵 Menor Presupuesto</option>
          </select>
        </div>

        <!-- Cierres urgentes -->
        <div class="pt-1">
          <label class="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              v-model="filtros.soloCierreProximo"
              @change="buscar(1)"
              class="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>🔥 Solo cierres urgentes (≤ 7 días)</span>
          </label>
        </div>

        <button
          @click="buscar(1)"
          class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5"
        >
          <span>⚡</span> Aplicar Filtros
        </button>
      </aside>

      <!-- ÁREA CENTRAL DE RESULTADOS -->
      <section class="flex-1 min-w-0 w-full space-y-4">
        <!-- Estado Cargando -->
        <div v-if="licitacionesStore.loading" class="bg-white rounded-2xl p-14 text-center shadow-sm border border-slate-200">
          <div class="inline-block w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p class="text-slate-800 font-bold">Buscando Compras Ágiles y contrataciones menores publicadas...</p>
          <p class="text-xs text-slate-500 mt-1">Filtrando oportunidades rápidas de hasta 30 y 100 UTM</p>
        </div>

        <!-- Listado de Compras Ágiles en el Centro -->
        <template v-else-if="licitacionesStore.comprasAgiles.length > 0">
          <div class="space-y-5">
            <div
              v-for="item in licitacionesStore.comprasAgiles"
              :key="item.CodigoExterno"
              class="card-elevated rounded-xl border-l-[6px] border-l-emerald-600 transition-all overflow-hidden"
            >
              <!-- Cabecera Oscura de Alto Contraste -->
              <div class="bg-slate-900 text-white px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded bg-emerald-600 text-white">
                    {{ item.CodigoExterno }}
                  </span>
                  <span class="text-xs font-extrabold px-2.5 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">
                    ⚡ {{ item.EsCompraAgilCot ? 'COT Compra Ágil' : `${item.Tipo} · Rápida < 100 UTM` }}
                  </span>
                  <span v-if="item.NombreOrganismo" class="text-xs font-semibold text-slate-200 bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700 truncate max-w-xs">
                    🏛️ {{ item.NombreOrganismo }}
                  </span>
                </div>

                <span
                  :class="getBadgeDiasClass(item.DiasRestantes)"
                  class="text-xs font-bold px-2.5 py-0.5 rounded-full"
                >
                  {{ formatDiasRestantes(item.DiasRestantes) }}
                </span>
              </div>

              <!-- Cuerpo Central -->
              <div class="p-5 bg-white">
              <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <h3
                    @click="verDetalle(item)"
                    class="font-extrabold text-slate-900 text-base sm:text-lg leading-snug hover:text-emerald-700 cursor-pointer"
                  >
                    {{ item.Nombre }}
                  </h3>
                  <p v-if="item.Descripcion && item.Descripcion !== item.Nombre" class="text-xs text-slate-600 line-clamp-2 mt-1">
                    {{ item.Descripcion }}
                  </p>
                  <p class="text-xs text-slate-600 mt-1.5">
                    📍 <strong class="text-slate-800">{{ item.RegionUnidad || 'Chile' }}</strong> {{ item.ComunaUnidad ? `(${item.ComunaUnidad})` : '' }}
                  </p>
                </div>

                <!-- Caja Derecha de Presupuesto -->
                <div class="xl:w-64 shrink-0 bg-emerald-50 rounded-xl p-3 border-2 border-emerald-200 xl:text-right">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    {{ item.MontoExactoDisponible ? '💰 Presupuesto Disponible' : '📊 Tope Máximo Compra' }}
                  </span>
                  <p v-if="item.MontoExactoDisponible" class="text-base font-extrabold text-emerald-700 mt-0.5">
                    {{ formatCurrency(item.MontoEstimado, item.Moneda) }}
                  </p>
                  <p v-else class="text-base font-extrabold text-slate-800 mt-0.5">
                    Hasta {{ formatCurrency(item.MontoMaximoEstimadoCLP || 6660000) }}
                  </p>
                  <span class="text-[11px] text-slate-500 block">
                    {{ item.MontoExactoDisponible ? (item.TipoEstimacionTexto || 'Presupuesto oficial') : 'Tramo 0 a 100 UTM (Sin toma de razón)' }}
                  </span>
                </div>
              </div>

              <!-- Barra Inferior: Fechas y Acciones -->
              <div class="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex flex-wrap items-center gap-4 text-xs">
                  <div class="bg-rose-50/70 border border-rose-100 px-3 py-1.5 rounded-lg">
                    <span class="text-[10px] uppercase font-bold text-rose-700 mr-1.5">🛑 Cierre Cotización:</span>
                    <span class="font-bold text-slate-900">{{ formatDateTime(item.FechaCierre) }}</span>
                  </div>
                  <div v-if="item.Fechas?.FechaEstimadaAdjudicacion" class="text-slate-600">
                    <span class="text-[10px] uppercase font-bold text-slate-400 mr-1">🏆 Adjudicación:</span>
                    <span class="font-semibold">{{ formatDateShort(item.Fechas.FechaEstimadaAdjudicacion) }}</span>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    v-if="!item.DetalleEnriquecido"
                    @click="cargarFichaRapida(item.CodigoExterno)"
                    :disabled="licitacionesStore.enriqueciendoCodigos[item.CodigoExterno]"
                    class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-xl transition"
                  >
                    {{ licitacionesStore.enriqueciendoCodigos[item.CodigoExterno] ? '⏳...' : '⚡ Ver Monto Exacto' }}
                  </button>

                  <button
                    v-if="perfil"
                    type="button"
                    @click="analizarMatch(item)"
                    :disabled="calculandoMatch[item.CodigoExterno]"
                    class="text-xs font-extrabold py-2 px-3.5 rounded-xl transition flex items-center gap-1"
                    :class="matchesTarjeta[item.CodigoExterno]
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'"
                  >
                    <span>🤖</span>
                    <span v-if="calculandoMatch[item.CodigoExterno]">⏳...</span>
                    <span v-else-if="matchesTarjeta[item.CodigoExterno]">
                      {{ matchesTarjeta[item.CodigoExterno].nivelMatch }}% Match IA {{ mostrarPanelMatch[item.CodigoExterno] ? '▲' : '▼' }}
                    </span>
                    <span v-else>Match IA</span>
                  </button>

                  <button
                    @click="verDetalle(item)"
                    class="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2 px-4 rounded-xl transition flex items-center gap-1.5"
                  >
                    <span>📋</span> Ver Ítems y Cotizar
                  </button>
                </div>
              </div>

              <!-- Panel Inline de Match IA en Compras Ágiles -->
              <div
                v-if="matchesTarjeta[item.CodigoExterno] && mostrarPanelMatch[item.CodigoExterno]"
                class="mt-3 bg-slate-900 text-white rounded-xl p-3.5 text-xs border border-purple-500/40"
              >
                <div class="flex items-center justify-between pb-2 border-b border-slate-700">
                  <span class="font-extrabold text-emerald-400">
                    🎯 {{ matchesTarjeta[item.CodigoExterno].nivelMatch }}% Compatibilidad con {{ perfil?.nombreEmpresa }}
                  </span>
                  <button type="button" @click="mostrarPanelMatch[item.CodigoExterno] = false" class="text-slate-400 hover:text-white">✕</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <div>
                    <span class="text-[10px] uppercase font-bold text-emerald-300 block">✅ Fortalezas:</span>
                    <p v-for="(f, idx) in (matchesTarjeta[item.CodigoExterno].fortalezas || []).slice(0, 2)" :key="idx" class="text-slate-200">• {{ f }}</p>
                  </div>
                  <div>
                    <span class="text-[10px] uppercase font-bold text-amber-300 block">💡 Recomendación:</span>
                    <p v-for="(r, idx) in (matchesTarjeta[item.CodigoExterno].recomendaciones || []).slice(0, 2)" :key="idx" class="text-slate-200">• {{ r }}</p>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>

          <!-- Paginación -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <p class="text-xs text-slate-600">
              Página <span class="font-bold text-slate-900">{{ licitacionesStore.paginaComprasAgiles }}</span>
              de <span class="font-bold text-slate-900">{{ licitacionesStore.totalPaginasComprasAgiles }}</span>
              ({{ licitacionesStore.totalComprasAgiles }} oportunidades rápidas)
            </p>

            <div class="flex items-center gap-2">
              <button
                @click="cambiarPagina(licitacionesStore.paginaComprasAgiles - 1)"
                :disabled="licitacionesStore.paginaComprasAgiles <= 1"
                class="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50"
              >
                ← Anterior
              </button>
              <span class="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs">
                {{ licitacionesStore.paginaComprasAgiles }} / {{ licitacionesStore.totalPaginasComprasAgiles }}
              </span>
              <button
                @click="cambiarPagina(licitacionesStore.paginaComprasAgiles + 1)"
                :disabled="licitacionesStore.paginaComprasAgiles >= licitacionesStore.totalPaginasComprasAgiles"
                class="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </template>

        <!-- Sin Resultados -->
        <div v-else class="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
          <p class="text-3xl mb-2">⚡</p>
          <h3 class="text-lg font-bold text-slate-800">No se encontraron Compras Ágiles con ese filtro</h3>
          <p class="text-xs text-slate-500 mt-1">Prueba quitando el filtro de región o palabra clave en la barra lateral.</p>
          <button
            @click="limpiar"
            class="mt-4 bg-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition"
          >
            Ver todas las Compras Ágiles
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLicitacionesStore } from '../stores/licitacionesStore'
import { usePerfilStore } from '../stores/perfilStore'
import { useAuthStore } from '../stores/authStore'
import { useIaStore } from '../stores/iaStore'

const router = useRouter()
const licitacionesStore = useLicitacionesStore()
const perfilStore = usePerfilStore()
const authStore = useAuthStore()
const iaStore = useIaStore()

const cargandoLote = ref(false)
const mostrarSidebarMovil = ref(false)
const matchesTarjeta = reactive({})
const mostrarPanelMatch = reactive({})
const calculandoMatch = reactive({})

const modalidades = [
  { id: 'todas', label: '⚡ Todas (< 100 UTM · COT + L1)' },
  { id: 'cot', label: '🛒 Solo Compra Ágil (COT en vivo)' },
  { id: '30utm', label: '🟢 Hasta 30 UTM (~$2,0M)' },
  { id: 'l1', label: '📋 Licitación Simplificada L1' }
]

const filtros = ref({
  palabraClave: '',
  palabrasExcluidas: '',
  region: '',
  modalidad: 'todas',
  precioMax: null,
  soloCierreProximo: false,
  ordenarPor: 'cierre_asc',
  pagina: 1,
  porPagina: 20
})

const perfil = computed(() => perfilStore.perfil)
const keywordsSeleccionadas = ref([])

const keywordsPerfil = computed(() => {
  if (!perfil.value?.servicios) return []
  return perfil.value.servicios.split(/[,;.\n]+/).map(s => s.trim()).filter(Boolean)
})

const esKeywordSeleccionada = (kw) => {
  return keywordsSeleccionadas.value.some(k => k.toLowerCase() === kw.toLowerCase())
}

const filtrarPorKeywordPerfil = async (kw) => {
  const idx = keywordsSeleccionadas.value.findIndex(k => k.toLowerCase() === kw.toLowerCase())
  if (idx !== -1) {
    keywordsSeleccionadas.value.splice(idx, 1)
  } else {
    keywordsSeleccionadas.value.push(kw)
  }
  filtros.value.palabrasExcluidas = perfil.value?.palabrasExcluidas || ''
  await buscar(1)
}

const limpiarKeywordsSeleccionadas = async () => {
  keywordsSeleccionadas.value = []
  await buscar(1)
}

const cambiarModalidad = (id) => {
  filtros.value.modalidad = id
  if (id === '30utm') {
    filtros.value.precioMax = 2000000
  } else {
    filtros.value.precioMax = null
  }
  buscar(1)
}

const buscar = async (pagina = 1) => {
  filtros.value.pagina = pagina
  await licitacionesStore.buscarComprasAgiles({
    ...filtros.value,
    palabrasClave: [...keywordsSeleccionadas.value]
  })
}

const cambiarPagina = async (nuevaPagina) => {
  if (nuevaPagina < 1 || nuevaPagina > licitacionesStore.totalPaginasComprasAgiles) return
  await buscar(nuevaPagina)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const limpiar = async () => {
  keywordsSeleccionadas.value = []
  filtros.value = {
    palabraClave: '',
    palabrasExcluidas: '',
    region: '',
    modalidad: 'todas',
    precioMax: null,
    soloCierreProximo: false,
    ordenarPor: 'cierre_asc',
    pagina: 1,
    porPagina: 20
  }
  await buscar(1)
}

const filtrarConMiPerfil = async () => {
  if (!perfil.value) return
  keywordsSeleccionadas.value = [...keywordsPerfil.value]
  const primeraReg = (!perfil.value.coberturaNacional && perfil.value.regiones)
    ? (perfil.value.regiones || '').split(',')[0]?.trim() || ''
    : ''
  filtros.value.palabraClave = ''
  filtros.value.palabrasExcluidas = perfil.value.palabrasExcluidas || ''
  filtros.value.region = primeraReg
  await buscar(1)
}

const cargarFichaRapida = async (codigo) => {
  await licitacionesStore.enriquecerLicitacionIndividual(codigo)
}

const enriquecerPagina = async () => {
  cargandoLote.value = true
  try {
    const codigos = licitacionesStore.comprasAgiles
      .filter(i => !i.DetalleEnriquecido)
      .map(i => i.CodigoExterno)
    for (let i = 0; i < codigos.length; i += 4) {
      await licitacionesStore.enriquecerLote(codigos.slice(i, i + 4))
    }
  } finally {
    cargandoLote.value = false
  }
}

const verDetalle = (licitacion) => {
  router.push({
    name: 'DetalleLicitacion',
    params: { codigo: licitacion.CodigoExterno },
    state: { licitacion }
  })
}

const analizarMatch = async (licitacion) => {
  const codigo = licitacion.CodigoExterno
  if (matchesTarjeta[codigo]) {
    mostrarPanelMatch[codigo] = !mostrarPanelMatch[codigo]
    return
  }
  calculandoMatch[codigo] = true
  try {
    const res = await iaStore.analizarMatch(perfil.value || {}, licitacion)
    const pb = res.puntosBlind || res
    matchesTarjeta[codigo] = {
      nivelMatch: res.nivelMatch ?? pb.nivelMatch ?? 75,
      fortalezas: pb.fortalezas || ['Compatible con el giro de tu empresa'],
      recomendaciones: pb.recomendaciones || ['Revisar ítems solicitados y enviar cotización rápida']
    }
    mostrarPanelMatch[codigo] = true
  } finally {
    calculandoMatch[codigo] = false
  }
}

watch(() => perfil.value?.id, () => {
  Object.keys(matchesTarjeta).forEach(k => delete matchesTarjeta[k])
  Object.keys(mostrarPanelMatch).forEach(k => delete mostrarPanelMatch[k])
})

const formatCurrency = (valor, moneda = 'CLP') => {
  if (!valor) return 'No informado'
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: moneda === 'USD' ? 'USD' : 'CLP', maximumFractionDigits: 0 }).format(valor)
}

const formatDateTime = (fecha) => {
  if (!fecha) return 'No informada'
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return fecha
  return d.toLocaleString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatDateShort = (fecha) => {
  if (!fecha) return 'N/A'
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return fecha
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatDiasRestantes = (dias) => {
  if (dias === null || dias === undefined) return 'Abierta'
  if (dias < 0) return 'Cerrada'
  if (dias === 0) return '⚠️ Cierra HOY'
  if (dias === 1) return '⏰ Cierra mañana'
  return `⏳ Quedan ${dias} días`
}

const getBadgeDiasClass = (dias) => {
  if (dias === null || dias === undefined) return 'bg-slate-100 text-slate-600'
  if (dias <= 2) return 'bg-rose-100 text-rose-700 border border-rose-200'
  if (dias <= 5) return 'bg-amber-100 text-amber-800 border border-amber-200'
  return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
}

onMounted(async () => {
  await buscar(1)
  if (authStore.usuarioId) {
    await perfilStore.obtenerPerfil(authStore.usuarioId)
  }
})
</script>
