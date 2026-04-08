import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.MERCADO_PUBLICO_API_URL;
const TICKET = process.env.MERCADO_PUBLICO_TICKET;

const axiosInstance = axios.create({
  timeout: 30000,
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

export const mercadoPublicoService = {
  // Obtener licitaciones por código
  async getLicitacionPorCodigo(codigo) {
    try {
      const url = `${API_URL}/licitaciones.json`;
      const response = await axiosInstance.get(url, {
        params: {
          codigo,
          ticket: TICKET
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo licitación por código:', error);
      throw error;
    }
  },

  // Obtener licitaciones por fecha
  async getLicitacionesPorFecha(fecha) {
    try {
      const url = `${API_URL}/licitaciones.json`;
      const fechaFormato = formatDate(new Date(fecha));
      
      const response = await axiosInstance.get(url, {
        params: {
          fecha: fechaFormato,
          ticket: TICKET
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo licitaciones por fecha:', error);
      throw error;
    }
  },

  // Obtener licitaciones activas
  async getLicitacionesActivas() {
    try {
      const url = `${API_URL}/licitaciones.json`;
      const response = await axiosInstance.get(url, {
        params: {
          estado: 'activas',
          ticket: TICKET
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo licitaciones activas:', error);
      throw error;
    }
  },

  // Obtener licitaciones por estado
  async getLicitacionesPorEstado(estado, fecha = null) {
    try {
      const url = `${API_URL}/licitaciones.json`;
      const params = {
        estado,
        ticket: TICKET
      };

      if (fecha) {
        params.fecha = formatDate(new Date(fecha));
      }

      const response = await axiosInstance.get(url, { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo licitaciones por estado:', error);
      throw error;
    }
  },

  // Obtener licitaciones por código de proveedor
  async getLicitacionesPorProveedor(codigoProveedor, fecha = null) {
    try {
      const url = `${API_URL}/licitaciones.json`;
      const params = {
        CodigoProveedor: codigoProveedor,
        ticket: TICKET
      };

      if (fecha) {
        params.fecha = formatDate(new Date(fecha));
      }

      const response = await axiosInstance.get(url, { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo licitaciones por proveedor:', error);
      throw error;
    }
  },

  // Obtener licitaciones por código de organismo
  async getLicitacionesPorOrganismo(codigoOrganismo, fecha = null) {
    try {
      const url = `${API_URL}/licitaciones.json`;
      const params = {
        CodigoOrganismo: codigoOrganismo,
        ticket: TICKET
      };

      if (fecha) {
        params.fecha = formatDate(new Date(fecha));
      }

      const response = await axiosInstance.get(url, { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo licitaciones por organismo:', error);
      throw error;
    }
  },

  // Obtener licitaciones del día actual
  async getLicitacionesHoy() {
    try {
      const url = `${API_URL}/licitaciones.json`;
      const response = await axiosInstance.get(url, {
        params: {
          ticket: TICKET
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo licitaciones de hoy:', error);
      throw error;
    }
  },

  // Traduce códigos de estado
  getDescripcionEstado(codigo) {
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
};
