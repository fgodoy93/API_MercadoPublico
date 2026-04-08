import { Anthropic } from "@anthropic-ai/sdk";
import { Ollama } from 'ollama';
import dotenv from 'dotenv';

dotenv.config();

const aiProvider = process.env.AI_PROVIDER || 'both'; // 'ollama', 'claude', or 'both'

let claudeClient = null;
let ollamaClient = null;

if (aiProvider === 'claude' || aiProvider === 'both') {
  claudeClient = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY
  });
}

if (aiProvider === 'ollama' || aiProvider === 'both') {
  ollamaClient = new Ollama({
    host: process.env.OLLAMA_API_URL || 'http://localhost:11434'
  });
}

export const iaService = {
  // Analizar match entre perfil de empresa y licitación
  async analizarMatch(perfilEmpresa, licitacion, provider = 'best') {
    const prompt = `
Analiza el nivel de match entre el perfil de una empresa y una licitación.

PERFIL DE EMPRESA:
${JSON.stringify(perfilEmpresa, null, 2)}

LICITACIÓN:
${JSON.stringify(licitacion, null, 2)}

Por favor proporciona:
1. Nivel de match (0-100)
2. Puntos fuertes
3. Puntos débiles
4. Recomendaciones

Responde en formato JSON.
    `;

    return this.generateResponse(prompt, provider);
  },

  // Generar resumen de licitación
  async generarResumenLicitacion(licitacion, provider = 'best') {
    const prompt = `
Genera un resumen ejecutivo profesional de la siguiente licitación para facilitar la toma de decisiones:

${JSON.stringify(licitacion, null, 2)}

El resumen debe incluir:
1. Descripción del objeto de la licitación
2. Requisitos principales
3. Plazo de entrega
4. Presupuesto estimado
5. Riesgos potenciales

Responde en formato JSON con estructura clara.
    `;

    return this.generateResponse(prompt, provider);
  },

  // Generar documentación para postulación
  async generarDocumentacionPostulacion(perfilEmpresa, licitacion, provider = 'best') {
    const prompt = `
Genera una guía de documentación recomendada para postular a la siguiente licitación:

PERFIL DE EMPRESA:
${JSON.stringify(perfilEmpresa, null, 2)}

LICITACIÓN:
${JSON.stringify(licitacion, null, 2)}

Proporciona:
1. Documentos requeridos por la licitación
2. Documentos recomendados adicionales
3. Lista de verificación (checklist)
4. Consideraciones legales
5. Plantillas sugeridas

Responde en formato JSON.
    `;

    return this.generateResponse(prompt, provider);
  },

  // Generar respuesta usando el proveedor especificado
  async generateResponse(prompt, provider = 'best') {
    if (provider === 'best' || provider === 'both') {
      // Intentar con Claude primero, luego Ollama
      if (claudeClient) {
        return await this.generateWithClaude(prompt);
      }
      if (ollamaClient) {
        return await this.generateWithOllama(prompt);
      }
    }

    if (provider === 'claude' && claudeClient) {
      return await this.generateWithClaude(prompt);
    }

    if (provider === 'ollama' && ollamaClient) {
      return await this.generateWithOllama(prompt);
    }

    throw new Error('No hay proveedor de IA disponible configurado');
  },

  async generateWithClaude(prompt) {
    try {
      const message = await claudeClient.messages.create({
        model: 'claude-opus', // o 'claude-3-sonnet-20240229'
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      
      // Intentar parsear como JSON, si no funciona, retornar como texto
      try {
        return JSON.parse(responseText);
      } catch {
        return { texto: responseText };
      }
    } catch (error) {
      console.error('Error con Claude:', error);
      throw error;
    }
  },

  async generateWithOllama(prompt) {
    try {
      const response = await ollamaClient.generate({
        model: 'llama2', // o 'mistral', dependiendo de qué tengas instalado
        prompt: prompt,
        stream: false,
        format: 'json'
      });

      const responseText = response.response;
      
      // Intentar parsear como JSON
      try {
        return JSON.parse(responseText);
      } catch {
        return { texto: responseText };
      }
    } catch (error) {
      console.error('Error con Ollama:', error);
      throw error;
    }
  },

  // Verificar disponibilidad de proveedores
  async checkAvailability() {
    const availability = {
      claude: false,
      ollama: false
    };

    if (claudeClient && process.env.CLAUDE_API_KEY) {
      availability.claude = true;
    }

    if (ollamaClient) {
      try {
        // Intentar conexión a Ollama
        const response = await ollamaClient.list();
        availability.ollama = true;
      } catch {
        availability.ollama = false;
      }
    }

    return availability;
  }
};
