<template>
  <div class="space-y-5">
    <VistaTabs />
    <!-- Encabezado Compacto Superior -->
    <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white rounded-2xl px-6 py-4 shadow-sm border border-slate-300">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
            ChileCompra en Vivo
          </span>
          <span class="text-xs text-slate-500">Valor UTM ref: $66.600 CLP</span>
          <span
            v-if="licitacionesStore.licitaciones.length > 0"
            class="text-xs font-extrabold px-2.5 py-0.5 rounded-full border"
            :class="totalEnriquecidasPagina === licitacionesStore.licitaciones.length
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-amber-50 text-amber-800 border-amber-300'"
          >
            📑 {{ totalEnriquecidasPagina }}/{{ licitacionesStore.licitaciones.length }} fichas completas en página
          </span>
        </div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
          Explorador Inteligente de Licitaciones
        </h1>
        <p v-if="mensajeEstadoLote" class="text-xs font-bold text-indigo-700 mt-1 flex items-center gap-1.5">
          <span>✨</span> {{ mensajeEstadoLote }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <!-- Botón toggle filtros en móvil -->
        <button
          type="button"
          @click="mostrarSidebarMovil = !mostrarSidebarMovil"
          class="lg:hidden bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 flex items-center gap-1.5"
        >
          <span>🎛️</span> {{ mostrarSidebarMovil ? 'Ocultar Filtros' : 'Mostrar Filtros' }}
        </button>

        <div class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-1.5 text-right">
          <span class="text-[10px] uppercase font-bold text-slate-500 block leading-none">Resultados Activos</span>
          <span class="text-lg font-extrabold text-blue-600 tabular-nums">
            {{ licitacionesStore.totalResultados.toLocaleString('es-CL') }}
          </span>
        </div>

        <button
          v-if="perfil"
          type="button"
          @click="calcularMatchPaginaActual"
          :disabled="calculandoMatchLote || licitacionesStore.licitaciones.length === 0"
          class="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
          title="Calcula el % de compatibilidad con tu empresa activa para todas las tarjetas de esta página sin salir del listado"
        >
          <span>🤖</span>
          <span>{{ calculandoMatchLote ? `Calculando Match (${progresoMatchLote})...` : 'Calcular % Match en Página' }}</span>
        </button>

        <button
          type="button"
          @click="enriquecerPaginaActual"
          :disabled="cargandoDetallesLote || licitacionesStore.licitaciones.length === 0"
          class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2"
          title="Consulta en la API de MercadoPúblico el monto exacto, ítems solicitados, comprador y fechas clave de todas las tarjetas de esta página"
        >
          <span>{{ cargandoDetallesLote ? `⏳ Relevando fichas (${progresoLote}/${totalPorRelevar})...` : '⚡ Revelar Montos, Ítems y Fechas de esta página' }}</span>
        </button>
      </div>
    </div>

    <!-- Layout Principal: Sidebar Izquierda (Filtros) + Contenido Central (Licitaciones) -->
    <div class="flex flex-col lg:flex-row items-start gap-6">
      <!-- SIDEBAR DE FILTROS -->
      <aside
        :class="mostrarSidebarMovil ? 'block' : 'hidden lg:block'"
        class="w-full lg:w-80 xl:w-88 shrink-0 lg:sticky lg:top-20 bg-white rounded-2xl shadow-sm border border-slate-300 p-5 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto"
      >
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 class="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <span>🎛️</span> Filtros de Búsqueda
          </h2>
          <button
            type="button"
            @click="limpiar"
            class="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            Restablecer
          </button>
        </div>

        <!-- Selector Multi-Palabra Clave de Mi Perfil -->
        <div v-if="perfil" class="bg-purple-50/70 border border-purple-200 rounded-xl p-3 space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-1">
            <div>
              <span class="text-[11px] font-extrabold uppercase text-purple-900 block">
                🎯 {{ perfil.nombreEmpresa }}
              </span>
              <span class="text-[10px] font-semibold text-purple-700">
                {{ keywordsSeleccionadas.length > 0 ? `${keywordsSeleccionadas.length} de ${keywordsPerfil.length} seleccionadas` : 'Haz clic en 1 o varias etiquetas' }}
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                @click="aplicarFiltrosDeMiPerfil"
                class="text-[11px] font-extrabold bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-lg transition shadow-sm"
                title="Selecciona todas las palabras clave, tramos, región y exclusiones de tu empresa"
              >
                ✓ Todas ({{ keywordsPerfil.length }})
              </button>
              <button
                v-if="keywordsSeleccionadas.length > 0"
                type="button"
                @click="limpiarKeywordsSeleccionadas"
                class="text-[11px] font-bold bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-purple-200 px-2 py-1 rounded-lg transition"
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
                ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-100'"
              class="px-2 py-0.5 rounded-md text-[11px] font-semibold border transition flex items-center gap-1"
            >
              <span v-if="esKeywordSeleccionada(kw)" class="text-[10px]">✓</span>
              <span>{{ kw }}</span>
            </button>
          </div>
        </div>

        <!-- Búsqueda por Palabra Clave -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">
            Palabra Clave / Código
          </label>
          <input
            v-model="filtros.palabraClave"
            @keyup.enter="ejecutarBusqueda(1)"
            type="text"
            placeholder="Ej: software, aseo, 1001-17-LE26..."
            class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <!-- Tramos Rápidos en Píldoras -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">
            Tramo de Monto Máximo (UTM)
          </label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="tramo in tramosRapidos"
              :key="tramo.codigo"
              type="button"
              @click="seleccionarTramoRapido(tramo.codigo)"
              :class="filtros.tipo === tramo.codigo
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'"
              class="text-xs font-semibold px-2.5 py-2 rounded-lg border transition text-left truncate"
            >
              {{ tramo.label }}
            </button>
          </div>
        </div>

        <!-- Selector completo de Tipo -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">
            Tipo de Licitación Oficial
          </label>
          <select
            v-model="filtros.tipo"
            @change="ejecutarBusqueda(1)"
            class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Todos los Tipos</option>
            <option value="L1">L1 — Pública &lt; 100 UTM (~$6,6M)</option>
            <option value="LE">LE — Entre 100 y 1.000 UTM (~$66,6M)</option>
            <option value="LP">LP — Entre 1.000 y 2.000 UTM (~$133M)</option>
            <option value="LQ">LQ — Entre 2.000 y 5.000 UTM (~$333M)</option>
            <option value="LR">LR — Mayor a 5.000 UTM (&gt; $333M)</option>
            <option value="LS">LS — Servicios Especializados</option>
            <option value="E2,CO,B2,H2,I2">Licitaciones Privadas</option>
          </select>
        </div>

        <!-- Región -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">
            Región / Territorio
          </label>
          <select
            v-model="filtros.region"
            @change="ejecutarBusqueda(1)"
            class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">🇨🇱 Todo el País</option>
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

        <!-- Rango de Monto en CLP -->
        <div class="space-y-2 pt-1 border-t border-slate-100">
          <label class="block text-xs font-bold text-slate-700 uppercase">
            Rango de Presupuesto (CLP)
          </label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-semibold">Mínimo ($)</span>
              <input
                v-model.number="filtros.precioMin"
                type="number"
                step="1000000"
                placeholder="0"
                class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-semibold">Máximo ($)</span>
              <input
                v-model.number="filtros.precioMax"
                type="number"
                step="5000000"
                placeholder="Sin tope"
                class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <!-- Estado y Fecha -->
        <div class="space-y-3 pt-1 border-t border-slate-100">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">
              Estado
            </label>
            <select
              v-model="filtros.estado"
              @change="ejecutarBusqueda(1)"
              class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="activas">🟢 Todas las Activas en Chile</option>
              <option value="publicada">📢 Publicadas</option>
              <option value="cerrada">🔒 Cerradas</option>
              <option value="adjudicada">🏆 Adjudicadas</option>
              <option value="desierta">⚪ Desiertas</option>
              <option value="revocada">❌ Revocadas</option>
              <option value="suspendida">⏸️ Suspendidas</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">
              Fecha Publicación (Opcional)
            </label>
            <input
              v-model="filtros.fecha"
              type="date"
              class="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">
              Ordenar Resultados
            </label>
            <select
              v-model="filtros.ordenarPor"
              @change="ejecutarBusqueda(1)"
              class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="recientes_desc">🆕 Más nuevas primero (como Mercado Público)</option>
              <option value="cierre_asc">⏳ Cierre más próximo primero</option>
              <option value="cierre_desc">📅 Cierre más lejano primero</option>
              <option value="monto_desc">💰 Mayor Monto Máximo</option>
              <option value="monto_asc">💵 Menor Monto</option>
            </select>
          </div>
        </div>

        <!-- Checkbox Cierre Próximo -->
        <div class="pt-1">
          <label class="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              v-model="filtros.soloCierreProximo"
              @change="ejecutarBusqueda(1)"
              class="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>🔥 Solo cierres próximos (≤ 7 días)</span>
          </label>
        </div>

        <!-- Botón Principal Buscar -->
        <button
          type="button"
          @click="ejecutarBusqueda(1)"
          class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5"
        >
          <span>🔎</span> Aplicar Filtros
        </button>
      </aside>

      <!-- ÁREA CENTRAL DE RESULTADOS -->
      <section class="flex-1 min-w-0 w-full space-y-4">
        <!-- Estado de Carga -->
        <div v-if="licitacionesStore.loading" class="bg-white rounded-2xl p-14 text-center shadow-sm border border-slate-200">
          <div class="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p class="text-slate-700 font-bold">Consultando licitaciones en Mercado Público...</p>
          <p class="text-xs text-slate-400 mt-1">Procesando tramos UTM, montos máximos y fechas de cierre</p>
        </div>

        <!-- Listado de Tarjetas en el Centro -->
        <template v-else-if="licitacionesStore.licitaciones.length > 0">
          <div class="space-y-5">
            <div
              v-for="lic in licitacionesStore.licitaciones"
              :key="lic.CodigoExterno"
              class="card-elevated rounded-xl border-l-[6px] border-l-blue-600 transition-all overflow-hidden"
            >
              <!-- Fila superior oscura de alto contraste -->
              <div class="bg-slate-900 text-white px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded bg-blue-600 text-white">
                    {{ lic.CodigoExterno }}
                  </span>
                  <span
                    v-if="lic.Tipo"
                    class="text-xs font-bold px-2.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700"
                    :title="lic.DescripcionTipo"
                  >
                    {{ lic.Tipo }} · {{ lic.RangoUTM }}
                  </span>
                  <span
                    v-if="lic.DetalleEnriquecido"
                    class="text-[11px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  >
                    ✓ Ficha Relevada
                  </span>
                  <span v-if="lic.NombreOrganismo" class="text-xs font-semibold text-slate-200 bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700 truncate max-w-xs">
                    🏛️ {{ lic.NombreOrganismo }}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <!-- Badge de % Match IA si ya fue calculado -->
                  <span
                    v-if="matchesTarjeta[lic.CodigoExterno]"
                    class="text-xs font-extrabold px-2.5 py-0.5 rounded-full border shadow-sm tabular-nums"
                    :class="getMatchBadgeClass(matchesTarjeta[lic.CodigoExterno].nivelMatch)"
                  >
                    🎯 {{ matchesTarjeta[lic.CodigoExterno].nivelMatch }}% Match IA
                  </span>

                  <span
                    :class="getBadgeDiasClass(lic.DiasRestantes)"
                    class="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  >
                    {{ formatDiasRestantes(lic.DiasRestantes) }}
                  </span>
                  <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                    {{ lic.Estado || 'Publicada' }}
                  </span>
                </div>
              </div>

              <!-- Cuerpo Central de la Tarjeta: Título + Panel de Montos y Fechas -->
              <div class="p-5 bg-white">
                <div class="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <h3
                      @click="verDetalle(lic)"
                      class="font-extrabold text-slate-900 text-base sm:text-lg leading-snug hover:text-blue-600 cursor-pointer"
                    >
                      {{ lic.Nombre }}
                    </h3>

                    <!-- Resumen de lo requerido (Descripción de la ficha) -->
                    <div v-if="lic.Descripcion" class="mt-2 bg-slate-50 border border-slate-200/90 rounded-xl p-3">
                      <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                        📝 Resumen del Requerimiento Oficial
                      </span>
                      <p class="text-xs text-slate-700 leading-relaxed line-clamp-3">
                        {{ lic.Descripcion }}
                      </p>
                    </div>

                    <!-- Metadatos de Ubicación, Unidad, Plazo y Forma de Pago -->
                    <div class="text-xs text-slate-600 mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      <span>📍 <strong class="text-slate-800">{{ lic.RegionUnidad || 'Chile' }}</strong> {{ lic.ComunaUnidad ? `(${lic.ComunaUnidad})` : '' }}</span>
                      <span v-if="lic.UnidadCompra">🏢 Unidad: <strong class="text-slate-800">{{ lic.UnidadCompra }}</strong></span>
                      <span v-if="lic.TiempoDuracionContrato">🗓️ Contrato: <strong class="text-slate-800">{{ lic.TiempoDuracionContrato }} mes(es)</strong></span>
                      <span v-if="lic.ModalidadPagoTexto && lic.DetalleEnriquecido">💳 {{ lic.ModalidadPagoTexto }}</span>
                      <span v-if="lic.CantidadReclamos !== null && lic.CantidadReclamos !== undefined" class="text-slate-500">
                        ⚖️ Reclamos institución: <strong>{{ lic.CantidadReclamos }}</strong>
                      </span>
                    </div>

                    <!-- Ítems Solicitados revelados desde la Ficha -->
                    <div
                      v-if="lic.Items?.Listado?.length > 0"
                      class="mt-3 pt-2.5 border-t border-slate-100"
                    >
                      <span class="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 block mb-1.5">
                        📦 Líneas de Ítems Solicitados ({{ lic.Items.Cantidad || lic.Items.Listado.length }}):
                      </span>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        <div
                          v-for="(item, idx) in lic.Items.Listado.slice(0, 4)"
                          :key="idx"
                          class="bg-indigo-50/50 border border-indigo-100 rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between gap-2"
                        >
                          <span class="font-semibold text-slate-800 truncate" :title="item.Descripcion || item.NombreProducto">
                            • {{ item.NombreProducto || item.Descripcion }}
                          </span>
                          <span class="shrink-0 font-mono font-bold text-[11px] bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-900">
                            {{ item.Cantidad }} {{ item.UnidadMedida || 'unid.' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Caja Derecha de Monto Máximo / Presupuesto Oficial -->
                  <div
                    class="xl:w-68 shrink-0 rounded-xl p-3.5 border-2 xl:text-right"
                    :class="lic.MontoExactoDisponible
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : lic.DetalleEnriquecido
                        ? 'bg-amber-50/60 border-amber-300'
                        : 'bg-slate-100 border-slate-300'"
                  >
                    <span
                      class="text-[10px] font-extrabold uppercase tracking-wider block"
                      :class="lic.MontoExactoDisponible ? 'text-emerald-800' : lic.DetalleEnriquecido ? 'text-amber-900' : 'text-slate-500'"
                    >
                      {{ lic.MontoExactoDisponible
                        ? '💰 Presupuesto Oficial Exacto'
                        : lic.DetalleEnriquecido
                          ? '🔒 Monto Reservado en Ficha (' + (lic.Tipo || 'MP') + ')'
                          : '📊 Tope Referencial Tramo (' + (lic.Tipo || 'MP') + ')'
                      }}
                    </span>
                    <p v-if="lic.MontoExactoDisponible" class="text-base font-extrabold text-emerald-700 mt-0.5 tabular-nums">
                      {{ formatCurrency(lic.MontoEstimado, lic.Moneda) }}
                    </p>
                    <p v-else-if="lic.MontoMaximoEstimadoCLP" class="text-base font-extrabold text-slate-900 mt-0.5 tabular-nums">
                      Hasta {{ formatCurrency(lic.MontoMaximoEstimadoCLP) }}
                    </p>
                    <p v-else class="text-sm font-bold text-slate-800 mt-0.5">
                      {{ lic.RangoUTM || 'Mayor a 5.000 UTM (> $333M)' }}
                    </p>
                    <span class="text-[11px] text-slate-600 block mt-0.5">
                      {{ lic.MontoExactoDisponible
                        ? (lic.TipoEstimacionTexto || 'Monto exacto verificado en ficha')
                        : lic.DetalleEnriquecido
                          ? 'Organismo reservó presupuesto (Piso: ' + formatCurrency(lic.MontoMinimoEstimadoCLP || 0) + ')'
                          : 'Piso tramo: ' + formatCurrency(lic.MontoMinimoEstimadoCLP || 0)
                      }}
                    </span>
                  </div>
                </div>

                <!-- PANEL DESPLEGABLE INLINE DE MATCH IA (Sin salir de /licitaciones) -->
                <div
                  v-if="matchesTarjeta[lic.CodigoExterno] && mostrarPanelMatch[lic.CodigoExterno]"
                  class="mt-4 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white rounded-xl p-4 border border-purple-400/30 shadow-md"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                    <div class="flex items-center gap-3">
                      <div class="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-center">
                        <span class="text-[10px] uppercase font-bold text-purple-200 block">Compatibilidad</span>
                        <span class="text-xl font-extrabold text-emerald-400 tabular-nums">
                          {{ matchesTarjeta[lic.CodigoExterno].nivelMatch }}%
                        </span>
                      </div>
                      <div>
                        <h4 class="text-sm font-extrabold text-white">
                          🤖 Diagnóstico de Match IA para {{ perfil?.nombreEmpresa }}
                        </h4>
                        <p class="text-[11px] text-purple-200">
                          Evaluación instantánea de rubro, palabras clave, presupuesto y ubicación
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      @click="mostrarPanelMatch[lic.CodigoExterno] = false"
                      class="text-xs font-bold text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/10"
                    >
                      ✕ Ocultar
                    </button>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs">
                    <div class="bg-white/5 rounded-lg p-3 border border-emerald-400/20">
                      <span class="font-extrabold text-emerald-300 uppercase text-[10px] block mb-1">✅ Fortalezas</span>
                      <ul class="space-y-1 text-slate-200">
                        <li
                          v-for="(f, i) in (matchesTarjeta[lic.CodigoExterno].fortalezas || []).slice(0, 3)"
                          :key="i"
                        >
                          • {{ f }}
                        </li>
                      </ul>
                    </div>

                    <div class="bg-white/5 rounded-lg p-3 border border-amber-400/20">
                      <span class="font-extrabold text-amber-300 uppercase text-[10px] block mb-1">⚠️ Puntos de Atención</span>
                      <ul class="space-y-1 text-slate-200">
                        <li
                          v-for="(d, i) in (matchesTarjeta[lic.CodigoExterno].debilidades || []).slice(0, 3)"
                          :key="i"
                        >
                          • {{ d }}
                        </li>
                      </ul>
                    </div>

                    <div class="bg-white/5 rounded-lg p-3 border border-blue-400/20">
                      <span class="font-extrabold text-blue-300 uppercase text-[10px] block mb-1">💡 Recomendación</span>
                      <ul class="space-y-1 text-slate-200">
                        <li
                          v-for="(r, i) in (matchesTarjeta[lic.CodigoExterno].recomendaciones || []).slice(0, 2)"
                          :key="i"
                        >
                          • {{ r }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <!-- Barra Inferior: Fechas Clave + Botones de Acción -->
                <div class="mt-3.5 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex flex-wrap items-center gap-3 text-xs">
                    <div class="bg-blue-50/70 border border-blue-200 px-3 py-1.5 rounded-lg">
                      <span class="text-[10px] uppercase font-bold text-blue-700 mr-1.5">🛑 Cierre Ofertas:</span>
                      <span class="font-bold text-slate-900">{{ formatDateTime(lic.FechaCierre) }}</span>
                    </div>
                    <div v-if="lic.FechaPublicacion || lic.Fechas?.FechaPublicacion" class="text-slate-600">
                      <span class="text-[10px] uppercase font-bold text-slate-400 mr-1">📢 Publicada:</span>
                      <span class="font-semibold">{{ formatDateShort(lic.FechaPublicacion || lic.Fechas?.FechaPublicacion) }}</span>
                    </div>
                    <div v-if="lic.Fechas?.FechaFinalPreguntas" class="text-slate-600">
                      <span class="text-[10px] uppercase font-bold text-slate-400 mr-1">❓ Fin Preguntas:</span>
                      <span class="font-semibold">{{ formatDateShort(lic.Fechas.FechaFinalPreguntas) }}</span>
                    </div>
                    <div v-if="lic.Fechas?.FechaEstimadaAdjudicacion" class="text-slate-600">
                      <span class="text-[10px] uppercase font-bold text-slate-400 mr-1">🏆 Adjudicación:</span>
                      <span class="font-semibold">{{ formatDateShort(lic.Fechas.FechaEstimadaAdjudicacion) }}</span>
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      v-if="!lic.DetalleEnriquecido"
                      type="button"
                      @click="cargarFichaRapida(lic.CodigoExterno)"
                      :disabled="licitacionesStore.enriqueciendoCodigos[lic.CodigoExterno]"
                      class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-xl transition border border-slate-300"
                      title="Extraer monto exacto, organismo, ítems y todas las fechas sin salir de la lista"
                    >
                      {{ licitacionesStore.enriqueciendoCodigos[lic.CodigoExterno] ? '⏳ Relevando...' : '⚡ Ficha Rápida' }}
                    </button>

                    <button
                      v-if="perfil"
                      type="button"
                      @click="analizarMatchInline(lic)"
                      :disabled="calculandoMatchCodigo[lic.CodigoExterno]"
                      class="text-xs font-extrabold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                      :class="matchesTarjeta[lic.CodigoExterno]
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'"
                    >
                      <span>🤖</span>
                      <span v-if="calculandoMatchCodigo[lic.CodigoExterno]">⏳ Calculando...</span>
                      <span v-else-if="matchesTarjeta[lic.CodigoExterno]">
                        {{ matchesTarjeta[lic.CodigoExterno].nivelMatch }}% Match IA {{ mostrarPanelMatch[lic.CodigoExterno] ? '▲' : '▼' }}
                      </span>
                      <span v-else>Match IA</span>
                    </button>

                    <button
                      type="button"
                      @click="verDetalle(lic)"
                      class="bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded-xl transition flex items-center gap-1.5"
                    >
                      <span>📋</span> Ver Detalle Completo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Paginación -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <p class="text-xs text-slate-600">
              Mostrando página <span class="font-bold text-slate-900">{{ licitacionesStore.paginaActual }}</span>
              de <span class="font-bold text-slate-900">{{ licitacionesStore.totalPaginas }}</span>
              ({{ licitacionesStore.totalResultados.toLocaleString('es-CL') }} licitaciones totales)
            </p>

            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="cambiarPagina(licitacionesStore.paginaActual - 1)"
                :disabled="licitacionesStore.paginaActual <= 1"
                class="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50"
              >
                ← Anterior
              </button>
              <span class="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs">
                {{ licitacionesStore.paginaActual }} / {{ licitacionesStore.totalPaginas }}
              </span>
              <button
                type="button"
                @click="cambiarPagina(licitacionesStore.paginaActual + 1)"
                :disabled="licitacionesStore.paginaActual >= licitacionesStore.totalPaginas"
                class="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </template>

        <!-- Sin Resultados -->
        <div v-else class="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
          <p class="text-3xl mb-2">🔍</p>
          <h3 class="text-lg font-bold text-slate-800">No se encontraron licitaciones con estos criterios</h3>
          <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Intenta ampliar el rango de monto máximo en la barra lateral, seleccionar "Todo el País" o limpiar las palabras clave.
          </p>
          <button
            type="button"
            @click="limpiar"
            class="mt-4 bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition"
          >
            Restablecer búsqueda nacional
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
import VistaTabs from '../components/VistaTabs.vue'

const router = useRouter()
const licitacionesStore = useLicitacionesStore()
const perfilStore = usePerfilStore()
const authStore = useAuthStore()
const iaStore = useIaStore()

const cargandoDetallesLote = ref(false)
const progresoLote = ref(0)
const totalPorRelevar = ref(0)
const mensajeEstadoLote = ref('')
const mostrarSidebarMovil = ref(false)

// Estado para cálculo de Match IA inline en cada tarjeta (sin salir de /licitaciones)
const matchesTarjeta = reactive({})
const mostrarPanelMatch = reactive({})
const calculandoMatchCodigo = reactive({})
const calculandoMatchLote = ref(false)
const progresoMatchLote = ref('')

const tramosRapidos = [
  { codigo: '', label: 'Todos los tramos' },
  { codigo: 'L1', label: 'L1 (< $6,6M)' },
  { codigo: 'LE', label: 'LE ($6,6M-$66M)' },
  { codigo: 'LP', label: 'LP ($66M-$133M)' },
  { codigo: 'LQ', label: 'LQ ($133M-$333M)' },
  { codigo: 'LR', label: 'LR (> $333M)' }
]

const filtros = ref({
  estado: 'activas',
  tipo: '',
  region: '',
  palabraClave: '',
  palabrasExcluidas: '',
  fecha: '',
  precioMin: null,
  precioMax: null,
  soloCierreProximo: false,
  ordenarPor: 'recientes_desc',
  pagina: 1,
  porPagina: 20
})

const perfil = computed(() => perfilStore.perfil)
const keywordsSeleccionadas = ref([])

const totalEnriquecidasPagina = computed(() => {
  return licitacionesStore.licitaciones.filter(l => l.DetalleEnriquecido).length
})

const keywordsPerfil = computed(() => {
  if (!perfil.value?.servicios) return []
  return perfil.value.servicios.split(/[,;.\n]+/).map(s => s.trim()).filter(Boolean)
})

const esKeywordSeleccionada = (kw) => {
  return keywordsSeleccionadas.value.some(k => k.toLowerCase() === kw.toLowerCase())
}

// Limpiar matches y etiquetas seleccionadas si cambia la empresa activa en el selector global
watch(() => perfil.value?.id, () => {
  Object.keys(matchesTarjeta).forEach(k => delete matchesTarjeta[k])
  Object.keys(mostrarPanelMatch).forEach(k => delete mostrarPanelMatch[k])
  keywordsSeleccionadas.value = []
  filtros.value.palabrasExcluidas = perfil.value?.palabrasExcluidas || ''
})

const filtrarPorKeywordPerfil = async (kw) => {
  const idx = keywordsSeleccionadas.value.findIndex(k => k.toLowerCase() === kw.toLowerCase())
  if (idx !== -1) {
    keywordsSeleccionadas.value.splice(idx, 1)
  } else {
    keywordsSeleccionadas.value.push(kw)
  }
  filtros.value.palabrasExcluidas = perfil.value?.palabrasExcluidas || ''
  await ejecutarBusqueda(1)
}

const limpiarKeywordsSeleccionadas = async () => {
  keywordsSeleccionadas.value = []
  await ejecutarBusqueda(1)
}

const seleccionarTramoRapido = (codigo) => {
  filtros.value.tipo = codigo
  ejecutarBusqueda(1)
}

const ejecutarBusqueda = async (pagina = 1) => {
  mensajeEstadoLote.value = ''
  filtros.value.pagina = pagina
  const payload = {
    ...filtros.value,
    palabrasClave: [...keywordsSeleccionadas.value]
  }
  if (payload.region) {
    payload.regiones = [payload.region]
  } else {
    payload.regiones = []
  }
  await licitacionesStore.buscarLicitaciones(payload)
}

const cambiarPagina = async (nuevaPagina) => {
  if (nuevaPagina < 1 || nuevaPagina > licitacionesStore.totalPaginas) return
  await ejecutarBusqueda(nuevaPagina)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const limpiar = async () => {
  keywordsSeleccionadas.value = []
  filtros.value = {
    estado: 'activas',
    tipo: '',
    region: '',
    palabraClave: '',
    palabrasExcluidas: '',
    fecha: '',
    precioMin: null,
    precioMax: null,
    soloCierreProximo: false,
    ordenarPor: 'recientes_desc',
    pagina: 1,
    porPagina: 20
  }
  await ejecutarBusqueda(1)
}

const aplicarFiltrosDeMiPerfil = async () => {
  if (!perfil.value) return
  keywordsSeleccionadas.value = [...keywordsPerfil.value]
  const primeraReg = (!perfil.value.coberturaNacional && perfil.value.regiones)
    ? (perfil.value.regiones || '').split(',')[0]?.trim() || ''
    : ''
  filtros.value.palabraClave = ''
  filtros.value.palabrasExcluidas = perfil.value.palabrasExcluidas || ''
  filtros.value.region = primeraReg
  filtros.value.tipo = perfil.value.tiposLicitacion || ''
  filtros.value.precioMin = perfil.value.presupuestoMinimo ? Number(perfil.value.presupuestoMinimo) : null
  filtros.value.precioMax = perfil.value.presupuestoMaximo ? Number(perfil.value.presupuestoMaximo) : null
  await ejecutarBusqueda(1)
}

const cargarFichaRapida = async (codigo) => {
  await licitacionesStore.enriquecerLicitacionIndividual(codigo)
}

// Revelar montos, ítems y fechas de TODA la página actual con progreso en vivo
const enriquecerPaginaActual = async () => {
  cargandoDetallesLote.value = true
  mensajeEstadoLote.value = ''
  try {
    const pendientes = licitacionesStore.licitaciones
      .filter(l => !l.DetalleEnriquecido)
      .map(l => l.CodigoExterno)

    if (pendientes.length === 0) {
      mensajeEstadoLote.value = `¡Las ${licitacionesStore.licitaciones.length} licitaciones de esta página ya tienen su ficha oficial, montos, fechas e ítems relevados!`
      setTimeout(() => { mensajeEstadoLote.value = '' }, 5000)
      return
    }

    totalPorRelevar.value = pendientes.length
    progresoLote.value = 0

    // Procesar en bloques de 4 para actualizar la interfaz progresivamente
    const tamanoBloque = 4
    for (let i = 0; i < pendientes.length; i += tamanoBloque) {
      const bloque = pendientes.slice(i, i + tamanoBloque)
      await licitacionesStore.enriquecerLote(bloque)
      progresoLote.value = Math.min(pendientes.length, i + bloque.length)
    }

    const conMontoExacto = licitacionesStore.licitaciones.filter(l => l.MontoExactoDisponible).length
    mensajeEstadoLote.value = `Se relevaron ${pendientes.length} fichas oficiales (${conMontoExacto} informan presupuesto exacto y ${licitacionesStore.licitaciones.length - conMontoExacto} mantienen presupuesto reservado por tramo).`
    setTimeout(() => { mensajeEstadoLote.value = '' }, 7000)
  } finally {
    cargandoDetallesLote.value = false
  }
}

// Calcular % Match IA inline de forma instantánea (< 15ms) sin bloquear por API externa
const analizarMatchInline = async (lic) => {
  const codigo = lic.CodigoExterno
  if (matchesTarjeta[codigo]) {
    mostrarPanelMatch[codigo] = !mostrarPanelMatch[codigo]
    return
  }

  calculandoMatchCodigo[codigo] = true
  try {
    // 1. Cálculo instantáneo con los datos disponibles en pantalla
    const res = await iaStore.analizarMatch(perfil.value || {}, lic)
    const pb = res.puntosBlind || res
    matchesTarjeta[codigo] = {
      nivelMatch: res.nivelMatch ?? pb.nivelMatch ?? 72,
      fortalezas: pb.fortalezas || pb.puntosFuertes || ['Compatible con el perfil de tu empresa'],
      debilidades: pb.debilidades || pb.puntosDebiles || ['Revisar bases administrativas para requisitos específicos'],
      recomendaciones: pb.recomendaciones || ['Descargar ficha y simular oferta económica']
    }
    mostrarPanelMatch[codigo] = true

    // 2. Si aún no tenía ficha completa, relevar en segundo plano sin bloquear y refinar el diagnóstico
    if (!lic.DetalleEnriquecido) {
      licitacionesStore.enriquecerLicitacionIndividual(codigo).then(async (enriquecida) => {
        if (enriquecida) {
          const resRefinado = await iaStore.analizarMatch(perfil.value || {}, enriquecida)
          const pbRef = resRefinado.puntosBlind || resRefinado
          matchesTarjeta[codigo] = {
            nivelMatch: resRefinado.nivelMatch ?? pbRef.nivelMatch ?? matchesTarjeta[codigo].nivelMatch,
            fortalezas: pbRef.fortalezas || pbRef.puntosFuertes || matchesTarjeta[codigo].fortalezas,
            debilidades: pbRef.debilidades || pbRef.puntosDebiles || matchesTarjeta[codigo].debilidades,
            recomendaciones: pbRef.recomendaciones || matchesTarjeta[codigo].recomendaciones
          }
        }
      }).catch(() => {})
    }
  } catch (err) {
    console.error('Error calculando match inline:', err)
  } finally {
    calculandoMatchCodigo[codigo] = false
  }
}

// Calcular % Match IA para todas las tarjetas de la página actual en paralelo (< 30ms)
const calcularMatchPaginaActual = async () => {
  if (!perfil.value || licitacionesStore.licitaciones.length === 0) return
  calculandoMatchLote.value = true
  try {
    const lista = licitacionesStore.licitaciones
    await Promise.all(
      lista.map(async (lic) => {
        if (!matchesTarjeta[lic.CodigoExterno]) {
          const res = await iaStore.analizarMatch(perfil.value, lic)
          const pb = res.puntosBlind || res
          matchesTarjeta[lic.CodigoExterno] = {
            nivelMatch: res.nivelMatch ?? pb.nivelMatch ?? 72,
            fortalezas: pb.fortalezas || pb.puntosFuertes || [],
            debilidades: pb.debilidades || pb.puntosDebiles || [],
            recomendaciones: pb.recomendaciones || []
          }
        }
      })
    )
    mensajeEstadoLote.value = `¡Se calculó instantáneamente el % Match IA para las ${lista.length} licitaciones de esta página!`
    setTimeout(() => { mensajeEstadoLote.value = '' }, 5000)
  } finally {
    calculandoMatchLote.value = false
    progresoMatchLote.value = ''
  }
}

const getMatchBadgeClass = (nivel) => {
  if (nivel >= 75) return 'bg-emerald-500 text-slate-950 border-emerald-300'
  if (nivel >= 55) return 'bg-amber-400 text-slate-950 border-amber-200'
  return 'bg-rose-500 text-white border-rose-400'
}

const verDetalle = (licitacion) => {
  router.push({
    name: 'DetalleLicitacion',
    params: { codigo: licitacion.CodigoExterno },
    state: { licitacion }
  })
}

const formatCurrency = (valor, moneda = 'CLP') => {
  if (valor === null || valor === undefined || valor === 0) return 'No informado'
  if (moneda === 'UTM') return `${Number(valor).toLocaleString('es-CL')} UTM`
  if (moneda === 'UF' || moneda === 'CLF') return `${Number(valor).toLocaleString('es-CL')} UF`
  if (moneda === 'USD') return `US$ ${Number(valor).toLocaleString('es-CL')}`
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(valor)
}

const formatDateTime = (fecha) => {
  if (!fecha) return 'No informada'
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return fecha
  return d.toLocaleString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDateShort = (fecha) => {
  if (!fecha) return 'N/A'
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return fecha
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatDiasRestantes = (dias) => {
  if (dias === null || dias === undefined) return 'En curso'
  if (dias < 0) return 'Cerrada'
  if (dias === 0) return '⚠️ Cierra HOY'
  if (dias === 1) return '⏰ Cierra mañana'
  return `⏳ Quedan ${dias} días`
}

const getBadgeDiasClass = (dias) => {
  if (dias === null || dias === undefined) return 'bg-slate-100 text-slate-600'
  if (dias < 0) return 'bg-slate-200 text-slate-600'
  if (dias <= 2) return 'bg-rose-100 text-rose-700 border border-rose-200'
  if (dias <= 5) return 'bg-amber-100 text-amber-800 border border-amber-200'
  return 'bg-blue-50 text-blue-700 border border-blue-200'
}

onMounted(async () => {
  await ejecutarBusqueda(1)
  if (authStore.usuarioId) {
    await perfilStore.obtenerPerfil(authStore.usuarioId)
  }
})
</script>
