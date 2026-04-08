import axios from 'axios';
import dotenv from 'dotenv';
import { query } from '../db/database.js';

dotenv.config();

const API_URL = process.env.MERCADO_PUBLICO_API_URL;
const TICKET = process.env.MERCADO_PUBLICO_TICKET;

const axiosInstance = axios.create({
  timeout: 90000,
  headers: { 'Accept': 'application/json' }
});

// Cache en memoria para listados (TTL: 5 minutos)
const listadoCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(estado, fecha) {
  return `${estado || 'todos'}_${fecha || 'hoy'}`;
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

const formatDate = (date) => {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
};

const formatDateToday = () => formatDate(new Date());

function getDescripcionEstado(codigo) {
  const estados = {
    '5': 'Publicada', '6': 'Cerrada', '7': 'Desierta',
    '8': 'Adjudicada', '18': 'Revocada', '19': 'Suspendida'
  };
  return estados[String(codigo)] || 'Desconocido';
}

function normalizarDetalle(item) {
  return {
    CodigoExterno: item.CodigoExterno,
    Nombre: item.Nombre,
    CodigoEstado: item.CodigoEstado,
    Estado: item.Estado || getDescripcionEstado(item.CodigoEstado),
    Descripcion: item.Descripcion || '',
    FechaCierre: item.FechaCierre || item.Fechas?.FechaCierre,
    NombreOrganismo: item.Comprador?.NombreOrganismo || '',
    RegionUnidad: (item.Comprador?.RegionUnidad || '').trim(),
    ComunaUnidad: item.Comprador?.ComunaUnidad || '',
    NombreUnidad: item.Comprador?.NombreUnidad || '',
    Tipo: item.Tipo || '',
    CodigoTipo: item.CodigoTipo,
    Moneda: item.Moneda || 'CLP',
    MontoEstimado: item.MontoEstimado || 0,
    FechaPublicacion: item.Fechas?.FechaPublicacion || '',
    FechaCreacion: item.Fechas?.FechaCreacion || '',
    FechaInicio: item.Fechas?.FechaInicio || '',
    FechaFinal: item.Fechas?.FechaFinal || '',
    Etapas: item.Etapas,
    Items: item.Items || []
  };
}

function normalizarListado(item) {
  return {
    CodigoExterno: item.CodigoExterno,
    Nombre: item.Nombre,
    CodigoEstado: item.CodigoEstado,
    Estado: getDescripcionEstado(item.CodigoEstado),
    FechaCierre: item.FechaCierre
  };
}

// Guarda detalle en cache PostgreSQL
async function guardarEnCache(detalle) {
  try {
    await query(
      `INSERT INTO cache_licitaciones (codigo_externo, datos, region, nombre_organismo, monto_estimado, tipo, fecha_cache)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (codigo_externo) DO UPDATE SET
         datos = EXCLUDED.datos,
         region = EXCLUDED.region,
         nombre_organismo = EXCLUDED.nombre_organismo,
         monto_estimado = EXCLUDED.monto_estimado,
         tipo = EXCLUDED.tipo,
         fecha_cache = CURRENT_TIMESTAMP`,
      [
        detalle.CodigoExterno,
        JSON.stringify(detalle),
        detalle.RegionUnidad,
        detalle.NombreOrganismo,
        detalle.MontoEstimado,
        detalle.Tipo
      ]
    );
  } catch (error) {
    // Silencioso - cache es optional
  }
}

// Busca en cache PostgreSQL
async function buscarEnCache(codigos) {
  try {
    const result = await query(
      `SELECT codigo_externo, datos FROM cache_licitaciones
       WHERE codigo_externo = ANY($1)`,
      [codigos]
    );
    const cache = {};
    for (const row of result.rows) {
      cache[row.codigo_externo] = typeof row.datos === 'string' ? JSON.parse(row.datos) : row.datos;
    }
    return cache;
  } catch (error) {
    return {};
  }
}

// Filtra por regiones desde el cache
async function filtrarPorRegionDesdeCache(codigos, regiones) {
  try {
    const regionesPattern = regiones.map(r => `%${r}%`);
    const placeholders = regionesPattern.map((_, i) => `$${i + 1}`).join(' OR region ILIKE ');

    const result = await query(
      `SELECT codigo_externo, datos FROM cache_licitaciones
       WHERE codigo_externo = ANY($${regionesPattern.length + 1})
       AND (region ILIKE ${placeholders})
       ORDER BY fecha_cache DESC
       LIMIT 50`,
      [...regionesPattern, codigos]
    );

    return result.rows.map(row =>
      typeof row.datos === 'string' ? JSON.parse(row.datos) : row.datos
    );
  } catch (error) {
    console.error('Error filtro cache:', error.message);
    return [];
  }
}

export const mercadoPublicoService = {
  // Detalle completo de una licitación (y la cachea)
  async getLicitacionPorCodigo(codigo) {
    // Primero buscar en cache
    const cache = await buscarEnCache([codigo]);
    if (cache[codigo]) {
      return { Cantidad: 1, Listado: [cache[codigo]], FromCache: true };
    }

    // Si no está en cache, ir a la API
    const response = await axiosInstance.get(`${API_URL}/licitaciones.json`, {
      params: { codigo, ticket: TICKET }
    });
    const listado = response.data?.Listado || [];
    if (listado.length > 0) {
      const detalle = normalizarDetalle(listado[0]);
      // Guardar en cache (fire and forget)
      guardarEnCache(detalle);
      return { Cantidad: 1, Listado: [detalle] };
    }
    return { Cantidad: 0, Listado: [] };
  },

  // Listado básico con cache en memoria (5 min TTL)
  async getListado(estado, fecha) {
    const cacheKey = getCacheKey(estado, fecha);
    const cached = getListadoFromCache(cacheKey);
    if (cached) {
      console.log(`Listado desde cache: ${cacheKey} (${cached.length} items)`);
      return cached;
    }

    const params = { ticket: TICKET };

    if (estado && estado !== 'todos') {
      const estadoMap = {
        'publicada': 'publicada', 'cerrada': 'cerrada', 'desierta': 'desierta',
        'adjudicada': 'adjudicada', 'revocada': 'revocada', 'suspendida': 'suspendida'
      };
      params.estado = estadoMap[estado] || estado;
    }

    params.fecha = fecha ? formatDate(new Date(fecha)) : formatDateToday();

    console.log(`Listado desde API: ${cacheKey}...`);
    const response = await axiosInstance.get(`${API_URL}/licitaciones.json`, { params });
    const listado = (response.data?.Listado || []).map(normalizarListado);
    setListadoCache(cacheKey, listado);
    console.log(`Listado cacheado: ${cacheKey} (${listado.length} items)`);
    return listado;
  },

  // BÚSQUEDA: listado rápido + enriquecimiento desde cache
  async buscar({ estado, fecha, regiones, pagina = 1, porPagina = 30 } = {}) {
    // Paso 1: Obtener listado básico (rápido, <5 seg)
    const listadoBasico = await this.getListado(estado, fecha);
    const totalBasico = listadoBasico.length;

    if (totalBasico === 0) {
      return { Cantidad: 0, Total: 0, Pagina: pagina, Listado: [] };
    }

    // Paso 2: Paginar
    const inicio = (pagina - 1) * porPagina;
    const paginaItems = listadoBasico.slice(inicio, inicio + porPagina);
    const codigos = paginaItems.map(l => l.CodigoExterno);

    // Paso 3: Enriquecer desde cache (instantáneo, sin llamadas a API)
    const cache = await buscarEnCache(codigos);
    const resultado = paginaItems.map(basico => cache[basico.CodigoExterno] || basico);

    // Paso 4: Si filtro de regiones, filtrar los enriquecidos
    if (regiones && regiones.length > 0) {
      // Buscar por región en TODO el cache (no solo la página actual)
      const todosCodigos = listadoBasico.map(l => l.CodigoExterno);
      const filtrados = await filtrarPorRegionDesdeCache(todosCodigos, regiones);

      if (filtrados.length > 0) {
        return {
          Cantidad: filtrados.length,
          Total: filtrados.length,
          Pagina: 1,
          PorPagina: porPagina,
          Listado: filtrados.slice(0, porPagina)
        };
      }

      // Si no hay nada en cache, devolver el listado básico con una nota
      return {
        Cantidad: resultado.length,
        Total: totalBasico,
        Pagina: pagina,
        PorPagina: porPagina,
        Listado: resultado,
        RegionSinCache: true
      };
    }

    return {
      Cantidad: resultado.length,
      Total: totalBasico,
      Pagina: pagina,
      PorPagina: porPagina,
      Listado: resultado
    };
  },

  getDescripcionEstado
};
