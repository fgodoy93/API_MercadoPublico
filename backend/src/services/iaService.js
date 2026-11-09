import { Anthropic } from "@anthropic-ai/sdk";
import { Ollama } from 'ollama';
import dotenv from 'dotenv';

dotenv.config();

const aiProvider = process.env.AI_PROVIDER || 'fast';

let claudeClient = null;
let ollamaClient = null;

// Solo inicializar Claude si la key tiene formato válido de Anthropic (sk-ant-...)
if ((aiProvider === 'claude' || aiProvider === 'both') && process.env.CLAUDE_API_KEY?.startsWith('sk-ant')) {
  claudeClient = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY
  });
}

if (aiProvider === 'ollama') {
  ollamaClient = new Ollama({
    host: process.env.OLLAMA_API_URL || 'http://localhost:11434'
  });
}

// Motor experto determinístico y heurístico para análisis instantáneo (< 1ms)
function generarAnalisisExperto(perfilEmpresa, licitacion) {
  const servicios = (perfilEmpresa?.servicios || '')
    .split(/[,;.\n]+/)
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length >= 2);

  const palabrasDesc = (perfilEmpresa?.descripcion || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length >= 5);

  const textoLicitacion = `${licitacion?.Nombre || ''} ${licitacion?.Descripcion || ''} ${(licitacion?.Items?.Listado || []).map(i => `${i.NombreProducto} ${i.Descripcion} ${i.Categoria}`).join(' ')}`.toLowerCase();

  let score = 48;
  const puntosFuertes = [];
  const puntosDebiles = [];
  const recomendaciones = [];

  // Evaluar coincidencias de rubro/servicios con límite de palabra
  const coincidenciasServicio = servicios.filter(kw => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-záéíóúñ0-9])${escaped}([^a-záéíóúñ0-9]|$)`, 'i');
    return regex.test(textoLicitacion);
  });
  const coincidenciasDesc = [...new Set(palabrasDesc.filter(w => textoLicitacion.includes(w)))];

  if (coincidenciasServicio.length > 0) {
    score += Math.min(34, coincidenciasServicio.length * 16);
    puntosFuertes.push(`Alta coincidencia técnica con tus servicios declarados (${coincidenciasServicio.slice(0, 4).join(', ')}).`);
  } else if (coincidenciasDesc.length > 0) {
    score += Math.min(18, coincidenciasDesc.length * 6);
    puntosFuertes.push(`Coincidencia parcial con términos de tu perfil (${coincidenciasDesc.slice(0, 3).join(', ')}).`);
  } else {
    score -= 12;
    puntosDebiles.push('El título/resumen de la licitación no menciona explícitamente las palabras clave principales de tu empresa.');
  }

  // Evaluar Presupuesto / Tramo
  const montoLic = Number(licitacion?.MontoEstimado) || Number(licitacion?.MontoMaximoEstimadoCLP) || 0;
  const minEmp = Number(perfilEmpresa?.presupuestoMinimo || 0);
  const maxEmp = Number(perfilEmpresa?.presupuestoMaximo || 0);

  if (montoLic > 0 && maxEmp > 0) {
    if (montoLic >= minEmp && montoLic <= maxEmp) {
      score += 14;
      puntosFuertes.push(`El monto/tope de referencia ($${montoLic.toLocaleString('es-CL')} CLP) calza con tu capacidad financiera.`);
    } else if (montoLic > maxEmp) {
      score -= 10;
      puntosDebiles.push(`El techo del tramo ($${montoLic.toLocaleString('es-CL')} CLP) supera el presupuesto máximo configurado en tu perfil.`);
      recomendaciones.push('Evalúa postular en Unión Temporal de Proveedores (UTP) o verificar si el presupuesto real es menor al tope del tramo.');
    }
  } else {
    puntosFuertes.push(`Licitación tramo ${licitacion?.Tipo || 'Pública'} (${licitacion?.RangoUTM || 'Tramo estándar ChileCompra'}).`);
  }

  // Evaluar Región
  const coberturaNacional = perfilEmpresa?.coberturaNacional !== undefined ? Boolean(perfilEmpresa.coberturaNacional) : true;
  const regionesEmp = (perfilEmpresa?.regiones || '').split(/[,;]+/).map(r => r.trim().toLowerCase()).filter(Boolean);
  const regionLic = (licitacion?.RegionUnidad || '').toLowerCase();
  if (regionesEmp.length > 0 && regionLic) {
    if (regionesEmp.some(r => regionLic.includes(r))) {
      score += 10;
      puntosFuertes.push(`Ubicación favorable: ${licitacion.RegionUnidad} coincide con tus regiones operativas.`);
    } else if (!coberturaNacional) {
      score -= 12;
      puntosDebiles.push(`La unidad de compra está en ${licitacion.RegionUnidad || 'otra región'}, fuera de tus zonas preferidas.`);
      recomendaciones.push('Considera costos logísticos, traslado o flete hacia la comuna de entrega.');
    }
  }

  // Evaluar Plazos
  const dias = licitacion?.DiasRestantes;
  if (dias !== null && dias !== undefined) {
    if (dias >= 5) {
      score += 4;
      puntosFuertes.push(`Holgura de tiempo adecuada (${dias} días restantes hasta el cierre de ofertas).`);
    } else if (dias >= 0) {
      puntosDebiles.push(`Plazo de cierre muy próximo (${dias} días restantes).`);
      recomendaciones.push('Prioriza hoy la descarga de bases administrativas y preparación de anexos.');
    }
  }

  // Evaluar Palabras Excluidas
  const excluidas = (perfilEmpresa?.palabrasExcluidas || '')
    .split(/[,;.\n]+/)
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length >= 2);
  const encontradasExcluidas = excluidas.filter(ex => textoLicitacion.includes(ex));
  if (encontradasExcluidas.length > 0) {
    score -= 35;
    puntosDebiles.push(`⚠️ Alerta de Exclusión: Menciona términos descartados en tu perfil (${encontradasExcluidas.join(', ')}).`);
  }

  if (perfilEmpresa?.habilitadoChileProveedores === 'si') {
    score += 4;
    puntosFuertes.push('Empresa habilitada en ChileProveedores para contratar sin bloqueo formal.');
  }

  const capGarantia = Number(perfilEmpresa?.capacidadGarantia || 0);
  if (capGarantia > 0 && montoLic > 0) {
    const garantiaEstimada5Pct = Math.round(montoLic * 0.05);
    if (capGarantia >= garantiaEstimada5Pct) {
      puntosFuertes.push(`Capacidad de garantía suficiente frente al 5% estimado (~$${garantiaEstimada5Pct.toLocaleString('es-CL')}).`);
    } else {
      score -= 6;
      puntosDebiles.push(`La garantía de fiel cumplimiento (5% ≈ $${garantiaEstimada5Pct.toLocaleString('es-CL')}) podría superar tu tope declarado.`);
    }
  }

  if (recomendaciones.length === 0) {
    recomendaciones.push(
      `Simula tu oferta al 82.5% (Óptima) o 70% (Competitiva) en la ficha antes de presentar propuesta económica.`,
      `Revisa la modalidad de pago (${licitacion?.ModalidadPagoTexto || '30 días contra recepción conforme'}) y cronograma de preguntas.`
    );
  }

  const debilidadesFinales = puntosDebiles.length > 0
    ? puntosDebiles
    : ['Sin alertas críticas detectadas para el perfil actual.'];

  return {
    nivelMatch: Math.max(15, Math.min(98, score)),
    puntosBlind: {
      puntosFuertes,
      fortalezas: puntosFuertes,
      puntosDebiles: debilidadesFinales,
      debilidades: debilidadesFinales,
      recomendaciones
    }
  };
}

function generarResumenExperto(licitacion) {
  const items = licitacion?.Items?.Listado || [];
  return {
    objetoContratacion: licitacion?.Descripcion || licitacion?.Nombre || 'Adquisición pública según bases.',
    organismoComprador: `${licitacion?.NombreOrganismo || 'Organismo Público'} (${licitacion?.NombreUnidad || 'Unidad de Compra'}) - ${licitacion?.RegionUnidad || 'Chile'}`,
    presupuestoYModalidad: {
      montoEstimadoExacto: licitacion?.MontoExactoDisponible ? `$${Number(licitacion.MontoEstimado).toLocaleString('es-CL')} ${licitacion.Moneda || 'CLP'}` : 'Oculto / No especificado por comprador',
      tramoMaximoLegal: licitacion?.MontoMaximoEstimadoCLP ? `Hasta $${Number(licitacion.MontoMaximoEstimadoCLP).toLocaleString('es-CL')} CLP (${licitacion.RangoUTM})` : licitacion?.RangoUTM || 'Según tipo de licitación',
      tipoEstimacion: licitacion?.TipoEstimacionTexto || 'Según bases',
      modalidadPago: licitacion?.ModalidadPagoTexto || 'Pago a 30 días',
      duracionContrato: licitacion?.DuracionContratoTexto || 'Según bases'
    },
    cronogramaClave: {
      publicacion: licitacion?.Fechas?.FechaPublicacion || 'Publicada',
      cierrePreguntas: licitacion?.Fechas?.FechaFinalPreguntas || 'No especificado',
      publicacionRespuestas: licitacion?.Fechas?.FechaPublicacionRespuestas || 'No especificado',
      cierreOfertas: licitacion?.FechaCierre || 'No especificado',
      adjudicacionEstimada: licitacion?.Fechas?.FechaEstimadaAdjudicacion || 'No especificado'
    },
    itemsSolicitados: items.slice(0, 6).map(i => ({
      producto: i.NombreProducto,
      cantidad: `${i.Cantidad} ${i.UnidadMedida || 'unid.'}`,
      descripcion: i.Descripcion
    })),
    riesgosYConsideraciones: [
      licitacion?.TomaRazon ? 'Requiere Toma de Razón por Contraloría.' : 'Exenta de Toma de Razón.',
      licitacion?.SubContratacion ? 'Permite subcontratación parcial.' : 'Restringe o regula subcontratación.',
      `Reclamos históricos del organismo: ${licitacion?.CantidadReclamos || 0} registrados en ChileCompra.`
    ]
  };
}

function generarDocumentacionExperta(perfilEmpresa, licitacion) {
  const esMayor1000UTM = ['LP', 'LQ', 'LR', 'B2', 'H2', 'I2'].includes(licitacion?.Tipo);
  const items = licitacion?.Items?.Listado || [];
  const itemsTexto = items.length > 0
    ? items.map((it, i) => `   ${i + 1}. [${it.Cantidad} ${it.UnidadMedida || 'Unid.'}] ${it.NombreProducto}: ${it.Descripcion || 'Según bases técnicas'}`).join('\n')
    : `   1. Ejecución integral de "${licitacion?.Nombre || 'los servicios requeridos'}" conforme a bases técnicas.`;

  return {
    documentosAdministrativos: [
      'Anexo N°1: Identificación del Oferente y Representante Legal',
      'Declaración Jurada Simple de no estar afecto a inhabilidades (Art. 4° Ley 19.886)',
      'Certificado de Vigencia en el Registro de Proveedores del Estado (ChileProveedores)',
      esMayor1000UTM ? 'Garantía de Seriedad de la Oferta (según porcentaje en bases)' : 'Declaración de vigencia y validez de la oferta'
    ],
    documentosTecnicos: [
      'Propuesta Técnica detallada según Especificaciones Técnicas de las bases',
      `Acreditación de experiencia de ${perfilEmpresa?.nombreEmpresa || 'la empresa'} (Órdenes de Compra, contratos o certificados de recepción conforme)`,
      'Fichas técnicas o catálogos de los ítems ofertados',
      'Plan de trabajo, plazos de entrega y garantías post-venta'
    ],
    documentosEconomicos: [
      'Anexo Económico desglosado por línea de producto/servicio en portal Mercado Público',
      `Cotización ajustada a modalidad: ${licitacion?.ModalidadPagoTexto || 'Pago a 30 días'}`
    ],
    checklistPostulacion: [
      'Revisar aclaraciones y respuestas del foro antes de enviar la oferta',
      'Verificar que el precio neto unitario coincida entre el portal y el Anexo Económico PDF',
      'Subir archivos antes de las 2 horas previas al cierre para evitar congestión del portal'
    ],
    borradorPropuestaTecnica: `PROPUESTA TÉCNICA Y CARTA DE PRESENTACIÓN
Proceso Licitatorio ID: ${licitacion?.CodigoExterno || 'S/I'} - "${licitacion?.Nombre || ''}"
Organismo Comprador: ${licitacion?.NombreOrganismo || 'Entidad Licitante'} (${licitacion?.RegionUnidad || 'Chile'})

1. IDENTIFICACIÓN DEL OFERENTE
   • Razón Social / Empresa: ${perfilEmpresa?.nombreEmpresa || 'Empresa Oferente'}
   • RUT: ${perfilEmpresa?.rutEmpresa || 'Por completar'}
   • Experiencia Acreditada: ${perfilEmpresa?.experienciaAnos ? `${perfilEmpresa.experienciaAnos} años en el rubro` : 'Experiencia comprobada en sector público y privado'}
   • Estado ChileProveedores: ${perfilEmpresa?.habilitadoChileProveedores === 'si' ? 'Habilitado y Vigente' : 'En trámite / Vigente'}

2. PRESENTACIÓN Y CAPACIDADES TÉCNICAS
${perfilEmpresa?.descripcion || `Nuestra empresa cuenta con las capacidades técnicas, operativas y profesionales para dar cumplimiento íntegro al requerimiento "${licitacion?.Nombre}".`}

3. ALCANCE TÉCNICO Y DESGLOSE DE ÍTEMS OFERTADOS
Nos comprometemos a proveer y ejecutar la totalidad de las líneas solicitadas cumpliendo el 100% de las Especificaciones Técnicas:
${itemsTexto}

4. CONDICIONES DE EJECUCIÓN Y GARANTÍA
   • Plazo / Duración del Contrato: ${licitacion?.DuracionContratoTexto || 'Según lo establecido en bases administrativas'}
   • Modalidad de Facturación y Pago: ${licitacion?.ModalidadPagoTexto || 'A 30 días contra recepción conforme'}
   • Aseguramiento de Calidad: Asignación de contraparte técnica dedicada, reportes de cumplimiento y garantía técnica total durante la vigencia del contrato.`
  };
}

function generarPreguntasForoExpertas(perfilEmpresa, licitacion) {
  const nombreOrg = licitacion?.NombreOrganismo || 'la Entidad Licitante';
  const items = licitacion?.Items?.Listado || [];
  const primerItem = items[0]?.NombreProducto || licitacion?.Nombre || 'los bienes/servicios requeridos';

  return {
    consejoForo: 'Recuerda formular las preguntas sin identificar el nombre ni RUT de tu empresa en el texto, ya que el foro de Mercado Público es anónimo.',
    fechaLimitePreguntas: licitacion?.Fechas?.FechaFinalPreguntas || null,
    preguntas: [
      {
        categoria: 'Presupuesto y Evaluación Económica',
        pregunta: `Se solicita amablemente a ${nombreOrg} confirmar si el presupuesto estimado o disponible para esta contratación considera valores con IVA incluido, y si las ofertas que superen dicho monto referencial quedarán inadmisibles o solo obtendrán menor puntaje económico.`
      },
      {
        categoria: 'Acreditación de Experiencia del Oferente',
        pregunta: `Respecto al criterio de evaluación de experiencia, ¿se aceptarán indistintamente Órdenes de Compra del portal Mercado Público en estado "Recepción Conforme", facturas con su respectivo certificado de conformidad y/o contratos con clientes del sector privado?`
      },
      {
        categoria: 'Especificaciones Técnicas Equivalentes',
        pregunta: `En relación con el requerimiento de "${primerItem}", favor confirmar si se aceptan soluciones, metodologías o insumos de características técnicas equivalentes o superiores a las descritas referencialmente en las Bases Técnicas.`
      },
      {
        categoria: 'Plazos de Inicio y Entrega',
        pregunta: `¿El plazo de ejecución o entrega comenzará a regir desde la total tramitación de la Resolución aprobatoria del contrato o a partir de la aceptación formal de la Orden de Compra en el portal www.mercadopublico.cl?`
      },
      {
        categoria: 'Facturación y Estados de Pago',
        pregunta: `Considerando la duración del contrato (${licitacion?.DuracionContratoTexto || 'según bases'}), favor confirmar los hitos de pago o documentos específicos que deberán adjuntarse junto al Estado de Pago para cursar la recepción conforme dentro del plazo legal.`
      }
    ]
  };
}

export const iaService = {
  async analizarMatch(perfilEmpresa, licitacion, provider = 'fast') {
    if (provider === 'claude' && claudeClient) {
      try {
        const prompt = `Analiza match JSON entre ${JSON.stringify(perfilEmpresa)} y ${JSON.stringify(licitacion)}`;
        const res = await this.generateWithClaude(prompt);
        if (res && typeof res.nivelMatch === 'number') return res;
      } catch {
        // Fallback instantáneo
      }
    }
    return generarAnalisisExperto(perfilEmpresa, licitacion);
  },

  async generarResumenLicitacion(licitacion, provider = 'fast') {
    if (provider === 'claude' && claudeClient) {
      try {
        const prompt = `Genera resumen ejecutivo JSON de: ${JSON.stringify(licitacion)}`;
        const res = await this.generateWithClaude(prompt);
        if (res && !res.texto) return res;
      } catch {
        // Fallback instantáneo
      }
    }
    return generarResumenExperto(licitacion);
  },

  async generarDocumentacionPostulacion(perfilEmpresa, licitacion, provider = 'fast') {
    if (provider === 'claude' && claudeClient) {
      try {
        const prompt = `Genera checklist JSON: Perfil=${JSON.stringify(perfilEmpresa)}, Licitacion=${JSON.stringify(licitacion)}`;
        const res = await this.generateWithClaude(prompt);
        if (res && !res.texto && res.borradorPropuestaTecnica) return res;
      } catch {
        // Fallback instantáneo
      }
    }
    return generarDocumentacionExperta(perfilEmpresa, licitacion);
  },

  async generarPreguntasForo(perfilEmpresa, licitacion) {
    return generarPreguntasForoExpertas(perfilEmpresa, licitacion);
  },

  async generateWithClaude(prompt) {
    const message = await claudeClient.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    });
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    return JSON.parse(responseText);
  },

  async checkAvailability() {
    return {
      claude: Boolean(claudeClient),
      ollama: Boolean(ollamaClient),
      motorIntegrado: true
    };
  }
};
