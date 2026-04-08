import express from 'express';
import { iaService } from '../services/iaService.js';

const router = express.Router();

// Analizar match
router.post('/analizar-match', async (req, res) => {
  try {
    const { perfilEmpresa, licitacion, provider } = req.body;
    
    const resultado = await iaService.analizarMatch(perfilEmpresa, licitacion, provider);
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generar resumen
router.post('/resumen', async (req, res) => {
  try {
    const { licitacion, provider } = req.body;
    
    const resumen = await iaService.generarResumenLicitacion(licitacion, provider);
    res.json(resumen);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generar documentación
router.post('/documentacion', async (req, res) => {
  try {
    const { perfilEmpresa, licitacion, provider } = req.body;
    
    const documentacion = await iaService.generarDocumentacionPostulacion(
      perfilEmpresa, 
      licitacion, 
      provider
    );
    res.json(documentacion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar disponibilidad de IA
router.get('/disponibilidad', async (req, res) => {
  try {
    const availability = await iaService.checkAvailability();
    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
