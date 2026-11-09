import axios from 'axios';
import dotenv from 'dotenv';
import { Op } from 'sequelize';
import { LicitacionCache } from '../db/sequelize.js';

dotenv.config();

const API_URL = process.env.MERCADO_PUBLICO_API_URL || 'https://api.mercadopublico.cl/servicios/v1/publico';
const TICKET = process.env.MERCADO_PUBLICO_TICKET || process.env.MERCADO_PUBLICO_API_KEY || '53CA2806-ED69-4108-9148-6F7B5C1A217F';

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
  // Detalle completo de una licitación (con caché en PostgreSQL y memoria)
  async getLicitacionPorCodigo(codigo) {
    if (detalleMemoryCache.has(codigo)) {
      const cached = detalleMemoryCache.get(codigo);
      cached.DiasRestantes = calcularDiasRestantes(cached.FechaCierre);
      return { Cantidad: 1, Listado: [cached] };
    }

    try {
      const dbRecord = await LicitacionCache.findByPk(codigo);
      if (dbRecord && dbRecord.datos) {
        const norm = dbRecord.datos.DetalleEnriquecido ? dbRecord.datos : normalizarDetalle(dbRecord.datos);
        norm.DiasRestantes = calcularDiasRestantes(norm.FechaCierre);
        detalleMemoryCache.set(codigo, norm);
        return { Cantidad: 1, Listado: [norm] };
      }
    } catch (e) {
      // Continuar a API
    }

    const data = await enqueueApiCall(() =>
      fetchWithRetry(`${API_URL}/licitaciones.json`, { codigo, ticket: TICKET })
    );
    const listado = data?.Listado || [];
    if (listado.length > 0) {
      const detalle = normalizarDetalle(listado[0]);
      await guardarDetalleEnCache(codigo, detalle);
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
    palabrasExcluidas = '',
    soloCierreProximo = false,
    ordenarPor = 'cierre_asc',
    pagina = 1,
    porPagina = 24,
    enriquecerPagina = true
  } = {}) {
    let listado = await this.getListado(estado, fecha);

    if (listado.length === 0) {
      return { Cantidad: 0, Total: 0, Pagina: pagina, TotalPaginas: 0, Listado: [], Estadisticas: {} };
    }

    // Precargar detalles cacheados en DB si existen para mejorar filtrado por región/organismo
    const codigosTotales = listado.map(i => i.CodigoExterno);
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

    // 2. Filtro por Palabra Clave (soporta múltiples términos o búsqueda exacta)
    if (palabraClave && palabraClave.trim() !== '') {
      const terminos = palabraClave.toLowerCase().trim().split(/\s+/);
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
        // Si no tiene monto exacto aún, usamos el techo del tramo oficial para ver si califica
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
    listado.sort((a, b) => {
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

    // Enriquecer automáticamente los primeros resultados de la página que ya estén en DB o enriquecer los top 5 de forma rápida
    if (enriquecerPagina && paginaItems.length > 0) {
      const codigosPagina = paginaItems.map(i => i.CodigoExterno);
      const cachesDB = await obtenerCachesDesdeDB(codigosPagina);
      paginaItems = paginaItems.map(item => cachesDB[item.CodigoExterno] || item);

      // Disparar enriquecimiento asíncrono no bloqueante de los primeros 6 items sin enriquecer
      const faltantes = paginaItems.filter(i => !i.DetalleEnriquecido).slice(0, 6);
      if (faltantes.length > 0) {
        Promise.resolve().then(async () => {
          for (const f of faltantes) {
            try {
              await this.getLicitacionPorCodigo(f.CodigoExterno);
            } catch (e) {
              // Silencioso en background
            }
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

  // BÚSQUEDA COMPRA ÁGIL Y MENORES A 100 UTM (API v2 + Fallback inteligente a L1/E2 <= 100 UTM)
  async buscarComprasAgiles({
    palabraClave = '',
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
    let itemsApiV2 = [];
    let fuenteDatos = 'MercadoPúblico — Compras Ágiles y Contrataciones Simplificadas (< 100 UTM)';

    // 1. Intentar consultar API v2 de Compra Ágil con timeout corto (4.5s) por si está operativa
    if (modalidad === 'todas' || modalidad === 'cot') {
      try {
        const hoy = new Date();
        const ayer = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const paramsV2 = {
          estado: 'publicada',
          publicado_desde: ayer.toISOString(),
          publicado_hasta: hoy.toISOString(),
          tamano_pagina: 30,
          numero_pagina: 1
        };
        if (palabraClave) paramsV2.q = palabraClave;
        const respV2 = await axios.get('https://api2.mercadopublico.cl/v2/compra-agil', {
          headers: { ticket: TICKET, Accept: 'application/json' },
          params: paramsV2,
          timeout: 4500
        });
        const rawItems = respV2.data?.payload?.items || [];
        itemsApiV2 = rawItems.map(ca => ({
          CodigoExterno: ca.codigo,
          Nombre: ca.nombre,
          CodigoEstado: 5,
          Estado: ca.estado?.glosa || 'Publicada',
          Descripcion: ca.descripcion || ca.nombre,
          FechaCierre: ca.fecha_cierre,
          DiasRestantes: calcularDiasRestantes(ca.fecha_cierre),
          Tipo: 'COT',
          EsCompraAgilCot: true,
          DescripcionTipo: 'Compra Ágil (Hasta 30 / 100 UTM)',
          Convocatoria: 'Cotización Directa',
          Moneda: ca.moneda || 'CLP',
          MontoEstimado: Number(ca.presupuesto || ca.monto_estimado || 0),
          MontoExactoDisponible: Boolean(ca.presupuesto || ca.monto_estimado),
          MontoMinimoEstimadoCLP: 0,
          MontoMaximoEstimadoCLP: Number(ca.presupuesto || ca.monto_estimado || (30 * UTM_CLP)),
          RangoUTM: '0 a 30 / 100 UTM',
          NombreOrganismo: ca.institucion?.nombre || ca.organismo || '',
          RegionUnidad: ca.region?.nombre || ca.region || '',
          ComunaUnidad: ca.comuna || '',
          Fechas: {
            FechaPublicacion: ca.fecha_publicacion || null,
            FechaCierre: ca.fecha_cierre || null
          },
          UrlExterna: `https://buscador.mercadopublico.cl/ficha?code=${ca.codigo}`,
          DetalleEnriquecido: true
        }));
        if (itemsApiV2.length > 0) {
          fuenteDatos = 'API v2 Compra Ágil (COT) + Licitaciones Simplificadas (< 100 UTM)';
        }
      } catch (e) {
        // La pasarela api2.mercadopublico.cl dio timeout 504 o 429: continuamos sin interrumpir con el pool activo < 100 UTM
      }
    }

    // 2. Obtener todas las contrataciones rápidas (< 100 UTM: L1 y E2) activas en Chile
    const resRapidas = await this.buscar({
      estado: 'activas',
      tipo: ['L1', 'E2'],
      palabraClave,
      palabrasExcluidas,
      regiones: region ? [region] : [],
      precioMin,
      precioMax: modalidadeMaxCLP(modalidad, precioMax),
      soloCierreProximo,
      ordenarPor,
      pagina: 1,
      porPagina: 500,
      enriquecerPagina: false
    });

    const listaL1 = (resRapidas.Listado || []).map(item => ({
      ...item,
      EsCompraAgilCot: false,
      DescripcionTipo: item.MontoExactoDisponible && item.MontoEstimado <= 30 * UTM_CLP
        ? 'Compra Rápida ≤ 30 UTM'
        : 'Compra Menor / Ágil (< 100 UTM)',
      UrlExterna: `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${item.CodigoExterno}`
    }));

    let combinadas = [...itemsApiV2, ...listaL1];

    if (modalidad === '30utm') {
      combinadas = combinadas.filter(i => {
        if (i.EsCompraAgilCot) return true;
        if (i.MontoExactoDisponible && i.MontoEstimado > 0) return i.MontoEstimado <= 30 * UTM_CLP;
        return true;
      });
    } else if (modalidad === 'cot' && itemsApiV2.length > 0) {
      combinadas = itemsApiV2;
    }

    const total = combinadas.length;
    const totalPaginas = Math.ceil(total / porPagina) || 1;
    const inicio = (pagina - 1) * porPagina;
    let paginaItems = combinadas.slice(inicio, inicio + porPagina);

    // Enriquecer con cache de DB y disparar enriquecimiento de los primeros 6 items
    const codigosPagina = paginaItems.filter(i => !i.EsCompraAgilCot).map(i => i.CodigoExterno);
    const cachesDB = await obtenerCachesDesdeDB(codigosPagina);
    paginaItems = paginaItems.map(item => cachesDB[item.CodigoExterno] ? { ...item, ...cachesDB[item.CodigoExterno] } : item);

    const faltantes = paginaItems.filter(i => !i.DetalleEnriquecido && !i.EsCompraAgilCot).slice(0, 6);
    if (faltantes.length > 0) {
      Promise.resolve().then(async () => {
        for (const f of faltantes) {
          try {
            await this.getLicitacionPorCodigo(f.CodigoExterno);
          } catch (e) {}
        }
      });
    }

    return {
      Cantidad: paginaItems.length,
      Total: total,
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
