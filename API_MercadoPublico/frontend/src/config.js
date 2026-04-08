// Archivo de configuración para desarrollo local
// Este archivo contiene constantes y configuración útil

export const API_BASE_URL = 'http://localhost:3001'
export const FRONTEND_URL = 'http://localhost:5173'

// Estados de licitaciones
export const ESTADOS_LICITACIONES = {
  PUBLICADA: '5',
  CERRADA: '6',
  DESIERTA: '7',
  ADJUDICADA: '8',
  REVOCADA: '18',
  SUSPENDIDA: '19',
  ACTIVAS: 'activas',
  TODOS: 'todos'
}

export const ESTADOS_LICITACIONES_NAMES = {
  '5': 'Publicada',
  '6': 'Cerrada',
  '7': 'Desierta',
  '8': 'Adjudicada',
  '18': 'Revocada',
  '19': 'Suspendida'
}

// Tipos de licitaciones
export const TIPOS_LICITACIONES = {
  L1: 'Licitación Pública Menor a 100 UTM',
  LE: 'Licitación Pública Entre 100 y 1000 UTM',
  LP: 'Licitación Pública Mayor 1000 UTM',
  LS: 'Licitación Pública Servicios personales especializados',
  A1: 'Licitación Privada por Licitación Pública anterior sin oferentes',
  B1: 'Licitación Privada por otras causales',
  J1: 'Licitación Privada Servicios de Naturaleza Confidencial',
  F1: 'Licitación Privada Convenios con Personas Jurídicas Extranjeras',
  E1: 'Licitación Privada por Remanente de Contrato anterior',
  CO: 'Licitación Privada entre 100 y 1000 UTM',
  B2: 'Licitación Privada Mayor a 1000 UTM',
  A2: 'Trato Directo por Producto de Licitación Privada anterior sin oferentes',
  D1: 'Trato Directo por Proveedor Único',
  E2: 'Licitación Privada Menor a 100 UTM',
  C2: 'Trato Directo (Cotización)',
  C1: 'Compra Directa (Orden de compra)',
  F2: 'Trato Directo (Cotización)',
  F3: 'Compra Directa (Orden de compra)',
  G2: 'Directo (Cotización)',
  G1: 'Compra Directa (Orden de compra)',
  R1: 'Orden de Compra menor a 3 UTM',
  CA: 'Orden de Compra sin Resolución',
  SE: 'Orden de Compra proveniente de adquisición sin emisión automática de OC'
}

// Regiones de Chile
export const REGIONES_CHILE = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana',
  'Libertador General Bernardo O\'Higgins',
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén',
  'Magallanes'
]

// Unidades Monetarias
export const MONEDAS = {
  CLP: 'Peso Chileno',
  CLF: 'Unidad de Fomento',
  USD: 'Dólar Americano',
  UTM: 'Unidad Tributaria Mensual',
  EUR: 'Euro'
}

// Modalidades de pago
export const MODALIDADES_PAGO = {
  1: 'Pago a 30 días',
  2: 'Pago a 30, 60 y 90 días',
  3: 'Pago al día',
  4: 'Pago Anual',
  5: 'Pago a 60 días',
  6: 'Pagos Mensuales',
  7: 'Pago Contra Entrega Conforme',
  8: 'Pago Bimensual',
  9: 'Pago Por Estado de Avance',
  10: 'Pago Trimestral'
}

// Prompts para IA
export const PROMPTS_IA = {
  ANALIZAR_MATCH: `Analizador de compatibilidad entre empresa y licitación. 
    Considera: experiencia, presupuesto, servicios, regiones, años en el mercado.
    Entrega: nivel (0-100), fortalezas, debilidades, recomendaciones.`,
  
  GENERAR_RESUMEN: `Generador de resúmenes ejecutivos de licitaciones.
    Incluye: objeto, requisitos, plazo, presupuesto, riesgos.
    Formato: JSON estructurado y conciso.`,
  
  DOCUMENTACION: `Generador de checklist de documentación.
    Incluye: documentos requeridos, recomendados, legales, plantillas.
    Formato: JSON con lista detallada.`
}

// Niveles de confianza para Match
export const NIVELES_MATCH = {
  MUY_BAJO: { min: 0, max: 25, color: 'red', label: 'Muy Bajo' },
  BAJO: { min: 25, max: 50, color: 'orange', label: 'Bajo' },
  MEDIO: { min: 50, max: 75, color: 'yellow', label: 'Medio' },
  ALTO: { min: 75, max: 90, color: 'lightgreen', label: 'Alto' },
  MUY_ALTO: { min: 90, max: 100, color: 'green', label: 'Muy Alto' }
}

export default {
  API_BASE_URL,
  FRONTEND_URL,
  ESTADOS_LICITACIONES,
  TIPOS_LICITACIONES,
  REGIONES_CHILE,
  MONEDAS,
  MODALIDADES_PAGO,
  NIVELES_MATCH
}
