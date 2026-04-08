import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.MERCADO_PUBLICO_API_URL;
const TICKET = process.env.MERCADO_PUBLICO_TICKET;

const axiosInstance = axios.create({
  timeout: 60000,
  headers: {
    'Accept': 'application/json'
  }
});

const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}${month}${year}`;
};

const formatDateToday = () => {
  return formatDate(new Date());
};

// Normaliza una licitación del listado (campos mínimos) a un formato consistente
function normalizarLicitacionListado(item) {
  return {
    CodigoExterno: item.CodigoExterno,
    Nombre: item.Nombre,
    CodigoEstado: item.CodigoEstado,
    FechaCierre: item.FechaCierre,
    Estado: getDescripcionEstado(String(item.CodigoEstado))
  };
}

// Normaliza una licitación del detalle (campos completos) a un formato plano
function normalizarLicitacionDetalle(item) {
  return {
    CodigoExterno: item.CodigoExterno,
    Nombre: item.Nombre,
    CodigoEstado: item.CodigoEstado,
    Estado: item.Estado || getDescripcionEstado(String(item.CodigoEstado)),
    Descripcion: item.Descripcion || '',
    FechaCierre: item.FechaCierre || item.Fechas?.FechaCierre,
    NombreOrganismo: item.Comprador?.NombreOrganismo || '',
    RegionUnidad: item.Comprador?.RegionUnidad?.trim() || '',
    ComunaUnidad: item.Comprador?.ComunaUnidad || '',
    RutUnidad: item.Comprador?.RutUnidad || '',
    NombreUnidad: item.Comprador?.NombreUnidad || '',
    Tipo: item.Tipo || '',
    CodigoTipo: item.CodigoTipo,
    Moneda: item.Moneda || 'CLP',
    MontoEstimado: item.MontoEstimado || 0,
    FechaPublicacion: item.Fechas?.FechaPublicacion || '',
    FechaCreacion: item.Fechas?.FechaCreacion || '',
    FechaAdjudicacion: item.Fechas?.FechaAdjudicacion || '',
    FechaInicio: item.Fechas?.FechaInicio || '',
    FechaFinal: item.Fechas?.FechaFinal || '',
    Etapas: item.Etapas,
    CantidadReclamos: item.CantidadReclamos || 0,
    Items: item.Items || [],
    // Datos completos originales por si se necesitan
    _detalleCargado: true
  };
}

function getDescripcionEstado(codigo) {
  const estados = {
    '5': 'Publicada',
    '6': 'Cerrada',
    '7': 'Desierta',
    '8': 'Adjudicada',
    '18': 'Revocada',
    '19': 'Suspendida'
  };
  return estados[codigo] || 'Desconocido';
}

export const mercadoPublicoService = {
  // Obtener detalle de licitación por código (devuelve datos completos)
  async getLicitacionPorCodigo(codigo) {
    try {
      const url = `${API_URL}/licitaciones.json`;
      const response = await axiosInstance.get(url, {
        params: { codigo, ticket: TICKET }
      });
      const listado = response.data?.Listado || [];
      if (listado.length > 0) {
        return {
          Cantidad: 1,
          Listado: [normalizarLicitacionDetalle(listado[0])]
        };
      }
      return { Cantidad: 0, Listado: [] };
    } catch (error) {
      console.error('Error obteniendo licitación por código:', error.message);
      throw error;
    }
  },

  // Obtener licitaciones por fecha (devuelve listado básico)
  async getLicitacionesPorFecha(fecha) {
    try {
      const url = `${API_URL}/licitaciones.json`;
      const fechaFormato = formatDate(new Date(fecha));
      const response = await axiosInstance.get(url, {
        params: { fecha: fechaFormato, ticket: TICKET }
      });
      const listado = (response.data?.Listado || []).map(normalizarLicitacionListado);
      return { Cantidad: listado.length, Listado: listado };
    } catch (error) {
      console.error('Error obteniendo licitaciones por fecha:', error.message);
      throw error;
    }
  },

  // Obtener licitaciones de hoy (reemplaza "activas" que hace timeout)
  async getLicitacionesHoy() {
    try {
      const url = `${API_URL}/licitaciones.json`;
      const response = await axiosInstance.get(url, {
        params: { fecha: formatDateToday(), ticket: TICKET }
      });
      const listado = (response.data?.Listado || []).map(normalizarLicitacionListado);
      return { Cantidad: listado.length, Listado: listado };
    } catch (error) {
      console.error('Error obteniendo licitaciones de hoy:', error.message);
      throw error;
    }
  },

  // Obtener licitaciones por estado y fecha
  async getLicitacionesPorEstado(estado, fecha = null) {
    try {
      const url = `${API_URL}/licitaciones.json`;
      const params = { ticket: TICKET };

      // Mapear nombres legibles a códigos de la API
      const estadoMap = {
        'publicada': 'publicada',
        'cerrada': 'cerrada',
        'desierta': 'desierta',
        'adjudicada': 'adjudicada',
        'revocada': 'revocada',
        'suspendida': 'suspendida',
        'activas': 'activas',
        '5': 'publicada',
        '6': 'cerrada',
        '7': 'desierta',
        '8': 'adjudicada',
        '18': 'revocada',
        '19': 'suspendida'
      };

      params.estado = estadoMap[estado] || estado;

      if (fecha) {
        params.fecha = formatDate(new Date(fecha));
      } else {
        // Si no se pasa fecha, usar hoy para evitar timeouts
        params.fecha = formatDateToday();
      }

      const response = await axiosInstance.get(url, { params });
      const listado = (response.data?.Listado || []).map(normalizarLicitacionListado);
      return { Cantidad: listado.length, Listado: listado };
    } catch (error) {
      console.error('Error obteniendo licitaciones por estado:', error.message);
      throw error;
    }
  },

  // Obtener detalles completos de múltiples licitaciones (en lotes)
  async enriquecerLicitaciones(codigos) {
    const resultados = [];
    // Procesar en lotes de 5 para no saturar la API
    const batchSize = 5;
    for (let i = 0; i < codigos.length; i += batchSize) {
      const batch = codigos.slice(i, i + batchSize);
      const promesas = batch.map(async (codigo) => {
        try {
          const url = `${API_URL}/licitaciones.json`;
          const response = await axiosInstance.get(url, {
            params: { codigo, ticket: TICKET }
          });
          const listado = response.data?.Listado || [];
          if (listado.length > 0) {
            return normalizarLicitacionDetalle(listado[0]);
          }
          return null;
        } catch (error) {
          console.error(`Error obteniendo detalle de ${codigo}:`, error.message);
          return null;
        }
      });
      const batchResults = await Promise.all(promesas);
      resultados.push(...batchResults.filter(Boolean));
    }
    return resultados;
  },

  // Buscar licitaciones con filtros combinados
  async buscarLicitaciones({ estado, fecha, regiones } = {}) {
    try {
      let listado;

      if (estado && estado !== 'todos') {
        const data = await this.getLicitacionesPorEstado(estado, fecha);
        listado = data.Listado;
      } else if (fecha) {
        const data = await this.getLicitacionesPorFecha(fecha);
        listado = data.Listado;
      } else {
        const data = await this.getLicitacionesHoy();
        listado = data.Listado;
      }

      // Si hay filtro de regiones, necesitamos los detalles completos
      if (regiones && regiones.length > 0) {
        const codigos = listado.map(l => l.CodigoExterno);
        // Enriquecer solo los primeros 50 para performance
        const codigosLimitados = codigos.slice(0, 50);
        const detalles = await this.enriquecerLicitaciones(codigosLimitados);

        // Filtrar por regiones
        const regionesLower = regiones.map(r => r.toLowerCase().trim());
        listado = detalles.filter(d => {
          const regionLic = (d.RegionUnidad || '').toLowerCase().trim();
          return regionesLower.some(r => regionLic.includes(r) || r.includes(regionLic));
        });
      }

      return { Cantidad: listado.length, Listado: listado };
    } catch (error) {
      console.error('Error en búsqueda:', error.message);
      throw error;
    }
  },

  getDescripcionEstado
};
