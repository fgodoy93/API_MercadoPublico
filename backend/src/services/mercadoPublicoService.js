import axios from 'axios';
import dotenv from 'dotenv';
import { Op } from 'sequelize';
import { LicitacionCache } from '../db/sequelize.js';

dotenv.config();

const API_URL = process.env.MERCADO_PUBLICO_API_URL || 'https://api.mercadopublico.cl/servicios/v1/publico';
const TICKET = process.env.MERCADO_PUBLICO_TICKET || process.env.MERCADO_PUBLICO_API_KEY || '53CA2806-ED69-4108-9148-6F7B5C1A217F';

// Endpoint oficial del Buscador de Compra Ágil (COT) de Mercado Público
const COMPRA_AGIL_CLOUD_URL = 'https://api.buscador.mercadopublico.cl/compra-agil';
const COMPRA_AGIL_API_KEY = process.env.COMPRA_AGIL_API_KEY || 'e93089e4-437c-4723-b343-4fa20045e3bc';
const COMPRA_AGIL_HEADERS = {
  'x-api-key': COMPRA_AGIL_API_KEY,
  'Origin': 'https://buscador.mercadopublico.cl',
  'Referer': 'https://buscador.mercadopublico.cl/compra-agil',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'application/json'
};

const MAPA_REGION_COMPRA_AGIL = {
  'arica': '15',
  'tarapac': '1',
  'antofagasta': '2',
  'atacama': '3',
  'coquimbo': '4',
  'valpara': '5',
  'metropolitana': '13',
  'higgins': '6',
  'maule': '7',
  'uble': '16',
  'biob': '8',
  'araucan': '9',
  'ríos': '14',
  'rios': '14',
  'lagos': '10',
  'ays': '11',
  'magallanes': '12'
};

function obtenerCodigoRegionCompraAgil(regionTexto = '') {
  if (!regionTexto) return 'all';
  const lower = String(regionTexto).toLowerCase();
  for (const [clave, id] of Object.entries(MAPA_REGION_COMPRA_AGIL)) {
    if (lower.includes(clave)) return id;
  }
  return 'all';
}

function normalizarItemListadoCompraAgil(ca) {
  const monto = Number(ca.monto_disponible_CLP || ca.monto_disponible || ca.presupuesto || 0);
  return {
    CodigoExterno: ca.codigo,
    Nombre: ca.nombre || `Compra Ágil ${ca.codigo}`,
    CodigoEstado: 5,
    Estado: ca.estado || 'Publicada',
    Descripcion: ca.descripcion || `${ca.nombre || ''} — Unidad: ${ca.unidad || ca.organismo || ''}`,
    FechaCierre: ca.fecha_cierre,
    DiasRestantes: calcularDiasRestantes(ca.fecha_cierre),
    Tipo: 'COT',
    EsCompraAgilCot: true,
    DescripcionTipo: 'Compra Ágil Oficial (COT ≤ 100 UTM)',
    Convocatoria: 'Cotización Directa Compra Ágil',
    Moneda: ca.moneda || 'CLP',
    MontoEstimado: monto,
    MontoExactoDisponible: monto > 0,
    TipoEstimacionTexto: `Presupuesto disponible (${ca.cantidad_proveedores_cotizando ?? 0} cotizaciones recibidas)`,
    MontoMinimoEstimadoCLP: 0,
    MontoMaximoEstimadoCLP: monto > 0 ? monto : (100 * 66600),
    RangoUTM: '0 a 100 UTM (Compra Ágil)',
    NombreOrganismo: ca.organismo || '',
    UnidadCompra: ca.unidad || '',
    RegionUnidad: ca.region || '',
    ComunaUnidad: ca.comuna || '',
    CantidadProveedoresCotizando: ca.cantidad_proveedores_cotizando ?? 0,
    Fechas: {
      FechaPublicacion: ca.fecha_publicacion || null,
      FechaCierre: ca.fecha_cierre || null
    },
    FechaPublicacion: ca.fecha_publicacion || null,
    UrlExterna: `https://buscador.mercadopublico.cl/ficha?code=${ca.codigo}`,
    DetalleEnriquecido: false
  };
}

function normalizarDetalleCompraAgil(ficha) {
  const monto = Number(ficha.presupuesto_estimado || ficha.monto_disponible || 0);
  const inst = ficha.informacion_institucion || {};
  const productos = Array.isArray(ficha.productos_solicitados) ? ficha.productos_solicitados : [];

  return {
    CodigoExterno: ficha.codigo,
    Nombre: ficha.nombre || `Compra Ágil ${ficha.codigo}`,
    CodigoEstado: 5,
    Estado: ficha.estado || 'Publicada',
    Descripcion: ficha.descripcion || ficha.nombre || '',
    FechaCierre: ficha.fecha_cierre,
    DiasRestantes: calcularDiasRestantes(ficha.fecha_cierre),
    Tipo: 'COT',
    EsCompraAgilCot: true,
    DescripcionTipo: 'Compra Ágil Oficial (COT ≤ 100 UTM)',
    Convocatoria: 'Cotización Directa Compra Ágil',
    Moneda: ficha.moneda || 'CLP',
    MontoEstimado: monto,
    MontoExactoDisponible: monto > 0,
    TipoEstimacionTexto: `${ficha.tipo_presupuesto || 'Presupuesto Disponible'} (${ficha.total_ofertas_recibidas ?? 0} ofertas recibidas)`,
    MontoMinimoEstimadoCLP: 0,
    MontoMaximoEstimadoCLP: monto > 0 ? monto : (100 * 66600),
    RangoUTM: '0 a 100 UTM (Compra Ágil)',
    ModalidadPagoTexto: 'Pago a 30 días contra recepción conforme',
    TiempoDuracionContrato: ficha.plazo_entrega ? `${ficha.plazo_entrega} días de plazo de entrega` : null,
    DuracionContratoTexto: ficha.plazo_entrega ? `Plazo de entrega: ${ficha.plazo_entrega} días` : 'Entrega inmediata según requerimiento',
    NombreOrganismo: inst.organismo_comprador || ficha.organismo || '',
    NombreUnidad: inst.division || ficha.unidad || '',
    UnidadCompra: inst.division || ficha.unidad || '',
    RutUnidad: inst.rut_organismo_comprador || '',
    DireccionUnidad: ficha.direccion_entrega || '',
    RegionUnidad: ficha.region || '',
    ComunaUnidad: ficha.direccion_entrega || '',
    CantidadReclamos: 0,
    TotalOfertasRecibidas: ficha.total_ofertas_recibidas ?? 0,
    Fechas: {
      FechaPublicacion: ficha.fecha_publicacion || null,
      FechaCierre: ficha.fecha_cierre || null,
      FechaFinalPreguntas: ficha.fecha_cierre_primer_llamado || null,
      FechaEstimadaAdjudicacion: ficha.fecha_cierre_segundo_llamado || ficha.fecha_cierre || null
    },
    FechaPublicacion: ficha.fecha_publicacion || '',
    Items: {
      Cantidad: productos.length,
      Listado: productos.map((p, idx) => ({
        Correlativo: idx + 1,
        CodigoProducto: p.codigo_producto,
        NombreProducto: p.nombre || 'Ítem Compra Ágil',
        Descripcion: p.descripcion || p.nombre || '',
        Cantidad: p.cantidad || 1,
        UnidadMedida: p.unidad_medida || 'Unid.'
      }))
    },
    UrlExterna: `https://buscador.mercadopublico.cl/ficha?code=${ficha.codigo}`,
    DetalleEnriquecido: true
  };
}

const axiosInstance = axios.create({
  timeout: 90000,
  headers: { 'Accept': 'application/json' }
});

// Cache en memoria para listados (TTL: 10 minutos)
const listadoCache = new Map();
const detalleMemoryCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

// Valores referenciales en CLP para filtros y visualización de tramos UTM
const UTM_CLP = 66600;
const UF_CLP = 38000;
const USD_CLP = 960;

const TRAMOS_TIPO = {
  'L1': { codigo: 'L1', nombre: 'Licitación Pública < 100 UTM', minUTM: 0, maxUTM: 100, minCLP: 0, maxCLP: 100 * UTM_CLP, convocatoria: 'Pública' },
  'LE': { codigo: 'LE', nombre: 'Licitación Pública 100 - 1.000 UTM', minUTM: 100, maxUTM: 1000, minCLP: 100 * UTM_CLP, maxCLP: 1000 * UTM_CLP, convocatoria: 'Pública' },
  'LP': { codigo: 'LP', nombre: 'Licitación Pública 1.000 - 2.000 UTM', minUTM: 1000, maxUTM: 2000, minCLP: 1000 * UTM_CLP, maxCLP: 2000 * UTM_CLP, convocatoria: 'Pública' },
  'LQ': { codigo: 'LQ', nombre: 'Licitación Pública 2.000 - 5.000 UTM', minUTM: 2000, maxUTM: 5000, minCLP: 2000 * UTM_CLP, maxCLP: 5000 * UTM_CLP, convocatoria: 'Pública' },
  'LR': { codigo: 'LR', nombre: 'Licitación Pública > 5.000 UTM', minUTM: 5000, maxUTM: null, minCLP: 5000 * UTM_CLP, maxCLP: null, convocatoria: 'Pública' },
  'LS': { codigo: 'LS', nombre: 'Servicios Personales Especializados', minUTM: 0, maxUTM: null, minCLP: 0, maxCLP: null, convocatoria: 'Pública' },
  'E2': { codigo: 'E2', nombre: 'Licitación Privada < 100 UTM', minUTM: 0, maxUTM: 100, minCLP: 0, maxCLP: 100 * UTM_CLP, convocatoria: 'Privada' },
  'CO': { codigo: 'CO', nombre: 'Licitación Privada 100 - 1.000 UTM', minUTM: 100, maxUTM: 1000, minCLP: 100 * UTM_CLP, maxCLP: 1000 * UTM_CLP, convocatoria: 'Privada' },
  'B2': { codigo: 'B2', nombre: 'Licitación Privada 1.000 - 2.000 UTM', minUTM: 1000, maxUTM: 2000, minCLP: 1000 * UTM_CLP, maxCLP: 2000 * UTM_CLP, convocatoria: 'Privada' },
  'H2': { codigo: 'H2', nombre: 'Licitación Privada 2.000 - 5.000 UTM', minUTM: 2000, maxUTM: 5000, minCLP: 2000 * UTM_CLP, maxCLP: 5000 * UTM_CLP, convocatoria: 'Privada' },
  'I2': { codigo: 'I2', nombre: 'Licitación Privada > 5.000 UTM', minUTM: 5000, maxUTM: null, minCLP: 5000 * UTM_CLP, maxCLP: null, convocatoria: 'Privada' }
};

const MODALIDADES_PAGO = {
  1: 'Pago a 30 días',
  2: 'Pago a 30, 60 y 90 días',
  3: 'Pago al día',
  4: 'Pago Anual',
  5: 'Pago Bimensual',
  6: 'Pago Contra Entrega Conforme',
  7: 'Pagos Mensuales',
  8: 'Pago Por Estado de Avance',
  9: 'Pago Trimestral',
  10: 'Pago a 60 días'
};

const TIPOS_ESTIMACION = {
  1: 'Presupuesto Disponible',
  2: 'Precio Referencial',
  3: 'Monto no es posible de estimar'
};

const UNIDADES_TIEMPO = {
  1: 'Horas',
  2: 'Días',
  3: 'Semanas',
  4: 'Meses',
  5: 'Años'
};

// Cola secuencial para llamadas de detalle y evitar HTTP 429 (peticiones simultáneas)
let requestQueue = Promise.resolve();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function enqueueApiCall(fn) {
  const run = async () => {
    await sleep(320);
    return fn();
  };
  const next = requestQueue.then(run, run);
  requestQueue = next.catch(() => {});
  return next;
}

async function fetchWithRetry(url, params, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axiosInstance.get(url, { params });
      return response.data;
    } catch (error) {
      if (error.response?.status === 429 && i < retries - 1) {
        await sleep(800 * (i + 1));
        continue;
      }
      throw error;
    }
  }
}

function extraerTipoDesdeCodigo(codigoExterno) {
  if (!codigoExterno) return '';
  const match = String(codigoExterno).toUpperCase().match(/-(L1|LE|LP|LQ|LR|LS|E2|CO|B2|H2|I2)\d{2}$/);
  if (match) return match[1];
  const parts = String(codigoExterno).split('-');
  if (parts.length >= 3) {
    const suffix = parts[parts.length - 1].replace(/\d+/g, '').toUpperCase();
    if (TRAMOS_TIPO[suffix]) return suffix;
  }
  return '';
}

function calcularDiasRestantes(fechaCierre) {
  if (!fechaCierre) return null;
  const cierre = new Date(fechaCierre);
  if (isNaN(cierre.getTime())) return null;
  const diffMs = cierre.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// ===== Mapa de fechas de publicación (para ordenar "Más nuevas primero" como Mercado Público) =====
// El listado 'activas' no trae FechaPublicacion; la reconstruimos consultando
// licitaciones.json?fecha=DDMMYYYY&estado=publicada de los últimos N días.
const DIAS_MAPA_PUBLICACION = 14;
const publicacionMap = new Map(); // CodigoExterno -> 'YYYY-MM-DD'
const diasMapaCargados = new Map(); // 'DDMMYYYY' -> timestamp de carga
let mapaPublicacionEnCurso = null;

function fechaDiaOffset(offset) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return { ddmmyyyy: `${dd}${mm}${yyyy}`, iso: `${yyyy}-${mm}-${dd}` };
}

async function cargarDiaPublicacion(offset) {
  const { ddmmyyyy, iso } = fechaDiaOffset(offset);
  const ttl = offset === 0 ? 10 * 60 * 1000 : 12 * 60 * 60 * 1000;
  const cargado = diasMapaCargados.get(ddmmyyyy);
  if (cargado && Date.now() - cargado < ttl) return;
  const data = await fetchWithRetry(`${API_URL}/licitaciones.json`, { ticket: TICKET, fecha: ddmmyyyy, estado: 'publicada' }, 4);
  for (const item of data?.Listado || []) {
    const prev = publicacionMap.get(item.CodigoExterno);
    // Conservar la fecha más antigua (la de publicación real)
    if (!prev || iso < prev) publicacionMap.set(item.CodigoExterno, iso);
  }
  diasMapaCargados.set(ddmmyyyy, Date.now());
}

// Carga hoy de forma bloqueante (rápido) y el resto de días en segundo plano
async function asegurarMapaPublicacion() {
  try {
    await cargarDiaPublicacion(0);
  } catch (e) {
    console.warn('No se pudo cargar publicaciones de hoy:', e.message);
  }
  if (!mapaPublicacionEnCurso) {
    mapaPublicacionEnCurso = (async () => {
      for (let i = 1; i < DIAS_MAPA_PUBLICACION; i++) {
        try {
          await sleep(1500);
          await cargarDiaPublicacion(i);
        } catch (e) {
          console.warn(`Mapa publicación día -${i}:`, e.message);
        }
      }
    })().finally(() => { mapaPublicacionEnCurso = null; });
  }
}

function fechaPublicacionDe(item) {
  if (item.FechaPublicacion) return String(item.FechaPublicacion).slice(0, 10);
  return publicacionMap.get(item.CodigoExterno) || '';
}

function getCacheKey(estado, fecha) {
  return `${estado || 'activas'}_${fecha || 'all'}`;
}

function getListadoFromCache(key) {
  const entry = listadoCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  listadoCache.delete(key);
  return null;
}

function setListadoCache(key, data) {
  listadoCache.set(key, { data, timestamp: Date.now() });
}

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  // Si ya viene en formato ddmmaaaa
  if (/^\d{8}$/.test(dateStr)) return dateStr;
  // Si viene en YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [yyyy, mm, dd] = dateStr.split('-');
    return `${dd}${mm}${yyyy}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
};

const formatDateToday = () => formatDate(new Date());

function getDescripcionEstado(codigo) {
  const estados = {
    '5': 'Publicada', '6': 'Cerrada', '7': 'Desierta',
    '8': 'Adjudicada', '18': 'Revocada', '19': 'Suspendida'
  };
  return estados[String(codigo)] || 'Publicada';
}

function normalizarDetalle(item) {
  const tipo = item.Tipo || extraerTipoDesdeCodigo(item.CodigoExterno);
  const infoTramo = TRAMOS_TIPO[tipo] || null;
  const fechaCierre = item.Fechas?.FechaCierre || item.FechaCierre || null;
  const montoExacto = item.MontoEstimado ? Number(item.MontoEstimado) : null;
  const montoMaximoTramo = infoTramo?.maxCLP || null;
  const montoMinimoTramo = infoTramo?.minCLP || 0;

  return {
    CodigoExterno: item.CodigoExterno,
    Nombre: item.Nombre,
    CodigoEstado: item.CodigoEstado,
    Estado: item.Estado || getDescripcionEstado(item.CodigoEstado),
    Descripcion: item.Descripcion || '',
    FechaCierre: fechaCierre,
    DiasRestantes: calcularDiasRestantes(fechaCierre),
    DiasCierreLicitacion: item.DiasCierreLicitacion,

    // Comprador y Ubicación
    CodigoOrganismo: item.Comprador?.CodigoOrganismo || '',
    NombreOrganismo: item.Comprador?.NombreOrganismo || '',
    RutUnidad: item.Comprador?.RutUnidad || '',
    NombreUnidad: item.Comprador?.NombreUnidad || '',
    DireccionUnidad: item.Comprador?.DireccionUnidad || '',
    ComunaUnidad: item.Comprador?.ComunaUnidad || '',
    RegionUnidad: (item.Comprador?.RegionUnidad || '').trim(),
    NombreUsuario: item.Comprador?.NombreUsuario || '',
    CargoUsuario: item.Comprador?.CargoUsuario || '',

    // Clasificación y Montos
    Tipo: tipo,
    DescripcionTipo: infoTramo?.nombre || tipo || 'Licitación Pública',
    Convocatoria: item.TipoConvocatoria == 1 ? 'Abierta' : (infoTramo?.convocatoria || 'Pública'),
    CodigoTipo: item.CodigoTipo,
    Moneda: item.Moneda || 'CLP',
    MontoEstimado: montoExacto || 0,
    MontoExactoDisponible: Boolean(montoExacto && montoExacto > 0),
    MontoMinimoEstimadoCLP: montoExacto || montoMinimoTramo,
    MontoMaximoEstimadoCLP: montoExacto || montoMaximoTramo,
    RangoUTM: infoTramo ? (infoTramo.maxUTM ? `${infoTramo.minUTM} a ${infoTramo.maxUTM.toLocaleString('es-CL')} UTM` : `Más de ${infoTramo.minUTM.toLocaleString('es-CL')} UTM`) : 'No especificado',
    VisibilidadMonto: item.VisibilidadMonto,
    Estimacion: item.Estimacion,
    TipoEstimacionTexto: TIPOS_ESTIMACION[item.Estimacion] || 'Según bases de licitación',
    JustificacionMontoEstimado: item.JustificacionMontoEstimado || '',
    FuenteFinanciamiento: item.FuenteFinanciamiento || '',

    // Condiciones Contractuales
    Modalidad: item.Modalidad,
    ModalidadPagoTexto: MODALIDADES_PAGO[item.Modalidad] || 'Según bases',
    TiempoDuracionContrato: item.TiempoDuracionContrato,
    UnidadTiempoDuracionContrato: item.UnidadTiempoDuracionContrato,
    DuracionContratoTexto: item.TiempoDuracionContrato
      ? `${item.TiempoDuracionContrato} ${UNIDADES_TIEMPO[item.UnidadTiempoDuracionContrato] || 'Meses'}`
      : 'Según bases',
    SubContratacion: item.SubContratacion == 1 || item.SubContratacion === '1',
    EsRenovable: item.EsRenovable == 1 || item.EsRenovable === '1',
    ExtensionPlazo: item.ExtensionPlazo == 1,
    TomaRazon: item.TomaRazon == 1 || item.TomaRazon === '1',
    Obras: item.Obras == 2 || item.Obras === '2',
    CantidadReclamos: item.CantidadReclamos || 0,
    NombreResponsableContrato: item.NombreResponsableContrato || '',
    EmailResponsableContrato: item.EmailResponsableContrato || '',
    FonoResponsableContrato: item.FonoResponsableContrato || '',
    NombreResponsablePago: item.NombreResponsablePago || '',
    EmailResponsablePago: item.EmailResponsablePago || '',
    DireccionVisita: item.DireccionVisita || '',
    DireccionEntrega: item.DireccionEntrega || '',

    // Fechas Clave
    Fechas: {
      FechaCreacion: item.Fechas?.FechaCreacion || null,
      FechaPublicacion: item.Fechas?.FechaPublicacion || null,
      FechaInicioPreguntas: item.Fechas?.FechaInicio || null,
      FechaFinalPreguntas: item.Fechas?.FechaFinal || null,
      FechaPublicacionRespuestas: item.Fechas?.FechaPubRespuestas || null,
      FechaVisitaTerreno: item.Fechas?.FechaVisitaTerreno || null,
      FechaEntregaAntecedentes: item.Fechas?.FechaEntregaAntecedentes || null,
      FechaCierre: fechaCierre,
      FechaActoAperturaTecnica: item.Fechas?.FechaActoAperturaTecnica || null,
      FechaActoAperturaEconomica: item.Fechas?.FechaActoAperturaEconomica || null,
      FechaEstimadaAdjudicacion: item.Fechas?.FechaEstimadaAdjudicacion || item.Fechas?.FechaAdjudicacion || null,
      FechaAdjudicacion: item.Fechas?.FechaAdjudicacion || null,
      FechaEstimadaFirma: item.Fechas?.FechaEstimadaFirma || null,
      FechaTiempoEvaluacion: item.Fechas?.FechaTiempoEvaluacion || null
    },
    FechaPublicacion: item.Fechas?.FechaPublicacion || '',
    FechaCreacion: item.Fechas?.FechaCreacion || '',
    FechaInicio: item.Fechas?.FechaInicio || '',
    FechaFinal: item.Fechas?.FechaFinal || '',
    FechaPubRespuestas: item.Fechas?.FechaPubRespuestas || '',
    FechaActoAperturaTecnica: item.Fechas?.FechaActoAperturaTecnica || '',
    FechaEstimadaAdjudicacion: item.Fechas?.FechaEstimadaAdjudicacion || item.Fechas?.FechaAdjudicacion || '',
    FechaVisitaTerreno: item.Fechas?.FechaVisitaTerreno || '',

    Etapas: item.Etapas,
    Adjudicacion: item.Adjudicacion || null,
    Items: item.Items || { Cantidad: 0, Listado: [] },
    DetalleEnriquecido: true
  };
}

function normalizarListado(item) {
  const tipo = item.Tipo || extraerTipoDesdeCodigo(item.CodigoExterno);
  const infoTramo = TRAMOS_TIPO[tipo] || null;
  const montoExacto = item.MontoEstimado ? Number(item.MontoEstimado) : null;

  return {
    CodigoExterno: item.CodigoExterno,
    Nombre: item.Nombre,
    CodigoEstado: item.CodigoEstado,
    Estado: getDescripcionEstado(item.CodigoEstado),
    FechaCierre: item.FechaCierre,
    DiasRestantes: calcularDiasRestantes(item.FechaCierre),
    Tipo: tipo,
    DescripcionTipo: infoTramo?.nombre || tipo || 'Licitación',
    Convocatoria: infoTramo?.convocatoria || 'Pública',
    MontoEstimado: montoExacto || 0,
    MontoExactoDisponible: Boolean(montoExacto && montoExacto > 0),
    MontoMinimoEstimadoCLP: montoExacto || (infoTramo?.minCLP ?? 0),
    MontoMaximoEstimadoCLP: montoExacto || (infoTramo?.maxCLP ?? null),
    RangoUTM: infoTramo ? (infoTramo.maxUTM ? `${infoTramo.minUTM} - ${infoTramo.maxUTM.toLocaleString('es-CL')} UTM` : `> ${infoTramo.minUTM.toLocaleString('es-CL')} UTM`) : 'N/A',
    Moneda: item.Moneda || 'CLP',
    NombreOrganismo: item.Comprador?.NombreOrganismo || '',
    RegionUnidad: (item.Comprador?.RegionUnidad || '').trim(),
    ComunaUnidad: item.Comprador?.ComunaUnidad || '',
    CodigoTipo: item.CodigoTipo || '',
    Fechas: {
      FechaCierre: item.FechaCierre,
      FechaPublicacion: null,
      FechaFinalPreguntas: null,
      FechaEstimadaAdjudicacion: null
    },
    DetalleEnriquecido: false
  };
}

async function obtenerCachesDesdeDB(codigos) {
  if (!codigos || codigos.length === 0) return {};
  const map = {};
  const faltantes = [];

  for (const cod of codigos) {
    if (detalleMemoryCache.has(cod)) {
      map[cod] = detalleMemoryCache.get(cod);
    } else {
      faltantes.push(cod);
    }
  }

  if (faltantes.length > 0) {
    try {
      const registros = await LicitacionCache.findAll({
        where: { codigoExterno: { [Op.in]: faltantes } }
      });
      for (const reg of registros) {
        if (reg.datos) {
          const norm = reg.datos.DetalleEnriquecido ? reg.datos : normalizarDetalle(reg.datos);
          norm.DiasRestantes = calcularDiasRestantes(norm.FechaCierre);
          detalleMemoryCache.set(reg.codigoExterno, norm);
          map[reg.codigoExterno] = norm;
        }
      }
    } catch (err) {
      console.error('Error leyendo cache DB:', err.message);
    }
  }

  return map;
}

async function guardarDetalleEnCache(codigo, detalleNormalizado) {
  detalleMemoryCache.set(codigo, detalleNormalizado);
  try {
    await LicitacionCache.upsert({
      codigoExterno: codigo,
      datos: detalleNormalizado
    });
  } catch (err) {
    // No bloquear si falla escritura en cache
  }
}

export const mercadoPublicoService = {
  // Detalle completo de una licitación o Compra Ágil COT (con caché en PostgreSQL y memoria)
  async getLicitacionPorCodigo(codigo) {
    const codLimpio = String(codigo || '').trim();
    if (!codLimpio) return { Cantidad: 0, Listado: [] };

    if (detalleMemoryCache.has(codLimpio)) {
      const cached = detalleMemoryCache.get(codLimpio);
      cached.DiasRestantes = calcularDiasRestantes(cached.FechaCierre);
      return { Cantidad: 1, Listado: [cached] };
    }

    try {
      const dbRecord = await LicitacionCache.findByPk(codLimpio);
      if (dbRecord && dbRecord.datos) {
        const norm = dbRecord.datos.DetalleEnriquecido ? dbRecord.datos : normalizarDetalle(dbRecord.datos);
        norm.DiasRestantes = calcularDiasRestantes(norm.FechaCierre);
        detalleMemoryCache.set(codLimpio, norm);
        return { Cantidad: 1, Listado: [norm] };
      }
    } catch (e) {
      // Continuar a API
    }

    // Si es una Compra Ágil (ej: 4079-372-COT26), consultar directamente api.buscador.mercadopublico.cl
    if (/-COT\d+$/i.test(codLimpio)) {
      try {
        const respCot = await axios.get(COMPRA_AGIL_CLOUD_URL, {
          headers: COMPRA_AGIL_HEADERS,
          params: { action: 'ficha', code: codLimpio },
          timeout: 10000
        });
        const ficha = respCot.data?.payload;
        if (ficha && ficha.codigo) {
          const detalleCot = normalizarDetalleCompraAgil(ficha);
          await guardarDetalleEnCache(codLimpio, detalleCot);
          return { Cantidad: 1, Listado: [detalleCot] };
        }
      } catch (err) {
        console.error(`Error obteniendo ficha Compra Ágil ${codLimpio}:`, err.message);
      }
      return { Cantidad: 0, Listado: [] };
    }

    const data = await enqueueApiCall(() =>
      fetchWithRetry(`${API_URL}/licitaciones.json`, { codigo: codLimpio, ticket: TICKET })
    );
    const listado = data?.Listado || [];
    if (listado.length > 0) {
      const detalle = normalizarDetalle(listado[0]);
      await guardarDetalleEnCache(codLimpio, detalle);
      return { Cantidad: 1, Listado: [detalle] };
    }
    return { Cantidad: 0, Listado: [] };
  },

  // Fusionar un listado con todos los detalles ya guardados en PostgreSQL (sin llamadas extra a la API)
  async fusionarConCacheDB(listado = []) {
    const codigos = listado.map(i => i.CodigoExterno).filter(Boolean);
    const mapa = await obtenerCachesDesdeDB(codigos);
    return listado.map(item => {
      const det = mapa[item.CodigoExterno];
      return det ? { ...item, ...det } : item;
    });
  },

  // Enriquecer un lote de códigos en segundo plano o bajo demanda
  async enriquecerLote(codigos = []) {
    const unicos = [...new Set(codigos)].slice(0, 30);
    const existentes = await obtenerCachesDesdeDB(unicos);
    const resultados = {};

    for (const codigo of unicos) {
      if (existentes[codigo]) {
        resultados[codigo] = existentes[codigo];
      } else {
        try {
          const res = await this.getLicitacionPorCodigo(codigo);
          if (res.Listado?.[0]) {
            resultados[codigo] = res.Listado[0];
          }
        } catch (err) {
          console.error(`Error enriqueciendo ${codigo}:`, err.message);
        }
      }
    }
    return resultados;
  },

  // Listado básico con cache en memoria (10 min TTL)
  // Nota clave: Si estado es 'activas' o 'publicada' sin fecha explícita, usamos estado='activas' en la API
  // que devuelve TODAS las licitaciones abiertas del país (~5.300+), en lugar de solo las ~45 creadas hoy.
  async getListado(estado = 'activas', fecha = null) {
    const fechaFormateada = formatDate(fecha);
    const usarActivasGlobal = (!estado || estado === 'activas' || estado === 'publicada' || estado === 'todos') && !fechaFormateada;
    const apiEstado = usarActivasGlobal ? 'activas' : estado;
    const cacheKey = getCacheKey(apiEstado, fechaFormateada);

    let listado = getListadoFromCache(cacheKey);
    if (!listado) {
      const params = { ticket: TICKET };

      if (usarActivasGlobal) {
        params.estado = 'activas';
      } else {
        if (estado && estado !== 'todos') {
          params.estado = estado;
        }
        params.fecha = fechaFormateada || formatDateToday();
      }

      console.log(`Consultando API MercadoPúblico: estado=${params.estado || 'todos'}, fecha=${params.fecha || 'todas las activas'}...`);
      const data = await fetchWithRetry(`${API_URL}/licitaciones.json`, params);
      listado = (data?.Listado || []).map(normalizarListado);
      setListadoCache(cacheKey, listado);
      console.log(`Listado obtenido: ${cacheKey} (${listado.length} licitaciones)`);
    }

    // Fusionar con cualquier detalle ya enriquecido en memoria para máxima riqueza de datos
    return listado.map(item => {
      if (detalleMemoryCache.has(item.CodigoExterno)) {
        return detalleMemoryCache.get(item.CodigoExterno);
      }
      return item;
    });
  },

  // Licitaciones activas en todo Chile
  async getLicitacionesActivas() {
    return this.getListado('activas');
  },

  // Licitaciones publicadas el día de hoy
  async getLicitacionesHoy() {
    return this.getListado('todos', new Date());
  },

  // Licitaciones por fecha específica
  async getLicitacionesPorFecha(fecha) {
    return this.getListado('todos', fecha);
  },

  // Licitaciones por estado
  async getLicitacionesPorEstado(estado, fecha) {
    return this.getListado(estado, fecha);
  },

  // Licitaciones por proveedor
  async getLicitacionesPorProveedor(codigoProveedor, fecha) {
    const listado = await this.getListado('activas', fecha);
    return listado.filter(item =>
      item.Nombre?.toLowerCase().includes(codigoProveedor.toLowerCase()) ||
      String(item.CodigoExterno)?.toLowerCase().includes(codigoProveedor.toLowerCase())
    );
  },

  // Licitaciones por organismo
  async getLicitacionesPorOrganismo(codigoOrganismo, fecha) {
    const listado = await this.getListado('activas', fecha);
    return listado.filter(item =>
      item.NombreOrganismo?.toLowerCase().includes(codigoOrganismo.toLowerCase()) ||
      String(item.CodigoExterno)?.toLowerCase().includes(codigoOrganismo.toLowerCase())
    );
  },

  // BÚSQUEDA AVANZADA INTEGRAL
  async buscar({
    estado = 'activas',
    fecha = null,
    regiones = [],
    tipo = '',
    precioMin = null,
    precioMax = null,
    palabraClave = '',
    palabrasClave = [],
    palabrasExcluidas = '',
    soloCierreProximo = false,
    ordenarPor = 'recientes_desc',
    pagina = 1,
    porPagina = 24,
    enriquecerPagina = true
  } = {}) {
    // Si el usuario buscó un código directo de Compra Ágil (ej: 4079-372-COT26) desde /licitaciones
    const kwTrim = String(palabraClave || '').trim();
    if (/-COT\d+$/i.test(kwTrim)) {
      const cotRes = await this.getLicitacionPorCodigo(kwTrim);
      const itemsCot = cotRes.Listado || [];
      return {
        Cantidad: itemsCot.length,
        Total: itemsCot.length,
        Pagina: 1,
        PorPagina: Number(porPagina),
        TotalPaginas: 1,
        Estadisticas: { porTipo: { COT: itemsCot.length }, utmActual: UTM_CLP },
        Listado: itemsCot
      };
    }

    let listado = await this.getListado(estado, fecha);

    if (listado.length === 0) {
      return { Cantidad: 0, Total: 0, Pagina: pagina, TotalPaginas: 0, Listado: [], Estadisticas: {} };
    }

    // Precargar detalles cacheados en DB si existen para mejorar filtrado por región/organismo
    if (detalleMemoryCache.size === 0) {
      try {
        const todosCache = await LicitacionCache.findAll({ limit: 1000 });
        for (const reg of todosCache) {
          if (reg.datos) {
            detalleMemoryCache.set(reg.codigoExterno, reg.datos);
          }
        }
        listado = listado.map(item => detalleMemoryCache.get(item.CodigoExterno) || item);
      } catch (e) {
        // Ignorar error de precarga
      }
    }

    // 1. Filtro por Tipo de Licitación (L1, LE, LP, LQ, LR, etc.)
    if (tipo && tipo !== 'todos' && tipo !== '') {
      const tiposArray = Array.isArray(tipo) ? tipo : tipo.split(',').map(t => t.trim().toUpperCase());
      listado = listado.filter(item => tiposArray.includes(item.Tipo));
    }

    // 2. Filtro por Múltiples Palabras Clave seleccionadas (OR entre etiquetas seleccionadas o separadas por coma)
    const listaEtiquetas = [
      ...(Array.isArray(palabrasClave) ? palabrasClave : []),
      ...(kwTrim.includes(',') ? kwTrim.split(',') : [])
    ].map(s => String(s).trim().toLowerCase()).filter(s => s.length >= 2);

    if (listaEtiquetas.length > 0) {
      const regexes = listaEtiquetas.map(kw => {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|[^a-záéíóúñ0-9])${escaped}([^a-záéíóúñ0-9]|$)`, 'i');
      });
      listado = listado.filter(item => {
        const texto = `${item.Nombre || ''} ${item.CodigoExterno || ''} ${item.NombreOrganismo || ''} ${item.Descripcion || ''} ${item.RegionUnidad || ''} ${item.ComunaUnidad || ''}`;
        return regexes.some(rx => rx.test(texto));
      });
    }

    // 2a. Filtro adicional de texto libre (cuando no lleva comas)
    if (kwTrim !== '' && !kwTrim.includes(',')) {
      const terminos = kwTrim.toLowerCase().split(/\s+/);
      listado = listado.filter(item => {
        const texto = `${item.Nombre || ''} ${item.CodigoExterno || ''} ${item.NombreOrganismo || ''} ${item.Descripcion || ''} ${item.RegionUnidad || ''} ${item.ComunaUnidad || ''}`.toLowerCase();
        return terminos.every(t => texto.includes(t));
      });
    }

    // 2b. Filtro por Palabras Excluidas (Negativas)
    if (palabrasExcluidas && String(palabrasExcluidas).trim() !== '') {
      const negArray = (Array.isArray(palabrasExcluidas)
        ? palabrasExcluidas
        : String(palabrasExcluidas).split(/[,;.\n]+/)
      ).map(s => s.trim().toLowerCase()).filter(s => s.length >= 2);

      if (negArray.length > 0) {
        listado = listado.filter(item => {
          const texto = `${item.Nombre || ''} ${item.Descripcion || ''} ${item.NombreOrganismo || ''}`.toLowerCase();
          return !negArray.some(neg => texto.includes(neg));
        });
      }
    }

    // 3. Filtro por Región / Institución
    if (regiones && regiones.length > 0) {
      const regArray = (Array.isArray(regiones) ? regiones : [regiones]).filter(r => r && r.trim() !== '');
      if (regArray.length > 0) {
        listado = listado.filter(item => {
          const textoUbicacion = `${item.RegionUnidad || ''} ${item.ComunaUnidad || ''} ${item.NombreOrganismo || ''} ${item.Nombre || ''}`.toLowerCase();
          return regArray.some(reg => textoUbicacion.includes(reg.toLowerCase().trim()));
        });
      }
    }

    // 4. Filtro por Monto Mínimo y Monto Máximo (usando MontoEstimado exacto o el Tramo Oficial en CLP)
    if (precioMin !== undefined && precioMin !== null && precioMin !== '' && Number(precioMin) > 0) {
      const minVal = Number(precioMin);
      listado = listado.filter(item => {
        if (item.MontoExactoDisponible && item.MontoEstimado > 0) {
          return item.MontoEstimado >= minVal;
        }
        const techoTramo = item.MontoMaximoEstimadoCLP;
        return techoTramo === null || techoTramo >= minVal;
      });
    }

    if (precioMax !== undefined && precioMax !== null && precioMax !== '' && Number(precioMax) > 0) {
      const maxVal = Number(precioMax);
      listado = listado.filter(item => {
        if (item.MontoExactoDisponible && item.MontoEstimado > 0) {
          return item.MontoEstimado <= maxVal;
        }
        const pisoTramo = item.MontoMinimoEstimadoCLP || 0;
        return pisoTramo <= maxVal;
      });
    }

    // 5. Filtro por Cierre Próximo (próximos 7 días)
    if (soloCierreProximo) {
      listado = listado.filter(item => item.DiasRestantes !== null && item.DiasRestantes >= 0 && item.DiasRestantes <= 7);
    }

    // 6. Ordenamiento
    if (ordenarPor === 'recientes_desc') {
      await asegurarMapaPublicacion();
      listado = listado.map(item => {
        const fp = fechaPublicacionDe(item);
        return fp && !item.FechaPublicacion ? { ...item, FechaPublicacion: fp } : item;
      });
    }
    listado.sort((a, b) => {
      if (ordenarPor === 'recientes_desc') {
        const pa = fechaPublicacionDe(a);
        const pb = fechaPublicacionDe(b);
        if (pa !== pb) return pa < pb ? 1 : -1; // más nueva primero; sin fecha al final
        // Desempate: la de cierre más lejano suele ser la más recién publicada
        const ca = a.FechaCierre ? new Date(a.FechaCierre).getTime() : 0;
        const cb = b.FechaCierre ? new Date(b.FechaCierre).getTime() : 0;
        return cb - ca;
      }
      if (ordenarPor === 'cierre_asc') {
        const da = a.FechaCierre ? new Date(a.FechaCierre).getTime() : Infinity;
        const db = b.FechaCierre ? new Date(b.FechaCierre).getTime() : Infinity;
        return da - db;
      }
      if (ordenarPor === 'cierre_desc') {
        const da = a.FechaCierre ? new Date(a.FechaCierre).getTime() : 0;
        const db = b.FechaCierre ? new Date(b.FechaCierre).getTime() : 0;
        return db - da;
      }
      if (ordenarPor === 'monto_desc') {
        const ma = a.MontoEstimado || a.MontoMaximoEstimadoCLP || 9999999999;
        const mb = b.MontoEstimado || b.MontoMaximoEstimadoCLP || 9999999999;
        return mb - ma;
      }
      if (ordenarPor === 'monto_asc') {
        const ma = a.MontoEstimado || a.MontoMinimoEstimadoCLP || 0;
        const mb = b.MontoEstimado || b.MontoMinimoEstimadoCLP || 0;
        return ma - mb;
      }
      return 0;
    });

    // Estadísticas rápidas del conjunto filtrado
    const porTipo = {};
    listado.forEach(item => {
      const t = item.Tipo || 'Otro';
      porTipo[t] = (porTipo[t] || 0) + 1;
    });

    const totalFiltrado = listado.length;
    const totalPaginas = Math.ceil(totalFiltrado / porPagina);
    const inicio = (pagina - 1) * porPagina;
    let paginaItems = listado.slice(inicio, inicio + porPagina);

    if (enriquecerPagina && paginaItems.length > 0) {
      const codigosPagina = paginaItems.map(i => i.CodigoExterno);
      const cachesDB = await obtenerCachesDesdeDB(codigosPagina);
      paginaItems = paginaItems.map(item => cachesDB[item.CodigoExterno] || item);

      const faltantes = paginaItems.filter(i => !i.DetalleEnriquecido).slice(0, 6);
      if (faltantes.length > 0) {
        Promise.resolve().then(async () => {
          for (const f of faltantes) {
            try {
              await this.getLicitacionPorCodigo(f.CodigoExterno);
            } catch (e) {}
          }
        });
      }
    }

    return {
      Cantidad: paginaItems.length,
      Total: totalFiltrado,
      Pagina: Number(pagina),
      PorPagina: Number(porPagina),
      TotalPaginas: totalPaginas,
      Estadisticas: {
        porTipo,
        utmActual: UTM_CLP
      },
      Listado: paginaItems
    };
  },

  // BÚSQUEDA COMPRA ÁGIL EN VIVO (api.buscador.mercadopublico.cl COT + Licitaciones Simplificadas L1/E2)
  async buscarComprasAgiles({
    palabraClave = '',
    palabrasClave = [],
    palabrasExcluidas = '',
    region = '',
    precioMin = null,
    precioMax = null,
    modalidad = 'todas', // 'todas', 'cot', 'l1', '30utm'
    soloCierreProximo = false,
    ordenarPor = 'cierre_asc',
    pagina = 1,
    porPagina = 20
  } = {}) {
    const kwTrim = String(palabraClave || '').trim();

    // Si busca por un código COT exacto (ej: 4079-372-COT26), devolver su ficha completa al instante
    if (/-COT\d+$/i.test(kwTrim)) {
      const resDirecta = await this.getLicitacionPorCodigo(kwTrim);
      const itemsDirectos = resDirecta.Listado || [];
      return {
        Cantidad: itemsDirectos.length,
        Total: itemsDirectos.length,
        Pagina: 1,
        PorPagina: Number(porPagina),
        TotalPaginas: 1,
        Fuente: 'Buscador Oficial Compra Ágil (Ficha Directa COT)',
        Tope30UTM: 30 * UTM_CLP,
        Tope100UTM: 100 * UTM_CLP,
        Listado: itemsDirectos
      };
    }

    const etiquetasActivas = [
      ...(Array.isArray(palabrasClave) ? palabrasClave : []),
      ...(kwTrim.includes(',') ? kwTrim.split(',') : (kwTrim ? [kwTrim] : []))
    ].map(s => String(s).trim()).filter(s => s.length >= 2);
    const etiquetasUnicas = [...new Set(etiquetasActivas)];

    let itemsCotCloud = [];
    let totalCloudCount = 0;
    let fuenteDatos = 'Buscador Oficial Compra Ágil (COT en vivo) + Licitaciones Simplificadas (< 100 UTM)';

    // 1. Consultar el buscador oficial en la nube (api.buscador.mercadopublico.cl/compra-agil)
    if (modalidad !== 'l1') {
      try {
        const regionCode = obtenerCodigoRegionCompraAgil(region);
        const maxBudgetParam = modalidadeMaxCLP(modalidad, precioMax);
        const baseParams = {
          status: 2, // 2 = Publicada
          order_by: 'recent'
        };
        if (regionCode && regionCode !== 'all') baseParams.region = regionCode;
        if (precioMin && Number(precioMin) > 0) baseParams.min_budget = Number(precioMin);
        if (maxBudgetParam && Number(maxBudgetParam) > 0 && modalidad === '30utm') {
          baseParams.max_budget = Number(maxBudgetParam);
        } else if (precioMax && Number(precioMax) > 0) {
          baseParams.max_budget = Number(precioMax);
        }

        if (etiquetasUnicas.length <= 1) {
          // Búsqueda general o con 1 palabra clave: paginación directa contra las ~8.900+ Compras Ágiles
          const params1 = { ...baseParams, page_number: Number(pagina) || 1 };
          if (etiquetasUnicas[0]) params1.keywords = etiquetasUnicas[0];

          const cacheKeyCA = `ca_${JSON.stringify(params1)}`;
          const cachedCA = getListadoFromCache(cacheKeyCA);
          if (cachedCA) {
            totalCloudCount = cachedCA.totalCloudCount;
            itemsCotCloud = cachedCA.itemsCotCloud;
          } else {
            const resp1 = await axios.get(COMPRA_AGIL_CLOUD_URL, {
              headers: COMPRA_AGIL_HEADERS,
              params: params1,
              timeout: 18000
            });
            const payload1 = resp1.data?.payload || {};
            totalCloudCount = Number(payload1.resultCount || 0);
            const resultados1 = Array.isArray(payload1.resultados) ? payload1.resultados : [];
            itemsCotCloud = resultados1.map(normalizarItemListadoCompraAgil);
            setListadoCache(cacheKeyCA, { totalCloudCount, itemsCotCloud });
          }
        } else {
          // Múltiples palabras clave seleccionadas (ej: usuario marcó varias o "Seleccionar Todas")
          const terminosConsulta = etiquetasUnicas.slice(0, 6);
          const promesas = terminosConsulta.map(kw =>
            axios.get(COMPRA_AGIL_CLOUD_URL, {
              headers: COMPRA_AGIL_HEADERS,
              params: { ...baseParams, keywords: kw, page_number: Number(pagina) || 1 },
              timeout: 15000
            }).catch(() => null)
          );
          const respuestas = await Promise.all(promesas);
          const vistos = new Set();
          for (const r of respuestas) {
            const p = r?.data?.payload;
            if (!p) continue;
            totalCloudCount += Number(p.resultCount || 0);
            for (const item of (p.resultados || [])) {
              if (!vistos.has(item.codigo)) {
                vistos.add(item.codigo);
                itemsCotCloud.push(normalizarItemListadoCompraAgil(item));
              }
            }
          }
        }
      } catch (err) {
        console.error('Aviso consultando api.buscador.mercadopublico.cl/compra-agil:', err.message);
      }
    }

    // Filtrar palabras excluidas sobre los resultados COT
    if (palabrasExcluidas && String(palabrasExcluidas).trim() !== '' && itemsCotCloud.length > 0) {
      const negArray = (Array.isArray(palabrasExcluidas)
        ? palabrasExcluidas
        : String(palabrasExcluidas).split(/[,;.\n]+/)
      ).map(s => s.trim().toLowerCase()).filter(s => s.length >= 2);
      if (negArray.length > 0) {
        itemsCotCloud = itemsCotCloud.filter(item => {
          const texto = `${item.Nombre || ''} ${item.Descripcion || ''} ${item.NombreOrganismo || ''}`.toLowerCase();
          return !negArray.some(neg => texto.includes(neg));
        });
      }
    }

    // 2. Obtener contrataciones simplificadas L1 y E2 (< 100 UTM) si modalidad lo incluye
    let listaL1 = [];
    if (modalidad === 'todas' || modalidad === 'l1' || modalidad === '30utm') {
      const resRapidas = await this.buscar({
        estado: 'activas',
        tipo: ['L1', 'E2'],
        palabraClave: etiquetasUnicas.length === 1 ? etiquetasUnicas[0] : '',
        palabrasClave: etiquetasUnicas.length > 1 ? etiquetasUnicas : [],
        palabrasExcluidas,
        regiones: region ? [region] : [],
        precioMin,
        precioMax: modalidadeMaxCLP(modalidad, precioMax),
        soloCierreProximo,
        ordenarPor,
        pagina: Number(pagina) || 1,
        porPagina: modalidad === 'l1' ? porPagina : 8,
        enriquecerPagina: false
      });

      listaL1 = (resRapidas.Listado || []).map(item => ({
        ...item,
        EsCompraAgilCot: false,
        DescripcionTipo: item.MontoExactoDisponible && item.MontoEstimado <= 30 * UTM_CLP
          ? 'Compra Rápida ≤ 30 UTM'
          : 'Licitación Simplificada L1 (< 100 UTM)',
        UrlExterna: `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${item.CodigoExterno}`
      }));
    }

    let paginaItems = modalidad === 'l1'
      ? listaL1
      : modalidad === 'cot'
        ? itemsCotCloud
        : [...itemsCotCloud, ...listaL1];

    if (soloCierreProximo) {
      paginaItems = paginaItems.filter(item => item.DiasRestantes !== null && item.DiasRestantes >= 0 && item.DiasRestantes <= 7);
    }

    // Fusionar con cualquier detalle ya enriquecido en DB
    const codigosPagina = paginaItems.map(i => i.CodigoExterno);
    const cachesDB = await obtenerCachesDesdeDB(codigosPagina);
    paginaItems = paginaItems.map(item => cachesDB[item.CodigoExterno] ? { ...item, ...cachesDB[item.CodigoExterno] } : item);

    const totalGlobal = modalidad === 'l1'
      ? listaL1.length
      : Math.max(paginaItems.length, totalCloudCount + listaL1.length);
    const totalPaginas = Math.max(1, Math.ceil(totalGlobal / 15));

    return {
      Cantidad: paginaItems.length,
      Total: totalGlobal,
      Pagina: Number(pagina),
      PorPagina: Number(porPagina),
      TotalPaginas: totalPaginas,
      Fuente: fuenteDatos,
      Tope30UTM: 30 * UTM_CLP,
      Tope100UTM: 100 * UTM_CLP,
      Listado: paginaItems
    };
  },

  getDescripcionEstado,
  TRAMOS_TIPO
};

function modalidadeMaxCLP(modalidad, precioMaxUsuario) {
  if (precioMaxUsuario && Number(precioMaxUsuario) > 0) return Number(precioMaxUsuario);
  if (modalidad === '30utm') return 30 * UTM_CLP;
  return 100 * UTM_CLP;
}
