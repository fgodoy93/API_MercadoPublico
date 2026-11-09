import express from 'express';
import { LicitacionGuardada, PerfilEmpresa } from '../db/sequelize.js';
import { mercadoPublicoService } from '../services/mercadoPublicoService.js';

const router = express.Router();

// Obtener detalle completo de licitación por código (con fechas clave, comprador, montos e ítems)
router.get('/codigo/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const data = await mercadoPublicoService.getLicitacionPorCodigo(codigo);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enriquecer un lote de códigos de licitación con detalles completos
router.post('/enriquecer', async (req, res) => {
  try {
    const { codigos } = req.body;
    const data = await mercadoPublicoService.enriquecerLote(codigos || []);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener licitaciones del día actual
router.get('/hoy', async (req, res) => {
  try {
    const data = await mercadoPublicoService.getLicitacionesHoy();
    res.json({ Cantidad: data.length, Listado: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Búsqueda avanzada con soporte de tramos, montos, fechas, tipos y paginación
router.post('/buscar', async (req, res) => {
  try {
    const data = await mercadoPublicoService.buscar(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Búsqueda dedicada de Compras Ágiles y Contrataciones Simplificadas (< 30 / 100 UTM)
router.post('/compras-agiles', async (req, res) => {
  try {
    const data = await mercadoPublicoService.buscarComprasAgiles(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simular impacto de perfil en tiempo real (cuántas licitaciones y compras ágiles calzan)
router.post('/simular-perfil', async (req, res) => {
  try {
    const perfil = req.body || {};
    const resultado = await evaluarRecomendacionesConPerfil(perfil);
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener licitaciones recomendadas según el perfil de empresa con puntaje heurístico de relevancia
router.get('/recomendadas/:usuarioId', async (req, res) => {
  try {
    const { perfilId } = req.query;
    let perfil = null;

    if (perfilId && !Number.isNaN(Number(perfilId))) {
      perfil = await PerfilEmpresa.findByPk(Number(perfilId));
    }
    if (!perfil) {
      perfil = await PerfilEmpresa.findOne({ order: [['esActivo', 'DESC'], ['updatedAt', 'DESC']] });
    }
    if (!perfil) return res.json({ Cantidad: 0, TotalCoincidencias: 0, TotalComprasAgilesMatch: 0, Listado: [] });

    const resultado = await evaluarRecomendacionesConPerfil(perfil);
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function evaluarRecomendacionesConPerfil(perfil) {
  const stopWords = new Set(['para', 'como', 'este', 'esta', 'estos', 'estas', 'todo', 'toda', 'todos', 'todas', 'empresa', 'servicios', 'servicio', 'desde', 'hasta', 'entre', 'sobre', 'chile', 'nacional', 'general', 'marco', 'tiempo', 'mejor', 'otros', 'abajo', 'puedes', 'conocer', 'ultimo', 'enfocado', 'prestar', 'ligados', 'actividades', 'apoyo']);
  let keywords = [];
  if (perfil.servicios) {
    keywords.push(
      ...String(perfil.servicios)
        .split(/[,;.\n]+/)
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length >= 2)
    );
  }
  // Solo extraer palabras de la descripción si el usuario no ha definido palabras clave en servicios
  if (keywords.length === 0 && perfil.descripcion) {
    const descWords = String(perfil.descripcion)
      .toLowerCase()
      .replace(/[^\wáéíóúñ\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 5 && !stopWords.has(w));
    keywords.push(...descWords);
  }
  keywords = [...new Set(keywords)];

  // Palabras excluidas (negativas)
  const excluidas = perfil.palabrasExcluidas
    ? String(perfil.palabrasExcluidas)
        .split(/[,;.\n]+/)
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length >= 2)
    : [];

  const tiposPreferidos = perfil.tiposLicitacion
    ? String(perfil.tiposLicitacion).split(/[,;\s]+/).map(t => t.trim().toUpperCase()).filter(Boolean)
    : [];

  const coberturaNacional = perfil.coberturaNacional !== undefined ? Boolean(perfil.coberturaNacional) : true;
  const regionesPreferidas = (!coberturaNacional && perfil.regiones)
    ? String(perfil.regiones).split(/[,;]+/).map(r => r.trim().toLowerCase()).filter(Boolean)
    : [];

  const minCLP = perfil.presupuestoMinimo ? Number(perfil.presupuestoMinimo) : 0;
  const maxCLP = perfil.presupuestoMaximo ? Number(perfil.presupuestoMaximo) : null;
  const interesCompraAgil = perfil.interesCompraAgil !== undefined ? Boolean(perfil.interesCompraAgil) : true;

  const todasActivas = await mercadoPublicoService.getLicitacionesActivas();
  const recomendadas = [];
  let totalComprasAgilesMatch = 0;

  for (const lic of todasActivas) {
    if (lic.DiasRestantes !== null && lic.DiasRestantes < 0) continue;

    const textoLic = `${lic.Nombre || ''} ${lic.Descripcion || ''} ${lic.NombreOrganismo || ''} ${lic.RegionUnidad || ''} ${lic.ComunaUnidad || ''}`.toLowerCase();

    // 1. Filtro estricto de Palabras Excluidas (Negativas)
    if (excluidas.length > 0 && excluidas.some(ex => textoLic.includes(ex))) {
      continue;
    }

    let score = 0;
    const motivos = [];

    // 2. Match por palabras clave de servicio/rubro (con límite de palabra para evitar falsos positivos)
    let kwMatches = 0;
    const keywordsMatch = [];
    for (const kw of keywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-záéíóúñ0-9])${escaped}([^a-záéíóúñ0-9]|$)`, 'i');
      if (regex.test(textoLic)) {
        kwMatches++;
        keywordsMatch.push(kw);
        score += kw.includes(' ') ? 38 : 25;
        if (motivos.length < 4) motivos.push(`Servicio: "${kw}"`);
      }
    }

    if (keywords.length > 0 && kwMatches === 0) continue;

    // 3. Match por Tipo de Licitación y Compra Ágil (< 100 UTM)
    const esSimplificada = ['L1', 'E2', 'COT'].includes(lic.Tipo);
    if (esSimplificada && interesCompraAgil) {
      score += 15;
      motivos.push('Compra Rápida < 100 UTM');
    }

    if (tiposPreferidos.length > 0) {
      if (tiposPreferidos.includes(lic.Tipo)) {
        score += 20;
        if (!motivos.includes(`Tramo ${lic.Tipo}`)) motivos.push(`Tramo ${lic.Tipo}`);
      } else if (!(esSimplificada && interesCompraAgil)) {
        continue;
      }
    } else {
      score += 10;
    }

    // 4. Match por Presupuesto / Tramo
    const techo = lic.MontoEstimado || lic.MontoMaximoEstimadoCLP;
    const piso = lic.MontoEstimado || lic.MontoMinimoEstimadoCLP || 0;
    if (minCLP > 0 && techo !== null && techo < minCLP) continue;
    if (maxCLP !== null && maxCLP > 0 && piso > maxCLP) continue;

    if (minCLP > 0 || (maxCLP !== null && maxCLP > 0)) {
      score += 15;
      motivos.push('Acorde a tu presupuesto');
    }

    // 5. Match por Región (si no es cobertura nacional, o bonus si está en su región)
    if (regionesPreferidas.length > 0) {
      const matchReg = regionesPreferidas.some(r => textoLic.includes(r));
      if (matchReg) {
        score += 20;
        motivos.push('En tu región operativa');
      } else if (lic.RegionUnidad) {
        // Si ya tiene región conocida y no coincide cuando el usuario desactivó cobertura nacional
        continue;
      }
    }

    if (lic.DiasRestantes !== null && lic.DiasRestantes >= 3) {
      score += 8;
    }

    if (esSimplificada) {
      totalComprasAgilesMatch++;
    }

    const scoreNormalizado = Math.min(99, Math.max(50, score));
    recomendadas.push({
      ...lic,
      scoreRecomendacion: scoreNormalizado,
      motivosRecomendacion: motivos,
      keywordsMatch
    });
  }

  recomendadas.sort((a, b) => {
    if (b.scoreRecomendacion !== a.scoreRecomendacion) {
      return b.scoreRecomendacion - a.scoreRecomendacion;
    }
    return (a.DiasRestantes ?? 999) - (b.DiasRestantes ?? 999);
  });

  // Para el simulador rápido podemos enviar un límite opcional, pero para recomendadas devolvemos TODO el listado
  const limite = perfil.limiteSimulacion ? Number(perfil.limiteSimulacion) : recomendadas.length;
  const listadoCortado = recomendadas.slice(0, limite);
  const listadoFinal = await mercadoPublicoService.fusionarConCacheDB(listadoCortado);

  return {
    Cantidad: listadoFinal.length,
    TotalCoincidencias: recomendadas.length,
    TotalComprasAgilesMatch: totalComprasAgilesMatch,
    KeywordsActivas: keywords.slice(0, 25),
    ExcluidasActivas: excluidas,
    Listado: listadoFinal
  };
}

// Obtener licitaciones activas
router.get('/activas', async (req, res) => {
  try {
    const data = await mercadoPublicoService.getLicitacionesActivas();
    res.json({ Cantidad: data.length, Listado: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener licitaciones por fecha
router.get('/fecha/:fecha', async (req, res) => {
  try {
    const { fecha } = req.params;
    const data = await mercadoPublicoService.getLicitacionesPorFecha(fecha);
    res.json({ Cantidad: data.length, Listado: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener licitaciones por estado
router.get('/estado/:estado', async (req, res) => {
  try {
    const { estado } = req.params;
    const { fecha } = req.query;
    const data = await mercadoPublicoService.getLicitacionesPorEstado(estado, fecha);
    res.json({ Cantidad: data.length, Listado: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resumen Comparativo Multi-Empresa (oportunidades activas, cierres urgentes y pipeline por cada empresa)
router.get('/resumen-multiempresa', async (req, res) => {
  try {
    const perfiles = await PerfilEmpresa.findAll({ order: [['id', 'ASC']] });
    const guardadas = await LicitacionGuardada.findAll();

    const resumen = [];
    for (const p of perfiles) {
      const evalRes = await evaluarRecomendacionesConPerfil({
        ...p.toJSON(),
        limiteSimulacion: 500
      });
      const listado = evalRes.Listado || [];
      const cierresProximos = listado.filter(l => l.DiasRestantes !== null && l.DiasRestantes >= 0 && l.DiasRestantes <= 5).length;
      const enPipeline = guardadas.filter(g => g.perfilId === p.id || (!g.perfilId && p.id === 1)).length;

      resumen.push({
        id: p.id,
        nombreEmpresa: p.nombreEmpresa,
        rutEmpresa: p.rutEmpresa,
        esActivo: p.esActivo,
        servicios: p.servicios,
        totalRecomendadas: evalRes.TotalCoincidencias || 0,
        comprasAgiles: evalRes.TotalComprasAgilesMatch || 0,
        cierresProximos,
        enPipeline
      });
    }

    res.json(resumen);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar licitación en seguimiento / Pipeline CRM
router.post('/guardar', async (req, res) => {
  try {
    const {
      usuarioId,
      perfilId,
      codigoLicitacion,
      datosLicitacion,
      nivelMatch,
      analisisIa,
      etapaPipeline,
      montoOfertado,
      costoEstimado,
      notasInternas,
      checklist
    } = req.body;

    const uid = usuarioId || 1;
    let targetPerfilId = perfilId ? Number(perfilId) : null;
    if (!targetPerfilId) {
      const activo = await PerfilEmpresa.findOne({ order: [['esActivo', 'DESC'], ['id', 'ASC']] });
      targetPerfilId = activo ? activo.id : 1;
    }

    let licitacion = await LicitacionGuardada.findOne({
      where: { codigoLicitacion }
    });

    if (licitacion) {
      await licitacion.update({
        perfilId: targetPerfilId ?? licitacion.perfilId,
        nivelMatch: nivelMatch ?? licitacion.nivelMatch,
        analisisIa: analisisIa ?? licitacion.analisisIa,
        datosLicitacion: datosLicitacion ?? licitacion.datosLicitacion,
        etapaPipeline: etapaPipeline ?? licitacion.etapaPipeline ?? 'evaluacion',
        montoOfertado: montoOfertado !== undefined ? montoOfertado : licitacion.montoOfertado,
        costoEstimado: costoEstimado !== undefined ? costoEstimado : licitacion.costoEstimado,
        notasInternas: notasInternas !== undefined ? notasInternas : licitacion.notasInternas,
        checklist: checklist ?? licitacion.checklist
      });
    } else {
      licitacion = await LicitacionGuardada.create({
        usuarioId: uid,
        perfilId: targetPerfilId,
        codigoLicitacion,
        datosLicitacion: datosLicitacion || {},
        nivelMatch: nivelMatch || null,
        analisisIa: analisisIa || {},
        etapaPipeline: etapaPipeline || 'evaluacion',
        montoOfertado: montoOfertado || null,
        costoEstimado: costoEstimado || null,
        notasInternas: notasInternas || '',
        checklist: checklist || {
          basesLeidas: false,
          preguntasForo: false,
          anexoAdministrativo: false,
          ofertaTecnica: false,
          ofertaEconomica: false,
          garantiaLista: false
        }
      });
    }

    res.json(licitacion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar etapa Kanban, notas, checklist o simulación económica de una licitación guardada
router.put('/guardadas/item/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LicitacionGuardada.findByPk(Number(id));
    if (!item) {
      return res.status(404).json({ error: 'Licitación guardada no encontrada' });
    }

    const {
      etapaPipeline,
      montoOfertado,
      costoEstimado,
      notasInternas,
      checklist,
      perfilId,
      nivelMatch,
      analisisIa,
      datosLicitacion
    } = req.body;

    await item.update({
      etapaPipeline: etapaPipeline ?? item.etapaPipeline,
      montoOfertado: montoOfertado !== undefined ? (montoOfertado === '' ? null : montoOfertado) : item.montoOfertado,
      costoEstimado: costoEstimado !== undefined ? (costoEstimado === '' ? null : costoEstimado) : item.costoEstimado,
      notasInternas: notasInternas !== undefined ? notasInternas : item.notasInternas,
      checklist: checklist ?? item.checklist,
      perfilId: perfilId !== undefined ? perfilId : item.perfilId,
      nivelMatch: nivelMatch ?? item.nivelMatch,
      analisisIa: analisisIa ?? item.analisisIa,
      datosLicitacion: datosLicitacion ?? item.datosLicitacion
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar licitación guardada
router.delete('/guardadas/:usuarioId/:codigoLicitacion', async (req, res) => {
  try {
    const { codigoLicitacion } = req.params;
    await LicitacionGuardada.destroy({
      where: { codigoLicitacion }
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener licitaciones guardadas (todas o filtradas por perfilId)
router.get('/guardadas/:usuarioId', async (req, res) => {
  try {
    const { perfilId } = req.query;

    let licitaciones = await LicitacionGuardada.findAll({
      order: [['updatedAt', 'DESC']]
    });

    if (perfilId && !Number.isNaN(Number(perfilId))) {
      const pid = Number(perfilId);
      licitaciones = licitaciones.filter(l => l.perfilId === pid || (!l.perfilId && pid === 1));
    }

    // Fusionar datosLicitacion con cualquier detalle más fresco en LicitacionCache
    const codigos = licitaciones.map(l => l.codigoLicitacion).filter(Boolean);
    const enriquecidos = await mercadoPublicoService.fusionarConCacheDB(
      codigos.map(c => ({ CodigoExterno: c }))
    );
    const mapa = {};
    for (const e of enriquecidos) {
      if (e.DetalleEnriquecido) mapa[e.CodigoExterno] = e;
    }

    const resultado = licitaciones.map(item => {
      const json = item.toJSON();
      if (mapa[json.codigoLicitacion]) {
        json.datosLicitacion = { ...(json.datosLicitacion || {}), ...mapa[json.codigoLicitacion] };
      }
      return json;
    });

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
