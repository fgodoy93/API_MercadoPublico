<template>
  <div class="space-y-6">
    <!-- Encabezado y KPIs del Pipeline CRM -->
    <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-lg">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            CRM de Licitaciones & Control de Cronogramas
          </span>
          <h1 class="text-2xl sm:text-3xl font-extrabold mt-2 flex items-center gap-2">
            <span>📋</span> Pipeline Kanban de Postulaciones
          </h1>
          <p class="text-xs sm:text-sm text-slate-300 mt-1">
            Controla etapas, checklists de anexos, precios ofertados y alertas de cierre para
            <strong class="text-white">{{ soloEmpresaActiva ? (perfilActivo?.nombreEmpresa || 'tu empresa activa') : 'todas tus empresas' }}</strong>.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Toggle Empresa Activa vs Todas -->
          <button
            type="button"
            @click="soloEmpresaActiva = !soloEmpresaActiva"
            class="px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5"
            :class="soloEmpresaActiva
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-white/10 text-slate-200 border-white/20 hover:bg-white/20'"
          >
            <span>🏢</span>
            {{ soloEmpresaActiva ? `Viendo: ${perfilActivo?.nombreEmpresa || 'Activa'}` : 'Viendo: Todas las Empresas' }}
          </button>

          <button
            v-if="itemsFiltrados.length > 0"
            type="button"
            @click="exportarCalendarioICS(itemsFiltrados)"
            class="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5"
          >
            <span>📅</span> Descargar Calendario (.ics)
          </button>

          <button
            v-if="itemsFiltrados.length > 0"
            type="button"
            @click="exportarPipelineCSV"
            class="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <span>📥</span> Exportar Excel (CSV)
          </button>
        </div>
      </div>

      <!-- KPIs de Cartera -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/10">
        <div class="bg-white/5 rounded-xl p-3.5 border border-white/10">
          <span class="text-xs text-slate-300 block">Licitaciones en Pipeline</span>
          <p class="text-2xl font-extrabold text-white mt-0.5">{{ itemsFiltrados.length }}</p>
          <span class="text-[11px] text-indigo-300">Activas en seguimiento</span>
        </div>

        <div class="bg-white/5 rounded-xl p-3.5 border border-white/10">
          <span class="text-xs text-slate-300 block">Monto Total en Cartera</span>
          <p class="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-0.5">{{ formatCurrency(montoTotalCartera) }}</p>
          <span class="text-[11px] text-slate-300">Suma de ofertas / topes</span>
        </div>

        <div class="bg-white/5 rounded-xl p-3.5 border border-white/10">
          <span class="text-xs text-slate-300 block">Cierres Críticos (&le; 5 días)</span>
          <p class="text-2xl font-extrabold text-rose-400 mt-0.5">{{ alertasProximas.length }}</p>
          <span class="text-[11px] text-rose-200">Preguntas u ofertas por vencer</span>
        </div>

        <div class="bg-white/5 rounded-xl p-3.5 border border-white/10">
          <span class="text-xs text-slate-300 block">Ofertas Enviadas / Cerradas</span>
          <p class="text-2xl font-extrabold text-amber-300 mt-0.5">
            {{ itemsPorEtapa('enviada').length + itemsPorEtapa('resultado').length }}
          </p>
          <span class="text-[11px] text-slate-300">En etapa final</span>
        </div>
      </div>
    </div>

    <!-- Centro de Alertas de Hitos Próximos -->
    <div
      v-if="alertasProximas.length > 0"
      class="bg-amber-50 border border-amber-300 rounded-2xl p-4 shadow-xs space-y-2.5"
    >
      <div class="flex items-center justify-between">
        <h2 class="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-2">
          <span>⏰</span> Alertas de Cronograma en los Próximos Días ({{ alertasProximas.length }})
        </h2>
        <span class="text-[11px] text-amber-800 font-semibold">Haz clic en 📅 para agendar en Google Calendar / Outlook</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        <div
          v-for="(alerta, idx) in alertasProximas"
          :key="idx"
          class="bg-white rounded-xl p-3 border border-amber-200 flex items-center justify-between gap-2"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span
                :class="alerta.urgente ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'"
                class="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
              >
                {{ alerta.etiqueta }}
              </span>
              <span class="font-mono text-[11px] font-bold text-slate-700 truncate">{{ alerta.codigo }}</span>
            </div>
            <p class="text-xs font-bold text-slate-900 truncate mt-1" :title="alerta.nombre">
              {{ alerta.nombre }}
            </p>
            <p class="text-[11px] text-slate-500">
              {{ alerta.fechaTexto }}
            </p>
          </div>
          <button
            type="button"
            @click="exportarCalendarioICS([alerta.itemOriginal])"
            class="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold shrink-0"
            title="Descargar evento .ics para calendario"
          >
            📅 .ics
          </button>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div
      v-if="!cargando && itemsFiltrados.length === 0"
      class="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3"
    >
      <p class="text-4xl">📋</p>
      <h3 class="text-lg font-extrabold text-slate-900">Tu Pipeline Kanban está vacío</h3>
      <p class="text-xs text-slate-500 max-w-md mx-auto">
        Guarda licitaciones desde el Dashboard o el buscador con el botón <strong>"☆ Guardar"</strong> para gestionar aquí su checklist de anexos, preguntas al foro y presupuesto ofertado.
      </p>
      <div class="pt-2 flex justify-center gap-3">
        <router-link to="/" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl">
          🎯 Ver Mis Recomendadas
        </router-link>
        <router-link to="/licitaciones" class="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl">
          🔎 Ir al Buscador
        </router-link>
      </div>
    </div>

    <!-- Tablero Kanban de 5 Columnas -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-start">
      <div
        v-for="col in columnasKanban"
        :key="col.id"
        class="bg-slate-100/90 rounded-2xl border border-slate-200/90 p-3 space-y-3 min-h-[500px]"
      >
        <!-- Cabecera de Columna -->
        <div class="flex items-center justify-between px-1 py-1 border-b border-slate-200">
          <div class="flex items-center gap-1.5">
            <span>{{ col.icono }}</span>
            <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              {{ col.titulo }}
            </h3>
          </div>
          <span :class="col.badgeClass" class="text-xs font-extrabold px-2 py-0.5 rounded-full">
            {{ itemsPorEtapa(col.id).length }}
          </span>
        </div>

        <!-- Tarjetas de la Columna -->
        <div class="space-y-3">
          <div
            v-for="item in itemsPorEtapa(col.id)"
            :key="item.id"
            class="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition p-3.5 space-y-3"
          >
            <!-- Top: Empresa + Código + Match -->
            <div class="flex items-center justify-between gap-1.5">
              <span class="font-mono text-[11px] font-extrabold px-2 py-0.5 rounded bg-slate-900 text-white">
                {{ item.codigoLicitacion }}
              </span>
              <span
                class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 truncate max-w-[120px]"
              >
                🏢 {{ nombreEmpresaPorId(item.perfilId) }}
              </span>
            </div>

            <!-- Nombre de la Licitación -->
            <div>
              <h4
                @click="verDetalle(item)"
                class="text-xs font-extrabold text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-2 leading-snug"
              >
                {{ item.datosLicitacion?.Nombre || item.codigoLicitacion }}
              </h4>
              <p v-if="item.datosLicitacion?.NombreOrganismo" class="text-[11px] text-slate-500 truncate mt-0.5">
                🏛️ {{ item.datosLicitacion.NombreOrganismo }}
              </p>
            </div>

            <!-- Fechas Clave de la Tarjeta -->
            <div class="bg-slate-50 rounded-lg p-2 border border-slate-200/70 text-[11px] space-y-1">
              <div class="flex justify-between">
                <span class="text-slate-500">🛑 Cierre:</span>
                <span class="font-bold text-slate-800">{{ formatDateShort(item.datosLicitacion?.FechaCierre) }}</span>
              </div>
              <div v-if="item.datosLicitacion?.Fechas?.FechaFinalPreguntas" class="flex justify-between">
                <span class="text-slate-500">❓ Fin Foro:</span>
                <span class="font-semibold text-slate-700">{{ formatDateShort(item.datosLicitacion.Fechas.FechaFinalPreguntas) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">💰 Tope/Monto:</span>
                <span class="font-bold text-emerald-700">
                  {{ formatCurrency(item.datosLicitacion?.MontoEstimado || item.datosLicitacion?.MontoMaximoEstimadoCLP) }}
                </span>
              </div>
            </div>

            <!-- Checklist de Postulación (6 hitos) -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-[11px]">
                <span class="font-bold text-slate-700">Checklist Postulación</span>
                <span class="font-extrabold text-blue-700">{{ contarChecklist(item) }}/6 listos</span>
              </div>
              <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  class="h-full bg-emerald-500 transition-all"
                  :style="{ width: `${Math.round((contarChecklist(item) / 6) * 100)}%` }"
                ></div>
              </div>

              <div class="grid grid-cols-2 gap-1 pt-1">
                <label
                  v-for="chk in definicionChecklist"
                  :key="chk.key"
                  class="flex items-center gap-1.5 text-[10px] text-slate-700 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    :checked="Boolean(item.checklist && item.checklist[chk.key])"
                    @change="toggleCheck(item, chk.key)"
                    class="rounded text-blue-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span :class="item.checklist?.[chk.key] ? 'line-through text-slate-400' : 'font-medium'">
                    {{ chk.label }}
                  </span>
                </label>
              </div>
            </div>

            <!-- Monto a Ofertar y Notas Internas -->
            <div class="space-y-2 pt-2 border-t border-slate-100">
              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                  💵 Mi Oferta Neta ($ CLP)
                </label>
                <input
                  type="number"
                  :value="item.montoOfertado"
                  @change="actualizarCampoItem(item, 'montoOfertado', $event.target.value)"
                  placeholder="Ej: 12500000"
                  class="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                  📝 Notas / Pendientes
                </label>
                <textarea
                  :value="item.notasInternas"
                  @change="actualizarCampoItem(item, 'notasInternas', $event.target.value)"
                  rows="2"
                  placeholder="Ej: Falta certificado vigencia, pedir cotización..."
                  class="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none"
                ></textarea>
              </div>
            </div>

            <!-- Selector para mover de Etapa + Acciones -->
            <div class="pt-2 border-t border-slate-100 space-y-2">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-bold uppercase text-slate-400">Etapa:</span>
                <select
                  :value="item.etapaPipeline || 'evaluacion'"
                  @change="actualizarCampoItem(item, 'etapaPipeline', $event.target.value)"
                  class="flex-1 border border-slate-300 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 bg-slate-50 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option v-for="c in columnasKanban" :key="c.id" :value="c.id">
                    {{ c.icono }} {{ c.titulo }}
                  </option>
                </select>
              </div>

              <div class="flex items-center justify-between pt-1 text-[11px]">
                <button
                  type="button"
                  @click="exportarCalendarioICS([item])"
                  class="text-slate-600 hover:text-blue-700 font-bold"
                  title="Agendar hitos en calendario"
                >
                  📅 Agendar
                </button>
                <button
                  type="button"
                  @click="verDetalle(item)"
                  class="text-blue-600 hover:underline font-extrabold"
                >
                  Abrir Ficha →
                </button>
                <button
                  type="button"
                  @click="eliminarItem(item)"
                  class="text-rose-600 hover:underline font-semibold"
                >
                  Quitar
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="itemsPorEtapa(col.id).length === 0"
            class="border border-dashed border-slate-300 rounded-xl p-6 text-center text-xs text-slate-400 italic"
          >
            Sin licitaciones en esta etapa
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../stores/authStore'
import { usePerfilStore } from '../stores/perfilStore'

const router = useRouter()
const authStore = useAuthStore()
const perfilStore = usePerfilStore()

const cargando = ref(false)
const items = ref([])
const listaPerfiles = ref([])
const soloEmpresaActiva = ref(false)

const perfilActivo = computed(() => perfilStore.perfil)

const columnasKanban = [
  { id: 'evaluacion', icono: '🔍', titulo: '1. En Evaluación', badgeClass: 'bg-slate-200 text-slate-800' },
  { id: 'foro', icono: '❓', titulo: '2. Consultas Foro', badgeClass: 'bg-amber-100 text-amber-800' },
  { id: 'preparacion', icono: '📝', titulo: '3. Preparando Oferta', badgeClass: 'bg-blue-100 text-blue-800' },
  { id: 'enviada', icono: '🚀', titulo: '4. Oferta Enviada', badgeClass: 'bg-indigo-100 text-indigo-800' },
  { id: 'resultado', icono: '🏆', titulo: '5. Adjudicada / Final', badgeClass: 'bg-emerald-100 text-emerald-800' }
]

const definicionChecklist = [
  { key: 'basesLeidas', label: 'Bases leídas' },
  { key: 'preguntasForo', label: 'Consultas foro' },
  { key: 'anexoAdministrativo', label: 'Anexos admin.' },
  { key: 'ofertaTecnica', label: 'Prop. técnica' },
  { key: 'ofertaEconomica', label: 'Oferta económ.' },
  { key: 'garantiaLista', label: 'Garantía lista' }
]

const itemsFiltrados = computed(() => {
  if (!soloEmpresaActiva.value || !perfilActivo.value?.id) {
    return items.value
  }
  const pid = perfilActivo.value.id
  return items.value.filter(i => i.perfilId === pid || (!i.perfilId && pid === 1))
})

const itemsPorEtapa = (etapa) => {
  return itemsFiltrados.value.filter(i => (i.etapaPipeline || 'evaluacion') === etapa)
}

const montoTotalCartera = computed(() => {
  return itemsFiltrados.value.reduce((acc, item) => {
    const val = Number(item.montoOfertado) || Number(item.datosLicitacion?.MontoEstimado) || Number(item.datosLicitacion?.MontoMaximoEstimadoCLP) || 0
    return acc + val
  }, 0)
})

const alertasProximas = computed(() => {
  const lista = []
  const ahora = new Date()
  for (const item of itemsFiltrados.value) {
    const d = item.datosLicitacion || {}
    const fechaForo = d.Fechas?.FechaFinalPreguntas ? new Date(d.Fechas.FechaFinalPreguntas) : null
    if (fechaForo && !isNaN(fechaForo.getTime())) {
      const diffDias = Math.ceil((fechaForo - ahora) / (1000 * 60 * 60 * 24))
      if (diffDias >= 0 && diffDias <= 5) {
        lista.push({
          urgente: diffDias <= 2,
          etiqueta: diffDias === 0 ? '🔥 Foro cierra HOY' : `❓ Foro en ${diffDias}d`,
          codigo: item.codigoLicitacion,
          nombre: d.Nombre || item.codigoLicitacion,
          fechaTexto: `Cierre de preguntas: ${formatDateShort(d.Fechas.FechaFinalPreguntas)}`,
          itemOriginal: item
        })
      }
    }

    const fechaCierre = d.FechaCierre ? new Date(d.FechaCierre) : null
    if (fechaCierre && !isNaN(fechaCierre.getTime())) {
      const diffDias = Math.ceil((fechaCierre - ahora) / (1000 * 60 * 60 * 24))
      if (diffDias >= 0 && diffDias <= 7) {
        lista.push({
          urgente: diffDias <= 3,
          etiqueta: diffDias === 0 ? '🔥 Cierra HOY' : `🛑 Cierre en ${diffDias}d`,
          codigo: item.codigoLicitacion,
          nombre: d.Nombre || item.codigoLicitacion,
          fechaTexto: `Cierre ofertas: ${formatDateShort(d.FechaCierre)}`,
          itemOriginal: item
        })
      }
    }
  }
  return lista.slice(0, 9)
})

const nombreEmpresaPorId = (pid) => {
  if (!pid) return listaPerfiles.value[0]?.nombreEmpresa || 'Principal'
  const emp = listaPerfiles.value.find(p => p.id === Number(pid))
  return emp ? emp.nombreEmpresa : 'Empresa'
}

const contarChecklist = (item) => {
  const chk = item.checklist || {}
  return definicionChecklist.filter(d => Boolean(chk[d.key])).length
}

const toggleCheck = async (item, key) => {
  const actual = {
    basesLeidas: false,
    preguntasForo: false,
    anexoAdministrativo: false,
    ofertaTecnica: false,
    ofertaEconomica: false,
    garantiaLista: false,
    ...(item.checklist || {})
  }
  actual[key] = !actual[key]
  item.checklist = actual
  await guardarCambiosItem(item, { checklist: actual })
}

const actualizarCampoItem = async (item, campo, valor) => {
  item[campo] = valor
  await guardarCambiosItem(item, { [campo]: valor })
}

const guardarCambiosItem = async (item, payload) => {
  try {
    await axios.put(`/api/licitaciones/guardadas/item/${item.id}`, payload, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
  } catch (e) {
    console.error('Error actualizando item en pipeline:', e)
  }
}

const eliminarItem = async (item) => {
  const uid = authStore.usuarioId || 1
  try {
    await axios.delete(`/api/licitaciones/guardadas/${uid}/${item.codigoLicitacion}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    items.value = items.value.filter(i => i.id !== item.id)
  } catch (e) {
    console.error('Error eliminando de pipeline:', e)
  }
}

const verDetalle = (item) => {
  router.push({
    name: 'DetalleLicitacion',
    params: { codigo: item.codigoLicitacion },
    state: { licitacion: item.datosLicitacion }
  })
}

const formatCurrency = (valor) => {
  if (!valor) return 'S/I'
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(valor)
}

const formatDateShort = (fecha) => {
  if (!fecha) return 'No informada'
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return fecha
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatICSDate = (dateStr) => {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

const exportarCalendarioICS = (listaItems) => {
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MercadoPublico MultiEmpresa//CL',
    'CALSCALE:GREGORIAN'
  ]

  for (const item of listaItems) {
    const d = item.datosLicitacion || {}
    const codigo = item.codigoLicitacion
    const nombre = (d.Nombre || codigo).replace(/[\r\n,;]/g, ' ')

    if (d.Fechas?.FechaFinalPreguntas) {
      const dt = formatICSDate(d.Fechas.FechaFinalPreguntas)
      if (dt) {
        lineas.push(
          'BEGIN:VEVENT',
          `UID:foro-${codigo}@mercadopublico.cl`,
          `DTSTAMP:${formatICSDate(new Date())}`,
          `DTSTART:${dt}`,
          `DTEND:${dt}`,
          `SUMMARY:[FORO PREGUNTAS] ${codigo} - ${nombre}`,
          `DESCRIPTION:Cierre de preguntas en Mercado Público para ${codigo}`,
          'END:VEVENT'
        )
      }
    }

    if (d.FechaCierre) {
      const dt = formatICSDate(d.FechaCierre)
      if (dt) {
        lineas.push(
          'BEGIN:VEVENT',
          `UID:cierre-${codigo}@mercadopublico.cl`,
          `DTSTAMP:${formatICSDate(new Date())}`,
          `DTSTART:${dt}`,
          `DTEND:${dt}`,
          `SUMMARY:[CIERRE OFERTAS] ${codigo} - ${nombre}`,
          `DESCRIPTION:Fecha límite de recepción de ofertas en Mercado Público para ${codigo}`,
          'END:VEVENT'
        )
      }
    }
  }

  lineas.push('END:VCALENDAR')
  const blob = new Blob([lineas.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `calendario-licitaciones-${new Date().toISOString().slice(0, 10)}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

const exportarPipelineCSV = () => {
  const encabezados = ['Codigo', 'Empresa', 'Etapa', 'Nombre', 'Organismo', 'Fecha Cierre', 'Mi Oferta CLP', 'Tope Licitacion CLP', 'Checklist', 'Notas', 'URL MercadoPublico']
  const filas = itemsFiltrados.value.map(item => {
    const d = item.datosLicitacion || {}
    return [
      item.codigoLicitacion,
      nombreEmpresaPorId(item.perfilId),
      item.etapaPipeline || 'evaluacion',
      `"${(d.Nombre || '').replace(/"/g, '""')}"`,
      `"${(d.NombreOrganismo || '').replace(/"/g, '""')}"`,
      d.FechaCierre || '',
      item.montoOfertado || '',
      d.MontoEstimado || d.MontoMaximoEstimadoCLP || '',
      `${contarChecklist(item)}/6`,
      `"${(item.notasInternas || '').replace(/"/g, '""')}"`,
      `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${item.codigoLicitacion}`
    ].join(';')
  })

  const contenido = '\uFEFF' + [encabezados.join(';'), ...filas].join('\r\n')
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pipeline-licitaciones-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const cargarDatos = async () => {
  cargando.value = true
  try {
    const uid = authStore.usuarioId || JSON.parse(localStorage.getItem('usuario') || '{}')?.id || 1
    const [resPerfiles, resGuardadas] = await Promise.all([
      axios.get(`/api/perfil/lista/${uid}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
      axios.get(`/api/licitaciones/guardadas/${uid}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    ])
    listaPerfiles.value = resPerfiles.data || []
    items.value = resGuardadas.data || []
  } catch (e) {
    console.error('Error cargando pipeline:', e)
  } finally {
    cargando.value = false
  }
}

watch(() => perfilStore.perfil?.id, () => {
  cargarDatos()
})

onMounted(async () => {
  await cargarDatos()
})
</script>
