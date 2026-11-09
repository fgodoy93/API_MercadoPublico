<template>
  <div class="space-y-6">
    <!-- 1. Banda Ejecutiva de Contexto y Acciones Rápidas -->
    <div class="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              Radar Activo: {{ perfil?.nombreEmpresa || 'Configura tu Empresa' }}
            </span>
            <span v-if="perfil?.rutEmpresa" class="text-xs font-mono text-slate-400">
              RUT {{ perfil.rutEmpresa }}
            </span>
          </div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Centro de Oportunidades y Recomendaciones
          </h1>
          <p class="text-xs text-slate-500 max-w-3xl truncate">
            <template v-if="perfil?.servicios">
              Monitoreando palabras clave: <span class="text-slate-700 font-medium">{{ perfil.servicios }}</span>
            </template>
            <template v-else>
              Define tus rubros y palabras clave en el Perfil de Empresa para calibrar las recomendaciones automáticas.
            </template>
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <router-link
            to="/compras-agiles"
            class="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <span>⚡</span> Compras Ágiles
          </router-link>
          <router-link
            to="/licitaciones"
            class="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>🔎</span> Buscador Nacional
          </router-link>
          <router-link
            to="/perfil"
            class="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <span>⚙️</span> Calibrar Perfil
          </router-link>
        </div>
      </div>

      <!-- 4 KPIs con Números Tabulares y Jerarquía Clara -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5 pt-5 border-t border-slate-100">
        <div class="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 border-l-4 border-l-slate-700">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Mercado Activo Chile
          </span>
          <p class="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
            {{ totalActivas.toLocaleString('es-CL') }}
          </p>
          <span class="text-[11px] text-slate-500 mt-0.5 block">Licitaciones abiertas hoy</span>
        </div>

        <div
          @click="vistaActiva = 'recomendadas'"
          class="bg-blue-50/40 rounded-xl p-4 border border-blue-200/80 border-l-4 border-l-blue-600 cursor-pointer hover:bg-blue-50/70 transition"
        >
          <span class="text-[11px] font-semibold uppercase tracking-wider text-blue-800 block">
            Recomendadas para Ti
          </span>
          <p class="text-2xl font-extrabold text-blue-700 tabular-nums mt-1">
            {{ licitacionesRecomendadas.length }}
          </p>
          <span class="text-[11px] text-blue-600 font-medium mt-0.5 block">
            Calzan con {{ perfil?.nombreEmpresa || 'tu rubro' }}
          </span>
        </div>

        <div
          @click="vistaActiva = 'urgentes'"
          class="bg-amber-50/40 rounded-xl p-4 border border-amber-200/80 border-l-4 border-l-amber-500 cursor-pointer hover:bg-amber-50/70 transition"
        >
          <span class="text-[11px] font-semibold uppercase tracking-wider text-amber-900 block">
            Cierres Próximos (&le; 4 días)
          </span>
          <p class="text-2xl font-extrabold text-amber-700 tabular-nums mt-1">
            {{ cierresUrgentesRecomendadas.length }}
          </p>
          <span class="text-[11px] text-amber-700 font-medium mt-0.5 block">
            Requieren revisión pronta
          </span>
        </div>

        <div
          @click="router.push('/postulaciones')"
          class="bg-emerald-50/40 rounded-xl p-4 border border-emerald-200/80 border-l-4 border-l-emerald-600 cursor-pointer hover:bg-emerald-50/70 transition"
        >
          <span class="text-[11px] font-semibold uppercase tracking-wider text-emerald-900 block">
            En Pipeline CRM
          </span>
          <p class="text-2xl font-extrabold text-emerald-700 tabular-nums mt-1">
            {{ licitacionesGuardadas.length }}
          </p>
          <span class="text-[11px] text-emerald-700 font-medium mt-0.5 block">
            Ver tablero Kanban →
          </span>
        </div>
      </div>
    </div>

    <!-- 2. Selector / Comparador Multi-Empresa Compacto -->
    <div v-if="resumenMultiempresa.length > 1" class="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            🏢 Tus Empresas Registradas ({{ resumenMultiempresa.length }})
          </span>
          <span class="text-[11px] text-slate-400 hidden sm:inline">
            — Haz clic en cualquiera para alternar las recomendaciones al instante
          </span>
        </div>
        <router-link to="/perfil?nuevo=1" class="text-xs font-bold text-blue-600 hover:text-blue-800">
          + Agregar otra empresa
        </router-link>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          v-for="emp in resumenMultiempresa"
          :key="emp.id"
          type="button"
          @click="cambiarEmpresaDesdeRadar(emp.id)"
          :class="perfil?.id === emp.id
            ? 'ring-2 ring-blue-600 bg-blue-50/30 border-blue-400'
            : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200'"
          class="p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-2.5"
        >
          <div class="flex items-center justify-between gap-2 w-full">
            <div class="flex items-center gap-2 min-w-0">
              <span
                :class="perfil?.id === emp.id ? 'bg-blue-600' : 'bg-slate-400'"
                class="w-2 h-2 rounded-full shrink-0"
              ></span>
              <span class="text-xs font-extrabold text-slate-900 truncate">{{ emp.nombreEmpresa }}</span>
            </div>
            <span class="text-[10px] font-mono text-slate-400 shrink-0">{{ emp.rutEmpresa }}</span>
          </div>

          <div class="grid grid-cols-4 gap-1.5 w-full text-center pt-1.5 border-t border-slate-200/70">
            <div>
              <span class="text-xs font-extrabold text-blue-700 tabular-nums block">{{ emp.totalRecomendadas }}</span>
              <span class="text-[10px] text-slate-500">Match</span>
            </div>
            <div>
              <span class="text-xs font-extrabold text-emerald-700 tabular-nums block">{{ emp.comprasAgiles }}</span>
              <span class="text-[10px] text-slate-500">&lt;100 UTM</span>
            </div>
            <div>
              <span class="text-xs font-extrabold text-amber-700 tabular-nums block">{{ emp.cierresProximos }}</span>
              <span class="text-[10px] text-slate-500">&le;5 días</span>
            </div>
            <div>
              <span class="text-xs font-extrabold text-slate-700 tabular-nums block">{{ emp.enPipeline }}</span>
              <span class="text-[10px] text-slate-500">En CRM</span>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- 3. Área Principal con Pestañas Ordenadas y Barra de Filtrado -->
    <div class="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      <!-- Barra de Pestañas (Tabs) + Acciones Globales -->
      <div class="px-5 pt-4 pb-3 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            @click="vistaActiva = 'recomendadas'; paginaActual = 1"
            :class="vistaActiva === 'recomendadas'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'"
            class="px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2"
          >
            <span>🎯 Todas las Recomendadas</span>
            <span
              :class="vistaActiva === 'recomendadas' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700'"
              class="px-1.5 py-0.5 rounded text-[10px] font-extrabold tabular-nums"
            >
              {{ licitacionesRecomendadas.length }}
            </span>
          </button>

          <button
            type="button"
            @click="vistaActiva = 'urgentes'; paginaActual = 1"
            :class="vistaActiva === 'urgentes'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'"
            class="px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2"
          >
            <span>⏰ Cierres en &le; 4 Días</span>
            <span
              :class="vistaActiva === 'urgentes' ? 'bg-amber-500 text-slate-950' : 'bg-amber-50 text-amber-800'"
              class="px-1.5 py-0.5 rounded text-[10px] font-extrabold tabular-nums"
            >
              {{ cierresUrgentesRecomendadas.length }}
            </span>
          </button>

          <button
            type="button"
            @click="vistaActiva = 'guardadas'"
            :class="vistaActiva === 'guardadas'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'"
            class="px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2"
          >
            <span>⭐ Guardadas en Cartera</span>
            <span
              :class="vistaActiva === 'guardadas' ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-50 text-emerald-800'"
              class="px-1.5 py-0.5 rounded text-[10px] font-extrabold tabular-nums"
            >
              {{ licitacionesGuardadas.length }}
            </span>
          </button>
        </div>

        <!-- Botones de Acción de la Lista -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-if="recomendadasFiltradas.length > 0 && vistaActiva !== 'guardadas'"
            type="button"
            @click="exportarRecomendadasCSV"
            class="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <span>📥</span> Exportar CSV ({{ recomendadasFiltradas.length }})
          </button>

          <button
            v-if="recomendadasPaginadas.length > 0 && vistaActiva !== 'guardadas'"
            type="button"
            @click="enriquecerPaginaActual"
            :disabled="enriqueciendo"
            class="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 text-xs font-semibold transition"
          >
            {{ enriqueciendo ? 'Consultando MP...' : '✨ Cargar detalles página' }}
          </button>

          <button
            type="button"
            @click="recargarRecomendadas"
            :disabled="cargandoRecomendadas"
            class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
          >
            {{ cargandoRecomendadas ? 'Actualizando...' : '↻ Actualizar' }}
          </button>
        </div>
      </div>

      <!-- Sub-barra de Filtros Rápidos (cuando estamos en Recomendadas o Urgentes) -->
      <div
        v-if="vistaActiva !== 'guardadas' && licitacionesRecomendadas.length > 0"
        class="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 space-y-3"
      >
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div class="sm:col-span-5">
            <input
              v-model="filtroTexto"
              @input="paginaActual = 1"
              type="text"
              placeholder="🔎 Filtrar por título, código o institución compradora..."
              class="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div class="sm:col-span-3">
            <select
              v-model="filtroTramo"
              @change="paginaActual = 1"
              aria-label="Filtrar por tramo"
              class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Todos los tramos UTM</option>
              <option value="AGIL">⚡ Menores a 100 UTM (L1 / E2)</option>
              <option value="LE">📊 100 a 1.000 UTM (LE)</option>
              <option value="MAYOR">🏛️ Mayores a 1.000 UTM (LP / LQ / LR)</option>
            </select>
          </div>

          <div class="sm:col-span-2">
            <select
              v-model="ordenRecomendadas"
              aria-label="Ordenar por"
              class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="afinidad">Orden: Mayor % Afinidad</option>
              <option value="cierre">Orden: Próximas a Cerrar</option>
              <option value="monto">Orden: Mayor Monto</option>
            </select>
          </div>

          <div class="sm:col-span-2">
            <select
              v-model.number="porPagina"
              @change="paginaActual = 1"
              aria-label="Resultados por página"
              class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option :value="15">Mostrar 15 / pág</option>
              <option :value="30">Mostrar 30 / pág</option>
              <option :value="50">Mostrar 50 / pág</option>
              <option :value="9999">Ver Todas ({{ recomendadasFiltradas.length }})</option>
            </select>
          </div>
        </div>

        <!-- Píldoras de Palabras Clave con Conteo -->
        <div v-if="keywordsConConteo.length > 0" class="flex flex-wrap items-center gap-1.5">
          <span class="text-[11px] font-semibold text-slate-500 mr-1">Filtrar por servicio:</span>
          <button
            type="button"
            @click="filtroKeyword = ''; paginaActual = 1"
            :class="filtroKeyword === ''
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'"
            class="text-[11px] font-semibold px-2.5 py-0.5 rounded-md border transition"
          >
            Todas ({{ licitacionesRecomendadas.length }})
          </button>
          <button
            v-for="kw in keywordsConConteo"
            :key="kw.palabra"
            type="button"
            @click="filtroKeyword = (filtroKeyword === kw.palabra ? '' : kw.palabra); paginaActual = 1"
            :class="filtroKeyword === kw.palabra
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'"
            class="text-[11px] font-medium px-2.5 py-0.5 rounded-md border transition"
          >
            {{ kw.palabra }} <span class="opacity-70 tabular-nums">({{ kw.total }})</span>
          </button>
        </div>
      </div>

      <!-- Contenido Principal de las Pestañas (Fondo Slate contrastado para que las tarjetas blancas resalten con nitidez) -->
      <div class="p-4 sm:p-6 bg-[#e2e8f0]/80">
        <!-- PESTANA 3: Cartera Guardada -->
        <div v-if="vistaActiva === 'guardadas'" class="space-y-4">
          <div class="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-300 shadow-xs">
            <p class="text-xs text-slate-700">
              Tienes <strong>{{ licitacionesGuardadas.length }}</strong> licitaciones guardadas en seguimiento.
            </p>
            <router-link
              to="/postulaciones"
              class="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-blue-600 transition"
            >
              📋 Abrir Tablero Kanban Completo →
            </router-link>
          </div>

          <div v-if="licitacionesGuardadas.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="item in licitacionesGuardadas"
              :key="item.id"
              class="card-elevated rounded-xl border-l-[5px] border-l-indigo-600 p-4 transition flex flex-col justify-between gap-3"
            >
              <div>
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-slate-900 text-white">
                      {{ item.codigoLicitacion }}
                    </span>
                    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {{ item.etapaPipeline || 'evaluacion' }}
                    </span>
                  </div>
                  <span v-if="item.nivelMatch" class="text-xs font-extrabold text-emerald-700 tabular-nums">
                    {{ item.nivelMatch }}% Afinidad
                  </span>
                </div>
                <h4
                  @click="irADetalleCodigo(item.codigoLicitacion, item.datosLicitacion)"
                  class="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer mt-2"
                >
                  {{ item.datosLicitacion?.Nombre || item.codigoLicitacion }}
                </h4>
              </div>

              <div class="flex items-center justify-between pt-2.5 border-t border-slate-200 text-xs text-slate-600">
                <span>🛑 Cierre: <strong class="text-slate-800">{{ formatDateShort(item.datosLicitacion?.FechaCierre) }}</strong></span>
                <div class="flex items-center gap-3">
                  <button
                    @click="irADetalleCodigo(item.codigoLicitacion, item.datosLicitacion)"
                    class="text-blue-600 font-bold hover:underline"
                  >
                    Ver Ficha →
                  </button>
                  <button
                    @click="eliminarDeGuardadas(item.codigoLicitacion)"
                    class="text-rose-600 font-semibold hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-12 text-xs text-slate-600 bg-white rounded-xl border border-slate-300">
            No tienes licitaciones guardadas aún. Haz clic en <strong>"☆ Guardar"</strong> en cualquier oportunidad recomendada.
          </div>
        </div>

        <!-- PESTAÑAS 1 y 2: Listado de Tarjetas Recomendadas / Urgentes -->
        <template v-else>
          <!-- Skeleton de Carga -->
          <div v-if="cargandoRecomendadas" class="space-y-5 py-4" aria-busy="true">
            <div v-for="n in 4" :key="n" class="h-40 rounded-xl bg-white animate-pulse border-2 border-slate-300 shadow-sm"></div>
          </div>

          <div v-else-if="recomendadasPaginadas.length > 0" class="space-y-5">
            <article
              v-for="(lic, index) in recomendadasPaginadas"
              :key="lic.CodigoExterno"
              class="card-elevated rounded-xl border-l-[6px] border-l-blue-600 transition overflow-hidden"
            >
              <!-- Cabecera Oscura de Alto Contraste: Delimita claramente el inicio de cada Card -->
              <div class="bg-slate-900 text-white px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-[11px] font-bold text-slate-400 tabular-nums mr-0.5">
                    #{{ (paginaActual - 1) * porPagina + index + 1 }}
                  </span>
                  <span class="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded bg-blue-600 text-white">
                    {{ lic.CodigoExterno }}
                  </span>
                  <span class="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                    {{ lic.Tipo }} · {{ lic.DescripcionTipo || 'Licitación Pública' }}
                  </span>
                  <span
                    v-if="lic.DiasRestantes !== null"
                    :class="lic.DiasRestantes <= 3
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : lic.DiasRestantes <= 7
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'"
                    class="text-[11px] font-bold px-2.5 py-0.5 rounded-md border tabular-nums"
                  >
                    {{ lic.DiasRestantes <= 0 ? '🔥 Cierra Hoy' : `⏳ ${lic.DiasRestantes} días restantes` }}
                  </span>
                  <span
                    v-if="lic.EsRenovable"
                    class="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30"
                  >
                    🔄 Renovable
                  </span>
                  <span
                    v-if="lic.Fechas?.FechaVisitaTerreno"
                    class="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30"
                  >
                    👷 Visita a Terreno
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <span class="px-3 py-0.5 rounded-md text-xs font-extrabold bg-emerald-500 text-slate-950 tabular-nums shadow-2xs">
                    🎯 {{ lic.scoreRecomendacion || 85 }}% Afinidad
                  </span>
                </div>
              </div>

              <!-- Cuerpo de la Card sobre Blanco Puro -->
              <div class="p-4 sm:p-5 space-y-4 bg-white">
                <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div class="space-y-1.5 flex-1 min-w-0">
                    <h3
                      @click="verDetalle(lic)"
                      class="font-extrabold text-slate-900 text-base sm:text-lg hover:text-blue-600 cursor-pointer leading-snug"
                    >
                      {{ lic.Nombre }}
                    </h3>

                    <!-- Institución Compradora y Ubicación -->
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                      <button
                        v-if="lic.NombreOrganismo"
                        type="button"
                        @click.stop="filtroTexto = lic.NombreOrganismo; paginaActual = 1"
                        class="font-bold text-slate-800 hover:text-blue-600 text-left bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200"
                        title="Filtrar licitaciones de esta institución"
                      >
                        🏛️ {{ lic.NombreOrganismo }}
                        <span v-if="lic.NombreUnidad && lic.NombreUnidad !== lic.NombreOrganismo" class="font-normal text-slate-500">
                          ({{ lic.NombreUnidad }})
                        </span>
                      </button>
                      <span v-else class="text-slate-500 italic flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                        <span v-if="cargandoCodigos[lic.CodigoExterno]" class="inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                        {{ cargandoCodigos[lic.CodigoExterno] ? 'Cargando organismo y especificación...' : 'Organismo en bases administrativas' }}
                      </span>

                      <span v-if="lic.RegionUnidad || lic.ComunaUnidad" class="text-slate-700 font-medium bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        📍 {{ [lic.ComunaUnidad, lic.RegionUnidad].filter(Boolean).join(', ') }}
                      </span>

                      <span
                        v-if="lic.DetalleEnriquecido && lic.CantidadReclamos !== undefined"
                        :class="lic.CantidadReclamos <= 5
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-900 border-amber-300'"
                        class="text-[11px] font-bold px-2.5 py-1 rounded-md border"
                      >
                        {{ lic.CantidadReclamos <= 5 ? '🟢 Comprador Confiable' : `⚠️ ${lic.CantidadReclamos} reclamos` }}
                      </span>
                    </div>
                  </div>

                  <!-- Monto / Tope con Borde Destacado -->
                  <div class="bg-slate-100 border-2 border-slate-300 rounded-xl px-4 py-2.5 sm:text-right shrink-0">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      {{ lic.MontoEstimado ? '💰 Presupuesto Informado' : `📊 Tope Tramo ${lic.Tipo} (${lic.RangoUTM || 'UTM'})` }}
                    </span>
                    <span class="text-base font-extrabold text-slate-900 tabular-nums block mt-0.5">
                      {{ lic.MontoEstimado ? formatCurrency(lic.MontoEstimado) : (lic.MontoMaximoEstimadoCLP ? `Hasta ${formatCurrency(lic.MontoMaximoEstimadoCLP)}` : 'Más de $333.000.000') }}
                    </span>
                    <span v-if="lic.ModalidadPagoTexto && lic.ModalidadPagoTexto !== 'Según bases'" class="text-[11px] font-medium text-slate-600 block">
                      {{ lic.ModalidadPagoTexto }}
                    </span>
                  </div>
                </div>

                <!-- Bloque: Resumen de lo que se requiere + Ítems (Contraste Azul Suave con Borde) -->
                <div class="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-2">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[11px] font-extrabold uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                      <span>📋</span> Resumen de lo que se requiere
                    </span>
                    <button
                      v-if="!lic.DetalleEnriquecido && !cargandoCodigos[lic.CodigoExterno]"
                      type="button"
                      @click.stop="enriquecerUnaLicitacion(lic.CodigoExterno)"
                      class="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline"
                    >
                      + Cargar especificación e ítems
                    </button>
                  </div>

                  <p
                    v-if="lic.Descripcion"
                    :class="tarjetasExpandidas[lic.CodigoExterno] ? '' : 'line-clamp-2'"
                    class="text-xs text-slate-800 leading-relaxed whitespace-pre-line"
                  >
                    {{ lic.Descripcion }}
                  </p>
                  <p v-else class="text-xs text-slate-700 leading-relaxed">
                    Proceso de contratación para <strong>{{ lic.Nombre }}</strong> en tramo <strong>{{ lic.DescripcionTipo || lic.Tipo }}</strong>
                    ({{ lic.RangoUTM || 'tramo oficial' }}).
                    <span v-if="lic.keywordsMatch?.length">
                      Coincidencia directa con tus servicios: <strong>{{ lic.keywordsMatch.join(', ') }}</strong>.
                    </span>
                  </p>

                  <button
                    v-if="lic.Descripcion && lic.Descripcion.length > 180"
                    type="button"
                    @click.stop="toggleExpandirTarjeta(lic.CodigoExterno)"
                    class="text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    {{ tarjetasExpandidas[lic.CodigoExterno] ? '▲ Contraer descripción' : '▼ Ver descripción completa' }}
                  </button>

                  <!-- Ítems Solicitados -->
                  <div v-if="lic.Items?.Listado?.length > 0" class="pt-2.5 border-t border-blue-200 space-y-1.5">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-bold text-blue-950">
                        📦 Ítems solicitados ({{ lic.Items.Listado.length }}):
                      </span>
                      <button
                        v-if="lic.Items.Listado.length > 2"
                        type="button"
                        @click.stop="toggleExpandirTarjeta(lic.CodigoExterno)"
                        class="text-[11px] font-bold text-blue-700 hover:underline"
                      >
                        {{ tarjetasExpandidas[lic.CodigoExterno] ? 'Mostrar menos' : `Ver los ${lic.Items.Listado.length} ítems` }}
                      </button>
                    </div>

                    <div class="grid grid-cols-1 gap-1.5">
                      <div
                        v-for="(item, idx) in (tarjetasExpandidas[lic.CodigoExterno] ? lic.Items.Listado : lic.Items.Listado.slice(0, 2))"
                        :key="idx"
                        class="bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                      >
                        <div class="space-y-0.5">
                          <div class="font-bold text-slate-900 flex items-center gap-1.5">
                            <span class="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px] tabular-nums">
                              {{ item.Cantidad }} {{ item.UnidadMedida || 'Unid.' }}
                            </span>
                            <span>{{ item.NombreProducto }}</span>
                          </div>
                          <p v-if="item.Descripcion" class="text-[11px] text-slate-600 line-clamp-1">
                            {{ item.Descripcion }}
                          </p>
                        </div>
                        <span v-if="item.Categoria" class="text-[10px] font-medium text-slate-500 shrink-0">
                          {{ item.Categoria }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Grilla de 4 Fechas y Condiciones Clave -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-slate-100 rounded-xl p-3 border border-slate-300">
                  <div>
                    <span class="text-[10px] font-bold uppercase text-slate-500 block">🛑 Cierre Ofertas</span>
                    <span class="font-extrabold text-slate-900 tabular-nums">{{ formatDateTime(lic.FechaCierre) }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold uppercase text-slate-500 block">❓ Fin Preguntas</span>
                    <span class="font-bold text-slate-800 tabular-nums">
                      {{ lic.Fechas?.FechaFinalPreguntas ? formatDateShort(lic.Fechas.FechaFinalPreguntas) : 'Ver en bases' }}
                    </span>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold uppercase text-slate-500 block">🏆 Adjudicación Est.</span>
                    <span class="font-bold text-slate-800 tabular-nums">
                      {{ lic.Fechas?.FechaEstimadaAdjudicacion ? formatDateShort(lic.Fechas.FechaEstimadaAdjudicacion) : 'Según cronograma' }}
                    </span>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold uppercase text-slate-500 block">📑 Plazo Contrato</span>
                    <span class="font-bold text-slate-800">
                      {{ lic.DuracionContratoTexto || 'Según bases' }}
                    </span>
                  </div>
                </div>

                <!-- Pie de Tarjeta: Motivos de Match y Acciones -->
                <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="text-[11px] font-bold text-slate-500 mr-0.5">Match:</span>
                    <span
                      v-for="(motivo, i) in (lic.motivosRecomendacion || []).slice(0, 4)"
                      :key="i"
                      class="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300"
                    >
                      ✓ {{ motivo }}
                    </span>
                  </div>

                  <div class="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      @click.stop="guardarRapido(lic)"
                      :class="estaGuardada(lic.CodigoExterno)
                        ? 'bg-amber-100 text-amber-900 border-amber-400'
                        : 'bg-slate-100 hover:bg-amber-50 text-slate-800 border-slate-300'"
                      class="px-3.5 py-2 rounded-lg border text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>{{ estaGuardada(lic.CodigoExterno) ? '⭐ En Pipeline' : '☆ Guardar' }}</span>
                    </button>

                    <button
                      type="button"
                      @click="verDetalle(lic)"
                      class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition shadow-xs"
                    >
                      Abrir Ficha e IA →
                    </button>
                  </div>
                </div>
              </div>
            </article>

            <!-- Paginación Inferior -->
            <div v-if="totalPaginas > 1" class="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <span class="text-xs text-slate-500 tabular-nums">
                Mostrando <strong>{{ (paginaActual - 1) * porPagina + 1 }}–{{ Math.min(paginaActual * porPagina, recomendadasFiltradas.length) }}</strong> de <strong>{{ recomendadasFiltradas.length }}</strong> licitaciones
              </span>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="paginaActual = Math.max(1, paginaActual - 1)"
                  :disabled="paginaActual <= 1"
                  class="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  ← Anterior
                </button>
                <span class="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 rounded-lg tabular-nums">
                  Página {{ paginaActual }} / {{ totalPaginas }}
                </span>
                <button
                  type="button"
                  @click="paginaActual = Math.min(totalPaginas, paginaActual + 1)"
                  :disabled="paginaActual >= totalPaginas"
                  class="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Siguiente →
                </button>
                <button
                  v-if="porPagina !== 9999"
                  type="button"
                  @click="porPagina = 9999; paginaActual = 1"
                  class="ml-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                >
                  Ver todas ({{ recomendadasFiltradas.length }})
                </button>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6">
            <p class="text-2xl mb-2">🏢</p>
            <p class="font-bold text-slate-800 text-sm">No se encontraron licitaciones con estos filtros</p>
            <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Prueba limpiando el filtro de palabra clave o calibra los servicios de tu empresa en Configuración.
            </p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../stores/authStore'
import { useLicitacionesStore } from '../stores/licitacionesStore'
import { usePerfilStore } from '../stores/perfilStore'

const authStore = useAuthStore()
const licitacionesStore = useLicitacionesStore()
const perfilStore = usePerfilStore()
const router = useRouter()

const totalActivas = ref(0)
const licitacionesRecomendadas = ref([])
const resumenMultiempresa = ref([])
const cargandoRecomendadas = ref(false)
const enriqueciendo = ref(false)
const tarjetasExpandidas = ref({})
const cargandoCodigos = ref({})

// Pestaña activa ('recomendadas' | 'urgentes' | 'guardadas')
const vistaActiva = ref('recomendadas')

// Controles para explorar TODO el listado de recomendadas
const filtroTexto = ref('')
const filtroTramo = ref('')
const filtroKeyword = ref('')
const ordenRecomendadas = ref('afinidad')
const porPagina = ref(15)
const paginaActual = ref(1)

const perfil = computed(() => perfilStore.perfil)
const licitacionesGuardadas = computed(() => licitacionesStore.licitacionesGuardadas)

const keywordsConConteo = computed(() => {
  const conteos = {}
  for (const lic of licitacionesRecomendadas.value) {
    const kws = lic.keywordsMatch || []
    for (const k of kws) {
      conteos[k] = (conteos[k] || 0) + 1
    }
  }
  return Object.entries(conteos)
    .map(([palabra, total]) => ({ palabra, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12)
})

const cierresUrgentesRecomendadas = computed(() => {
  return licitacionesRecomendadas.value
    .filter(l => l.DiasRestantes !== null && l.DiasRestantes >= 0 && l.DiasRestantes <= 4)
    .sort((a, b) => a.DiasRestantes - b.DiasRestantes)
})

const recomendadasFiltradas = computed(() => {
  let lista = vistaActiva.value === 'urgentes'
    ? [...cierresUrgentesRecomendadas.value]
    : [...licitacionesRecomendadas.value]

  if (filtroTexto.value.trim()) {
    const q = filtroTexto.value.trim().toLowerCase()
    lista = lista.filter(l =>
      (l.Nombre || '').toLowerCase().includes(q) ||
      (l.CodigoExterno || '').toLowerCase().includes(q) ||
      (l.NombreOrganismo || '').toLowerCase().includes(q)
    )
  }

  if (filtroTramo.value === 'AGIL') {
    lista = lista.filter(l => ['L1', 'E2', 'COT'].includes(l.Tipo))
  } else if (filtroTramo.value === 'LE') {
    lista = lista.filter(l => l.Tipo === 'LE')
  } else if (filtroTramo.value === 'MAYOR') {
    lista = lista.filter(l => ['LP', 'LQ', 'LR', 'LS'].includes(l.Tipo))
  }

  if (filtroKeyword.value) {
    const kw = filtroKeyword.value.toLowerCase()
    lista = lista.filter(l =>
      (l.keywordsMatch && l.keywordsMatch.includes(kw)) ||
      (l.Nombre || '').toLowerCase().includes(kw)
    )
  }

  if (ordenRecomendadas.value === 'cierre') {
    lista.sort((a, b) => (a.DiasRestantes ?? 999) - (b.DiasRestantes ?? 999))
  } else if (ordenRecomendadas.value === 'monto') {
    lista.sort((a, b) => (b.MontoEstimado || b.MontoMaximoEstimadoCLP || 0) - (a.MontoEstimado || a.MontoMaximoEstimadoCLP || 0))
  } else {
    lista.sort((a, b) => (b.scoreRecomendacion || 0) - (a.scoreRecomendacion || 0))
  }

  return lista
})

const totalPaginas = computed(() => {
  return Math.max(1, Math.ceil(recomendadasFiltradas.value.length / porPagina.value))
})

const recomendadasPaginadas = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina.value
  return recomendadasFiltradas.value.slice(inicio, inicio + porPagina.value)
})

const formatCurrency = (valor) => {
  if (!valor) return 'N/A'
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(valor)
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
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
}

const verDetalle = (licitacion) => {
  router.push({
    name: 'DetalleLicitacion',
    params: { codigo: licitacion.CodigoExterno },
    state: { licitacion }
  })
}

const irADetalleCodigo = (codigo, datosLicitacion) => {
  router.push({
    name: 'DetalleLicitacion',
    params: { codigo },
    state: { licitacion: datosLicitacion }
  })
}

const eliminarDeGuardadas = async (codigo) => {
  if (!authStore.usuarioId) return
  await licitacionesStore.eliminarGuardada(authStore.usuarioId, codigo)
  await cargarResumenMultiempresa()
}

const toggleExpandirTarjeta = async (codigo) => {
  tarjetasExpandidas.value[codigo] = !tarjetasExpandidas.value[codigo]
  const lic = licitacionesRecomendadas.value.find(l => l.CodigoExterno === codigo)
  if (tarjetasExpandidas.value[codigo] && lic && !lic.DetalleEnriquecido) {
    await enriquecerUnaLicitacion(codigo)
  }
}

const estaGuardada = (codigo) => {
  return (licitacionesGuardadas.value || []).some(g => g.codigoLicitacion === codigo)
}

const guardarRapido = async (lic) => {
  const uid = authStore.usuarioId || JSON.parse(localStorage.getItem('usuario') || '{}')?.id || 1
  if (estaGuardada(lic.CodigoExterno)) {
    await licitacionesStore.eliminarGuardada(uid, lic.CodigoExterno)
  } else {
    await axios.post('/api/licitaciones/guardar', {
      usuarioId: uid,
      perfilId: perfil.value?.id || 1,
      codigoLicitacion: licitacionCodigo(lic),
      datosLicitacion: lic,
      nivelMatch: lic.scoreRecomendacion || 85,
      etapaPipeline: 'evaluacion'
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    await licitacionesStore.obtenerLicitacionesGuardadas(uid)
  }
  await cargarResumenMultiempresa()
}

const licitacionCodigo = (lic) => lic.CodigoExterno

const cargarResumenMultiempresa = async () => {
  try {
    const res = await axios.get('/api/licitaciones/resumen-multiempresa', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    resumenMultiempresa.value = res.data || []
  } catch (e) {
    console.error('Error cargando resumen multiempresa:', e)
  }
}

const cambiarEmpresaDesdeRadar = async (id) => {
  if (!id || perfil.value?.id === id) return
  try {
    const res = await axios.put(`/api/perfil/activar/${Number(id)}`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    perfilStore.perfil = res.data
    window.dispatchEvent(new CustomEvent('perfiles-actualizados'))
  } catch (e) {
    console.error('Error cambiando empresa desde radar:', e)
  }
}

const exportarRecomendadasCSV = () => {
  const encabezados = [
    'Codigo', 'Afinidad %', 'Tipo', 'Nombre', 'Organismo', 'Region',
    'Monto Exacto CLP', 'Monto Maximo Tramo CLP', 'Fecha Cierre', 'Dias Restantes',
    'Palabras Clave Match', 'URL MercadoPublico'
  ]
  const filas = recomendadasFiltradas.value.map(lic => [
    lic.CodigoExterno,
    lic.scoreRecomendacion || 85,
    lic.Tipo || '',
    `"${(lic.Nombre || '').replace(/"/g, '""')}"`,
    `"${(lic.NombreOrganismo || '').replace(/"/g, '""')}"`,
    `"${(lic.RegionUnidad || '').replace(/"/g, '""')}"`,
    lic.MontoEstimado || '',
    lic.MontoMaximoEstimadoCLP || '',
    lic.FechaCierre || '',
    lic.DiasRestantes ?? '',
    `"${(lic.keywordsMatch || []).join(', ')}"`,
    `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${lic.CodigoExterno}`
  ].join(';'))

  const contenido = '\uFEFF' + [encabezados.join(';'), ...filas].join('\r\n')
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const empSlug = (perfil.value?.nombreEmpresa || 'empresa').toLowerCase().replace(/\s+/g, '-')
  a.download = `recomendadas-${empSlug}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const enriquecerUnaLicitacion = async (codigo) => {
  if (!codigo || cargandoCodigos.value[codigo]) return
  cargandoCodigos.value[codigo] = true
  try {
    const res = await axios.post('/api/licitaciones/enriquecer', { codigos: [codigo] }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    const det = res.data?.[codigo]
    if (det) {
      licitacionesRecomendadas.value = licitacionesRecomendadas.value.map(lic =>
        lic.CodigoExterno === codigo ? { ...lic, ...det } : lic
      )
    }
  } catch (e) {
    console.error('Error enriqueciendo licitación:', e)
  } finally {
    cargandoCodigos.value[codigo] = false
  }
}

const autoEnriquecerVisibles = async () => {
  const pendientes = recomendadasPaginadas.value
    .slice(0, 6)
    .filter(l => !l.DetalleEnriquecido && !cargandoCodigos.value[l.CodigoExterno])
    .map(l => l.CodigoExterno)

  if (pendientes.length === 0) return

  for (const cod of pendientes) {
    cargandoCodigos.value[cod] = true
  }

  try {
    const res = await axios.post('/api/licitaciones/enriquecer', { codigos: pendientes }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    const mapa = res.data || {}
    licitacionesRecomendadas.value = licitacionesRecomendadas.value.map(lic => {
      const det = mapa[lic.CodigoExterno]
      return det ? { ...lic, ...det } : lic
    })
  } catch (e) {
    console.error('Error en auto-enriquecimiento:', e)
  } finally {
    for (const cod of pendientes) {
      cargandoCodigos.value[cod] = false
    }
  }
}

const enriquecerPaginaActual = async () => {
  const codigos = recomendadasPaginadas.value.slice(0, 12).map(l => l.CodigoExterno)
  if (codigos.length === 0) return
  enriqueciendo.value = true
  try {
    const res = await axios.post('/api/licitaciones/enriquecer', { codigos }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    const mapa = res.data || {}
    licitacionesRecomendadas.value = licitacionesRecomendadas.value.map(lic => {
      const det = mapa[lic.CodigoExterno]
      return det ? { ...lic, ...det } : lic
    })
  } catch (e) {
    console.error('Error enriqueciendo recomendadas:', e)
  } finally {
    enriqueciendo.value = false
  }
}

const recargarRecomendadas = async () => {
  const uid = authStore.usuarioId || JSON.parse(localStorage.getItem('usuario') || '{}')?.id || 1
  cargandoRecomendadas.value = true
  paginaActual.value = 1
  filtroKeyword.value = ''
  try {
    const query = perfil.value?.id ? `?perfilId=${perfil.value.id}` : ''
    const res = await axios.get(`/api/licitaciones/recomendadas/${uid}${query}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    licitacionesRecomendadas.value = res.data?.Listado || []
    setTimeout(() => { autoEnriquecerVisibles() }, 150)
  } catch (e) {
    console.error('Error obteniendo recomendadas:', e)
  } finally {
    cargandoRecomendadas.value = false
  }
}

watch([paginaActual, filtroKeyword, filtroTramo, vistaActiva], () => {
  setTimeout(() => { autoEnriquecerVisibles() }, 150)
})

watch(() => perfil.value?.id, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await recargarRecomendadas()
  }
})

onMounted(async () => {
  if (authStore.usuarioId) {
    await perfilStore.obtenerPerfil(authStore.usuarioId)
    await licitacionesStore.obtenerLicitacionesGuardadas(authStore.usuarioId)
    await recargarRecomendadas()
    await cargarResumenMultiempresa()
  }
  const busq = await licitacionesStore.buscarLicitaciones({ estado: 'activas', pagina: 1, porPagina: 10 })
  totalActivas.value = busq?.Total || licitacionesStore.totalResultados || 0
})
</script>
