<template>
  <div class="space-y-6">
    <!-- Barra Superior de Navegación y Acciones -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <button
        @click="$router.back()"
        class="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm transition"
      >
        <span>←</span> Volver al listado
      </button>

      <div v-if="licitacion" class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          @click="descargarICS"
          class="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-extrabold px-3.5 py-2.5 rounded-xl border border-indigo-200 transition flex items-center gap-1.5"
        >
          <span>📅</span> Agendar Hitos (.ics)
        </button>
        <a
          :href="`https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${licitacion.CodigoExterno}`"
          target="_blank"
          rel="noopener"
          class="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-300 transition flex items-center gap-1.5"
        >
          <span>🌐</span> Abrir Ficha en MercadoPúblico.cl ↗
        </a>
        <button
          @click="guardarEnSeguimiento"
          :disabled="guardando"
          class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          <span>{{ guardadaExito ? '✅ Guardada en Pipeline CRM' : '⭐ Guardar en Pipeline CRM' }}</span>
        </button>
      </div>
    </div>

    <!-- Estado Cargando Detalle -->
    <div v-if="cargandoDetalle && !licitacion" class="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
      <div class="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p class="font-bold text-slate-800">Recuperando ficha oficial de Mercado Público ({{ route.params.codigo }})...</p>
      <p class="text-xs text-slate-500 mt-1">Consultando cronograma de fechas, montos máximos, comprador e ítems licitados</p>
    </div>

    <div v-else-if="licitacion" class="space-y-6">
      <!-- Banner Principal de la Licitación -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-mono text-xs font-extrabold px-3 py-1 rounded-lg bg-slate-900 text-white">
              {{ licitacion.CodigoExterno }}
            </span>
            <span class="text-xs font-bold px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              {{ licitacion.DescripcionTipo || `Tipo ${licitacion.Tipo}` }}
            </span>
            <span class="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              {{ licitacion.Estado || 'Publicada' }}
            </span>
            <span v-if="licitacion.Convocatoria" class="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
              Convocatoria {{ licitacion.Convocatoria }}
            </span>
          </div>

          <div v-if="licitacion.DiasRestantes !== null && licitacion.DiasRestantes !== undefined">
            <span
              :class="licitacion.DiasRestantes <= 3 ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'"
              class="text-xs font-extrabold px-3 py-1.5 rounded-full border"
            >
              {{ licitacion.DiasRestantes < 0 ? 'Proceso Cerrado' : `⏳ Cierra en ${licitacion.DiasRestantes} días` }}
            </span>
          </div>
        </div>

        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug mb-3">
          {{ licitacion.Nombre }}
        </h1>

        <p v-if="licitacion.Descripcion" class="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80 mb-6">
          {{ licitacion.Descripcion }}
        </p>

        <!-- Tarjetas de Resumen Financiero y Contractual (Monto Exacto, Monto Máximo Tramo, Pago y Duración) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200 rounded-xl p-4">
            <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
              💰 Presupuesto / Monto Estimado
            </span>
            <p class="text-lg font-extrabold text-emerald-900 mt-1">
              {{ licitacion.MontoExactoDisponible ? formatCurrency(licitacion.MontoEstimado, licitacion.Moneda) : 'Reservado en Bases' }}
            </p>
            <p class="text-xs text-emerald-700 mt-0.5">
              {{ licitacion.TipoEstimacionTexto || 'Según bases administrativas' }}
            </p>
          </div>

          <div class="bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200 rounded-xl p-4">
            <span class="text-[11px] font-bold uppercase tracking-wider text-blue-800 block">
              📊 Monto Máximo Tramo ({{ licitacion.Tipo || 'Oficial' }})
            </span>
            <p class="text-lg font-extrabold text-blue-900 mt-1">
              {{ licitacion.MontoMaximoEstimadoCLP ? 'Hasta ' + formatCurrency(licitacion.MontoMaximoEstimadoCLP) : '> $333.000.000' }}
            </p>
            <p class="text-xs text-blue-700 mt-0.5">
              Rango Legal: {{ licitacion.RangoUTM || 'Según Ley 19.886' }}
            </p>
          </div>

          <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              💳 Modalidad de Pago y Financiamiento
            </span>
            <p class="text-sm font-extrabold text-slate-800 mt-1">
              {{ licitacion.ModalidadPagoTexto || 'Pago a 30 días' }}
            </p>
            <p class="text-xs text-slate-500 mt-0.5 truncate" :title="licitacion.FuenteFinanciamiento">
              Fuente: {{ licitacion.FuenteFinanciamiento || 'Presupuesto Institucional' }}
            </p>
          </div>

          <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              📑 Duración y Condiciones
            </span>
            <p class="text-sm font-extrabold text-slate-800 mt-1">
              Plazo: {{ licitacion.DuracionContratoTexto || 'Según bases' }}
            </p>
            <p class="text-xs text-slate-500 mt-0.5">
              Subcontratación: {{ licitacion.SubContratacion ? 'Permitida' : 'Restringida' }} ·
              {{ licitacion.EsRenovable ? 'Renovable' : 'No renovable' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Cronograma Completo de Fechas Clave -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span>📅</span> Cronograma de Fechas Clave de la Licitación
          </h2>
          <span v-if="cargandoDetalle" class="text-xs text-blue-600 font-semibold animate-pulse">
            Actualizando fechas desde API...
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            v-for="(hito, idx) in hitosFechas"
            :key="idx"
            :class="hito.destacado ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-200' : 'bg-slate-50 border-slate-200'"
            class="rounded-xl p-3.5 border transition"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-[11px] font-bold uppercase tracking-wider" :class="hito.destacado ? 'text-blue-800' : 'text-slate-500'">
                {{ hito.icono }} {{ hito.titulo }}
              </span>
              <span v-if="hito.pasado" class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                Cumplido
              </span>
            </div>
            <p class="text-sm font-bold" :class="hito.destacado ? 'text-blue-950' : 'text-slate-800'">
              {{ hito.valorFormateado }}
            </p>
          </div>
        </div>
      </div>

      <!-- Datos del Organismo Comprador y Unidad de Compra -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-1">
          <h2 class="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <span>🏛️</span> Organismo Comprador
          </h2>
          <dl class="space-y-3 text-xs">
            <div>
              <dt class="text-slate-400 font-semibold uppercase">Institución</dt>
              <dd class="font-bold text-slate-800 text-sm mt-0.5">{{ licitacion.NombreOrganismo || 'No especificado' }}</dd>
            </div>
            <div>
              <dt class="text-slate-400 font-semibold uppercase">Unidad de Compra / RUT</dt>
              <dd class="font-semibold text-slate-700 mt-0.5">{{ licitacion.NombreUnidad || 'N/A' }} ({{ licitacion.RutUnidad || 'S/R' }})</dd>
            </div>
            <div>
              <dt class="text-slate-400 font-semibold uppercase">Ubicación</dt>
              <dd class="font-semibold text-slate-700 mt-0.5">
                {{ licitacion.DireccionUnidad || '' }} — {{ licitacion.ComunaUnidad || '' }}, {{ licitacion.RegionUnidad || 'Chile' }}
              </dd>
            </div>
            <div v-if="licitacion.NombreResponsableContrato || licitacion.NombreUsuario">
              <dt class="text-slate-400 font-semibold uppercase">Contacto / Responsable</dt>
              <dd class="font-semibold text-slate-700 mt-0.5">
                {{ licitacion.NombreResponsableContrato || licitacion.NombreUsuario }}
                <span v-if="licitacion.EmailResponsableContrato" class="block text-blue-600">{{ licitacion.EmailResponsableContrato }}</span>
              </dd>
            </div>
            <div>
              <dt class="text-slate-400 font-semibold uppercase">Reclamos e Historial ChileCompra</dt>
              <dd class="mt-1 flex items-center gap-2">
                <span
                  :class="(licitacion.CantidadReclamos || 0) <= 5
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : (licitacion.CantidadReclamos || 0) <= 25
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'"
                  class="px-2.5 py-0.5 rounded-full text-xs font-extrabold border"
                >
                  {{ (licitacion.CantidadReclamos || 0) <= 5 ? '🟢 Comprador Confiable' : `⚠️ ${licitacion.CantidadReclamos} reclamos` }}
                </span>
                <span class="text-slate-500 text-[11px]">({{ licitacion.CantidadReclamos || 0 }} históricos)</span>
              </dd>
            </div>
            <div v-if="licitacion.NombreResponsablePago || licitacion.EmailResponsablePago">
              <dt class="text-slate-400 font-semibold uppercase">Responsable de Pago</dt>
              <dd class="font-semibold text-slate-700 mt-0.5">
                {{ licitacion.NombreResponsablePago || 'Unidad de Finanzas' }}
                <span v-if="licitacion.EmailResponsablePago" class="block text-blue-600">{{ licitacion.EmailResponsablePago }}</span>
              </dd>
            </div>
          </dl>
        </div>

        <!-- Líneas de Productos / Servicios Solicitados (Ítems) -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>📦</span> Ítems y Servicios Solicitados ({{ itemsListado.length }})
            </h2>
          </div>

          <div v-if="itemsListado.length > 0" class="space-y-3 max-h-96 overflow-y-auto pr-1">
            <div
              v-for="item in itemsListado"
              :key="item.Correlativo"
              class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    #{{ item.Correlativo }}
                  </span>
                  <span class="text-xs font-bold text-slate-900">{{ item.NombreProducto }}</span>
                  <span class="text-[11px] font-mono text-slate-400">ONU: {{ item.CodigoProducto }}</span>
                </div>
                <p class="text-xs text-slate-600 mt-1">{{ item.Descripcion }}</p>
                <p class="text-[11px] text-slate-400 mt-0.5">Categoría: {{ item.Categoria }}</p>
              </div>
              <div class="text-right sm:min-w-[130px] bg-white px-3 py-2 rounded-lg border border-slate-200">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Cantidad</span>
                <span class="text-sm font-extrabold text-slate-900">
                  {{ item.Cantidad }} {{ item.UnidadMedida }}
                </span>
              </div>
            </div>
          </div>
          <p v-else class="text-xs text-slate-500 py-8 text-center">
            No se detallaron líneas de ítems adicionales o se encuentran adjuntos en las Bases Administrativas.
          </p>
        </div>
      </div>

      <!-- Calculadora Económica de Oferta, Margen, IVA y Garantías -->
      <div class="card-elevated p-6 border-l-[6px] border-l-indigo-600">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>🧮</span> Simulador Económico de Oferta, Margen y Garantías ({{ perfil?.nombreEmpresa || 'Tu Empresa' }})
              </h2>
              <span
                class="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border"
                :class="licitacion?.MontoEstimado ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'"
              >
                {{ licitacion?.MontoEstimado ? '✓ Basado en Presupuesto Oficial Exacto' : `⚡ Presupuesto Reservado (Tope Tramo ${licitacion?.Tipo || 'LP'})` }}
              </span>
            </div>
            <p class="text-xs text-slate-600 mt-1">
              {{ explicacionSimulador }}
            </p>
          </div>
          <button
            type="button"
            @click="guardarEnSeguimiento"
            class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition shrink-0 shadow-sm"
          >
            💾 Guardar Simulación en Pipeline CRM
          </button>
        </div>

        <!-- Selector de Estrategia de Precio -->
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4 bg-slate-100 p-2.5 rounded-xl border border-slate-200/90">
          <span class="text-xs font-extrabold text-slate-700 px-2">
            🎯 Estrategia de Postulación Sugerida:
          </span>
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              @click="aplicarEstrategia('agresiva')"
              class="px-3 py-1.5 rounded-lg text-xs font-extrabold transition border"
              :class="estrategiaActiva === 'agresiva'
                ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:border-rose-300'"
            >
              🔥 Competitiva / Ganar Precio ({{ Number((factoresEstrategia.agresiva * 100).toFixed(1)) }}% ref.)
            </button>
            <button
              type="button"
              @click="aplicarEstrategia('optima')"
              class="px-3 py-1.5 rounded-lg text-xs font-extrabold transition border"
              :class="estrategiaActiva === 'optima'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-indigo-50 hover:border-indigo-300'"
            >
              ⚖️ Óptima IA ({{ Number((factoresEstrategia.optima * 100).toFixed(1)) }}% ref.)
            </button>
            <button
              type="button"
              @click="aplicarEstrategia('conservadora')"
              class="px-3 py-1.5 rounded-lg text-xs font-extrabold transition border"
              :class="estrategiaActiva === 'conservadora'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-300'"
            >
              🛡️ Conservadora / Alto Margen ({{ Number((factoresEstrategia.conservadora * 100).toFixed(1)) }}% ref.)
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <!-- Inputs de Simulación -->
          <div class="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
                💵 Mi Oferta Neta Total (Sin IVA - $ CLP)
              </label>
              <input
                v-model.number="simOfertaNeta"
                @input="estrategiaActiva = 'manual'"
                type="number"
                step="50000"
                class="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-extrabold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none tabular-nums"
                placeholder="Ej: 15000000"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
                🛠️ Costos Directos Estimados ($ CLP - ~{{ Math.round(ratioCostoRubro * 100) }}% rubro)
              </label>
              <input
                v-model.number="simCostoDirecto"
                @input="estrategiaActiva = 'manual'"
                type="number"
                step="50000"
                class="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none tabular-nums"
                placeholder="HH, personal, insumos, logística..."
              />
            </div>

            <div v-if="mesesContrato > 1" class="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span class="font-bold text-slate-600">📅 Equivalente Mensual ({{ mesesContrato }} meses):</span>
              <span class="font-extrabold text-indigo-700 tabular-nums">
                {{ formatCurrency(Math.round((simOfertaNeta || 0) / mesesContrato)) }} / mes neto
              </span>
            </div>
          </div>

          <!-- Desglose Neto + IVA + Presupuesto -->
          <div class="space-y-2.5 bg-blue-50/40 p-4 rounded-xl border border-blue-200/80 text-xs">
            <h3 class="font-extrabold uppercase text-blue-900 text-[11px] tracking-wider">📊 Desglose Tributario y Tope</h3>
            <div class="flex justify-between py-1 border-b border-blue-100">
              <span class="text-slate-600">Oferta Neta:</span>
              <span class="font-bold text-slate-900 tabular-nums">{{ formatCurrency(simOfertaNeta || 0) }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-blue-100">
              <span class="text-slate-600">IVA (19%):</span>
              <span class="font-bold text-slate-800 tabular-nums">{{ formatCurrency(Math.round((simOfertaNeta || 0) * 0.19)) }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-blue-200 text-sm">
              <span class="font-bold text-blue-950">Total Bruto (c/IVA):</span>
              <span class="font-extrabold text-blue-700 tabular-nums">{{ formatCurrency(Math.round((simOfertaNeta || 0) * 1.19)) }}</span>
            </div>
            <div v-if="techoReferenciaCLP > 0" class="pt-1 flex items-center justify-between">
              <span class="text-slate-600">
                {{ licitacion?.MontoEstimado ? 'Uso del Presupuesto:' : 'Uso del Tope Tramo:' }}
              </span>
              <span
                class="tabular-nums"
                :class="porcentajeUsoPresupuesto > 100 ? 'text-rose-600 font-extrabold' : 'text-emerald-700 font-extrabold'"
              >
                {{ porcentajeUsoPresupuesto }}% {{ porcentajeUsoPresupuesto > 100 ? '⚠️ Supera tope' : '✓ Dentro de rango' }}
              </span>
            </div>
          </div>

          <!-- Margen Esperado y Garantías -->
          <div class="space-y-2.5 bg-emerald-50/40 p-4 rounded-xl border border-emerald-200/80 text-xs">
            <h3 class="font-extrabold uppercase text-emerald-900 text-[11px] tracking-wider">💰 Rentabilidad y Garantías</h3>
            <div class="flex justify-between py-1 border-b border-emerald-100">
              <span class="text-slate-600">Utilidad Bruta Estimada:</span>
              <span class="font-extrabold tabular-nums" :class="utilidadEstimada >= 0 ? 'text-emerald-800' : 'text-rose-600'">
                {{ formatCurrency(utilidadEstimada) }} ({{ margenPorcentaje }}%)
              </span>
            </div>
            <div class="flex justify-between py-1 border-b border-emerald-100">
              <span class="text-slate-600">Garantía Seriedad (~1,5%):</span>
              <span class="font-bold text-slate-800 tabular-nums">{{ formatCurrency(Math.round((simOfertaNeta || 0) * 0.015)) }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-emerald-100">
              <span class="text-slate-600">Fiel Cumplimiento (~5%):</span>
              <span class="font-bold text-slate-800 tabular-nums">{{ formatCurrency(Math.round((simOfertaNeta || 0) * 0.05)) }}</span>
            </div>
            <div v-if="perfil?.capacidadGarantia" class="pt-1 flex justify-between items-center">
              <span class="text-slate-600">Tu Capacidad Garantía:</span>
              <span
                :class="Number(perfil.capacidadGarantia) >= Math.round((simOfertaNeta || 0) * 0.05) ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'"
              >
                {{ Number(perfil.capacidadGarantia) >= Math.round((simOfertaNeta || 0) * 0.05) ? '✓ Cubre el 5%' : '⚠️ Supera tu tope' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Centro de Inteligencia Artificial y Factibilidad de Postulación -->
      <div class="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-lg p-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-400/30">
              Copiloto de Licitaciones IA
            </span>
            <h2 class="text-xl font-extrabold mt-1">
              Evaluación de Factibilidad, Resumen Ejecutivo y Checklist Documental
            </h2>
            <p class="text-xs text-slate-300 mt-0.5">
              Cruza automáticamente los ítems, montos y plazos de esta licitación contra tu Perfil de Empresa.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              @click="realizarAnalisis"
              :disabled="analizando"
              class="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition"
            >
              {{ analizando ? '⏳ Calculando Match...' : '🎯 Analizar Factibilidad y Match' }}
            </button>
            <button
              @click="generarResumen"
              :disabled="generandoResumen"
              class="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition"
            >
              {{ generandoResumen ? '⏳ Generando...' : '📄 Resumen Ejecutivo' }}
            </button>
            <button
              @click="generarDocumentacion"
              :disabled="generandoDoc"
              class="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition"
            >
              {{ generandoDoc ? '⏳ Generando...' : '📋 Propuesta Técnica y Anexos' }}
            </button>
            <button
              @click="generarPreguntasForo"
              :disabled="generandoForo"
              class="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-extrabold px-4 py-2.5 rounded-xl shadow transition"
            >
              {{ generandoForo ? '⏳ Redactando...' : '❓ Preguntas para el Foro' }}
            </button>
          </div>
        </div>

        <!-- Resultado de Match -->
        <div v-if="analisisMatch" class="mt-6 bg-white/10 backdrop-blur rounded-xl p-5 border border-white/15">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 class="text-base font-bold text-white">Índice de Factibilidad para tu Empresa</h3>
              <p class="text-xs text-slate-300">Basado en coincidencia de servicios, tramo de monto máximo, región y holgura de cierre</p>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-3xl font-black" :class="getNivelColor(analisisMatch.nivelMatch)">
                {{ analisisMatch.nivelMatch }}%
              </div>
            </div>
          </div>

          <div class="w-full bg-slate-800 rounded-full h-3 mb-6 overflow-hidden">
            <div
              class="bg-gradient-to-r from-amber-400 via-blue-500 to-emerald-400 h-3 rounded-full transition-all duration-500"
              :style="{ width: analisisMatch.nivelMatch + '%' }"
            ></div>
          </div>

          <div v-if="analisisMatch.puntosBlind" class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div class="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-4">
              <h4 class="font-bold text-emerald-300 uppercase mb-2">✓ Puntos Fuertes</h4>
              <ul class="space-y-1.5 text-slate-200 list-disc list-inside">
                <li v-for="(p, i) in analisisMatch.puntosBlind.puntosFuertes" :key="i">{{ p }}</li>
              </ul>
            </div>

            <div class="bg-rose-500/10 border border-rose-400/30 rounded-xl p-4">
              <h4 class="font-bold text-rose-300 uppercase mb-2">⚠️ Alertas / Brechas</h4>
              <ul class="space-y-1.5 text-slate-200 list-disc list-inside">
                <li v-for="(p, i) in analisisMatch.puntosBlind.puntosDebiles" :key="i">{{ p }}</li>
              </ul>
            </div>

            <div class="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
              <h4 class="font-bold text-blue-300 uppercase mb-2">💡 Estrategia Recomendada</h4>
              <ul class="space-y-1.5 text-slate-200 list-disc list-inside">
                <li v-for="(r, i) in analisisMatch.puntosBlind.recomendaciones" :key="i">{{ r }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Resumen Ejecutivo Estructurado -->
        <div v-if="resumen" class="mt-6 bg-white/10 rounded-xl p-5 border border-white/15 space-y-4 text-xs">
          <h3 class="text-base font-bold text-blue-300">📄 Resumen Ejecutivo</h3>
          <p class="text-slate-200 leading-relaxed">{{ resumen.objetoContratacion || resumen }}</p>
          <div v-if="resumen.presupuestoYModalidad" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-slate-900/60 p-3 rounded-lg">
              <span class="text-slate-400 block">Presupuesto / Tramo</span>
              <span class="font-bold text-white">{{ resumen.presupuestoYModalidad.montoEstimadoExacto }} ({{ resumen.presupuestoYModalidad.tramoMaximoLegal }})</span>
            </div>
            <div class="bg-slate-900/60 p-3 rounded-lg">
              <span class="text-slate-400 block">Modalidad de Pago</span>
              <span class="font-bold text-white">{{ resumen.presupuestoYModalidad.modalidadPago }}</span>
            </div>
            <div class="bg-slate-900/60 p-3 rounded-lg">
              <span class="text-slate-400 block">Duración Contrato</span>
              <span class="font-bold text-white">{{ resumen.presupuestoYModalidad.duracionContrato }}</span>
            </div>
          </div>
        </div>

        <!-- Checklist Documental Estructurado + Borrador de Propuesta Técnica -->
        <div v-if="documentacion" class="mt-6 bg-white/10 rounded-xl p-5 border border-white/15 space-y-4 text-xs">
          <h3 class="text-base font-bold text-emerald-300">📋 Guía de Documentación y Borrador Técnico</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-if="documentacion.documentosAdministrativos" class="bg-slate-900/60 p-4 rounded-xl">
              <h4 class="font-bold text-white mb-2">1. Anexos Administrativos</h4>
              <ul class="space-y-1.5 text-slate-300 list-disc list-inside">
                <li v-for="(d, i) in documentacion.documentosAdministrativos" :key="i">{{ d }}</li>
              </ul>
            </div>
            <div v-if="documentacion.documentosTecnicos" class="bg-slate-900/60 p-4 rounded-xl">
              <h4 class="font-bold text-white mb-2">2. Propuesta Técnica</h4>
              <ul class="space-y-1.5 text-slate-300 list-disc list-inside">
                <li v-for="(d, i) in documentacion.documentosTecnicos" :key="i">{{ d }}</li>
              </ul>
            </div>
            <div v-if="documentacion.checklistPostulacion" class="bg-slate-900/60 p-4 rounded-xl">
              <h4 class="font-bold text-white mb-2">3. Checklist Pre-Cierre</h4>
              <ul class="space-y-1.5 text-slate-300 list-disc list-inside">
                <li v-for="(d, i) in documentacion.checklistPostulacion" :key="i">{{ d }}</li>
              </ul>
            </div>
          </div>

          <div v-if="documentacion.borradorPropuestaTecnica" class="bg-slate-950/80 border border-emerald-400/30 rounded-xl p-4 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-extrabold text-emerald-300 uppercase tracking-wider text-[11px]">
                ✍️ Borrador de Propuesta Técnica y Carta de Presentación ({{ perfil?.nombreEmpresa || 'Tu Empresa' }})
              </span>
              <button
                type="button"
                @click="copiarTexto(documentacion.borradorPropuestaTecnica, 'Propuesta Técnica copiada')"
                class="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-400/40 px-3 py-1 rounded-lg font-bold transition"
              >
                📋 {{ textoCopiado || 'Copiar Propuesta Técnica' }}
              </button>
            </div>
            <pre class="text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">{{ documentacion.borradorPropuestaTecnica }}</pre>
          </div>
        </div>

        <!-- Preguntas Estratégicas para el Foro de Mercado Público -->
        <div v-if="preguntasForo" class="mt-6 bg-amber-500/10 rounded-xl p-5 border border-amber-400/30 space-y-4 text-xs">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="text-base font-extrabold text-amber-300">❓ Preguntas Estratégicas para el Foro de la Licitación</h3>
              <p class="text-[11px] text-amber-100/80 mt-0.5">{{ preguntasForo.consejoForo }}</p>
            </div>
            <button
              type="button"
              @click="copiarTodasLasPreguntas"
              class="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-3.5 py-1.5 rounded-lg transition"
            >
              📋 {{ textoCopiado || 'Copiar Todas las Preguntas' }}
            </button>
          </div>

          <div class="grid grid-cols-1 gap-2.5">
            <div
              v-for="(item, idx) in preguntasForo.preguntas"
              :key="idx"
              class="bg-slate-900/80 border border-amber-400/20 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div class="space-y-1">
                <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  {{ idx + 1 }}. {{ item.categoria }}
                </span>
                <p class="text-slate-100 leading-relaxed">{{ item.pregunta }}</p>
              </div>
              <button
                type="button"
                @click="copiarTexto(item.pregunta, `Pregunta #${idx + 1} copiada`)"
                class="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold shrink-0"
              >
                📋 Copiar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
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
const cargandoDetalle = ref(false)
const analisisMatch = ref(null)
const resumen = ref(null)
const documentacion = ref(null)
const preguntasForo = ref(null)
const analizando = ref(false)
const generandoResumen = ref(false)
const generandoDoc = ref(false)
const generandoForo = ref(false)
const guardando = ref(false)
const guardadaExito = ref(false)
const textoCopiado = ref('')

// Estado del Simulador Económico
const simOfertaNeta = ref(0)
const simCostoDirecto = ref(0)
const estrategiaActiva = ref('optima')

const perfil = computed(() => perfilStore.perfil)

const techoReferenciaCLP = computed(() => {
  return Number(licitacion.value?.MontoEstimado) || Number(licitacion.value?.MontoMaximoEstimadoCLP) || 0
})

const mesesContrato = computed(() => {
  const dur = Number(licitacion.value?.TiempoDuracionContrato) || 0
  const unidad = Number(licitacion.value?.UnidadTiempoDuracionContrato) || 0
  if (!dur) return 1
  // En Mercado Público: 4 = Meses, 2 = Días, 5 = Años
  if (unidad === 5) return dur * 12
  if (unidad === 2 && dur >= 30) return Math.max(1, Math.round(dur / 30))
  return dur
})

// Estructura de costos directos según el rubro de la empresa activa (ajustada para márgenes más amplios)
const ratioCostoRubro = computed(() => {
  const rubros = (perfil.value?.rubrosPrincipales || '').toLowerCase()
  if (rubros.includes('aseo') || rubros.includes('mantencion') || rubros.includes('obras') || rubros.includes('logistica')) {
    return 0.62 // Costos directos sobre oferta óptima (~38% margen en Óptima, ~27% en Competitiva, ~43% en Conservadora)
  }
  if (rubros.includes('ti') || rubros.includes('consultoria') || rubros.includes('capacitacion')) {
    return 0.52 // Costos directos sobre oferta óptima (~48% margen en Óptima, ~38% en Competitiva, ~52% en Conservadora)
  }
  return 0.56
})

// Factores de estrategia definidos: Competitiva 70%, Óptima 82.5%, Conservadora 90%
const factoresEstrategia = computed(() => {
  return {
    agresiva: 0.70,
    optima: 0.825,
    conservadora: 0.90
  }
})

const explicacionSimulador = computed(() => {
  const lic = licitacion.value
  if (!lic) return ''
  const pctActual = estrategiaActiva.value === 'agresiva'
    ? '70%'
    : estrategiaActiva.value === 'conservadora'
      ? '90%'
      : '82.5%'
  if (Number(lic.MontoEstimado) > 0) {
    return `Presupuesto oficial informado (${formatCurrency(lic.MontoEstimado)}). Estrategia activa al ${pctActual} de referencia (Competitiva 70% · Óptima 82.5% · Conservadora 90%).`
  }
  return `Presupuesto reservado en tramo ${lic.Tipo || 'LP'} (tope referencia ${formatCurrency(lic.MontoMaximoEstimadoCLP)}). Estrategia activa al ${pctActual} (Competitiva 70% · Óptima 82.5% · Conservadora 90%).`
})

const porcentajeUsoPresupuesto = computed(() => {
  if (!techoReferenciaCLP.value) return 0
  const bruto = (simOfertaNeta.value || 0) * 1.19
  return Number(((bruto / techoReferenciaCLP.value) * 100).toFixed(1))
})

const utilidadEstimada = computed(() => {
  return (simOfertaNeta.value || 0) - (simCostoDirecto.value || 0)
})

const margenPorcentaje = computed(() => {
  if (!simOfertaNeta.value) return 0
  return Number(((utilidadEstimada.value / simOfertaNeta.value) * 100).toFixed(1))
})

const aplicarEstrategia = (tipoEstrategia = 'optima') => {
  const lic = licitacion.value
  if (!lic) return
  estrategiaActiva.value = tipoEstrategia
  const baseBruta = Number(lic.MontoEstimado) || Number(lic.MontoMaximoEstimadoCLP) || 10000000
  const factor = factoresEstrategia.value[tipoEstrategia] || factoresEstrategia.value.optima
  const netoSugerido = Math.round((baseBruta * factor) / 1.19)
  simOfertaNeta.value = netoSugerido

  // El costo operativo base se calcula sobre la referencia óptima (82.5%) para reflejar cómo varía el margen real al bajar a 70% o subir a 90%
  const netoBaseOptimo = Math.round((baseBruta * factoresEstrategia.value.optima) / 1.19)
  simCostoDirecto.value = Math.round(netoBaseOptimo * ratioCostoRubro.value)
}

const inicializarSimulador = (lic, forzarRecalculo = false) => {
  if (!lic) return
  if (!simOfertaNeta.value || forzarRecalculo || estrategiaActiva.value !== 'manual') {
    aplicarEstrategia(estrategiaActiva.value === 'manual' ? 'optima' : estrategiaActiva.value)
  }
}

watch([licitacion, perfil], ([nuevaLic]) => {
  if (nuevaLic) inicializarSimulador(nuevaLic, true)
})

const itemsListado = computed(() => {
  return licitacion.value?.Items?.Listado || []
})

const formatDateTime = (fecha) => {
  if (!fecha) return 'No especificada'
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

const hitosFechas = computed(() => {
  const f = licitacion.value?.Fechas || {}
  const ahora = Date.now()
  const crearHito = (icono, titulo, fechaRaw, destacado = false) => {
    const time = fechaRaw ? new Date(fechaRaw).getTime() : null
    return {
      icono,
      titulo,
      valorFormateado: formatDateTime(fechaRaw),
      destacado,
      pasado: time ? time < ahora : false
    }
  }

  return [
    crearHito('📢', 'Publicación', f.FechaPublicacion || licitacion.value?.FechaPublicacion),
    crearHito('💬', 'Inicio de Preguntas', f.FechaInicioPreguntas || licitacion.value?.FechaInicio),
    crearHito('❓', 'Fin de Preguntas', f.FechaFinalPreguntas || licitacion.value?.FechaFinal, true),
    crearHito('💡', 'Publicación Respuestas', f.FechaPublicacionRespuestas || licitacion.value?.FechaPubRespuestas),
    crearHito('👷', 'Visita a Terreno', f.FechaVisitaTerreno || licitacion.value?.FechaVisitaTerreno),
    crearHito('🛑', 'Cierre de Ofertas', f.FechaCierre || licitacion.value?.FechaCierre, true),
    crearHito('🔓', 'Apertura Técnica', f.FechaActoAperturaTecnica || licitacion.value?.FechaActoAperturaTecnica),
    crearHito('🏆', 'Adjudicación Estimada', f.FechaEstimadaAdjudicacion || licitacion.value?.FechaEstimadaAdjudicacion, true)
  ]
})

const getNivelColor = (nivel) => {
  if (nivel < 40) return 'text-rose-400'
  if (nivel < 70) return 'text-amber-300'
  return 'text-emerald-400'
}

const realizarAnalisis = async () => {
  try {
    analizando.value = true
    const resultado = await iaStore.analizarMatch(perfil.value || {}, licitacion.value)
    analisisMatch.value = {
      nivelMatch: resultado.nivelMatch || 70,
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
    resumen.value = await iaStore.generarResumen(licitacion.value)
  } catch (err) {
    console.error('Error:', err)
  } finally {
    generandoResumen.value = false
  }
}

const generarDocumentacion = async () => {
  try {
    generandoDoc.value = true
    const res = await axios.post('/api/ia/documentacion', {
      perfilEmpresa: perfil.value || {},
      licitacion: licitacion.value
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    documentacion.value = res.data
  } catch (err) {
    console.error('Error:', err)
  } finally {
    generandoDoc.value = false
  }
}

const generarPreguntasForo = async () => {
  try {
    generandoForo.value = true
    const res = await axios.post('/api/ia/preguntas-foro', {
      perfilEmpresa: perfil.value || {},
      licitacion: licitacion.value
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    preguntasForo.value = res.data
  } catch (err) {
    console.error('Error generando preguntas foro:', err)
  } finally {
    generandoForo.value = false
  }
}

const copiarTexto = async (texto, mensaje = 'Copiado') => {
  try {
    await navigator.clipboard.writeText(texto)
    textoCopiado.value = mensaje
    setTimeout(() => { textoCopiado.value = '' }, 2500)
  } catch (e) {
    console.error('Error copiando texto:', e)
  }
}

const copiarTodasLasPreguntas = () => {
  if (!preguntasForo.value?.preguntas) return
  const texto = preguntasForo.value.preguntas
    .map((p, i) => `PREGUNTA ${i + 1} (${p.categoria}):\n${p.pregunta}`)
    .join('\n\n')
  copiarTexto(texto, '5 Preguntas copiadas')
}

const formatICSDate = (dateStr) => {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

const descargarICS = () => {
  if (!licitacion.value) return
  const d = licitacion.value
  const codigo = d.CodigoExterno
  const nombre = (d.Nombre || codigo).replace(/[\r\n,;]/g, ' ')
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MercadoPublico MultiEmpresa//CL',
    'CALSCALE:GREGORIAN'
  ]

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
        `DESCRIPTION:Cierre del foro de preguntas para ${codigo}`,
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
        `DESCRIPTION:Cierre de recepción de ofertas en Mercado Público para ${codigo}`,
        'END:VEVENT'
      )
    }
  }

  lineas.push('END:VCALENDAR')
  const blob = new Blob([lineas.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hitos-${codigo}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

const guardarEnSeguimiento = async () => {
  if (!licitacion.value) return
  const uid = authStore.usuarioId || JSON.parse(localStorage.getItem('usuario') || '{}')?.id || 1
  guardando.value = true
  try {
    await axios.post('/api/licitaciones/guardar', {
      usuarioId: uid,
      perfilId: perfil.value?.id || 1,
      codigoLicitacion: licitacion.value.CodigoExterno,
      datosLicitacion: licitacion.value,
      nivelMatch: analisisMatch.value?.nivelMatch || licitacion.value.scoreRecomendacion || 85,
      analisisIa: analisisMatch.value || {},
      montoOfertado: simOfertaNeta.value || null,
      costoEstimado: simCostoDirecto.value || null
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    guardadaExito.value = true
    setTimeout(() => { guardadaExito.value = false }, 3500)
  } finally {
    guardando.value = false
  }
}

const formatCurrency = (valor, moneda = 'CLP') => {
  if (!valor) return 'No informado'
  if (moneda === 'UTM') return `${Number(valor).toLocaleString('es-CL')} UTM`
  if (moneda === 'UF' || moneda === 'CLF') return `${Number(valor).toLocaleString('es-CL')} UF`
  if (moneda === 'USD') return `US$ ${Number(valor).toLocaleString('es-CL')}`
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(valor)
}

onMounted(async () => {
  if (history.state?.licitacion) {
    licitacion.value = history.state.licitacion
  }

  if (authStore.usuarioId) {
    await perfilStore.obtenerPerfil(authStore.usuarioId)
  }

  // Siempre consultar el detalle completo por código para traer todas las fechas clave, montos e ítems
  const codigo = route.params.codigo
  if (codigo) {
    cargandoDetalle.value = true
    try {
      const detalleCompleto = await licitacionesStore.obtenerDetallePorCodigo(codigo)
      if (detalleCompleto) {
        licitacion.value = detalleCompleto
      }
    } finally {
      cargandoDetalle.value = false
    }
  }

  if (history.state?.analizarMatch && licitacion.value) {
    await realizarAnalisis()
  }
})
</script>
