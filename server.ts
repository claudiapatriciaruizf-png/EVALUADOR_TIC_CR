import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  // Initialize Gemini AI SDK
  const ai = new GoogleGenAI();

  // API endpoint for evaluating student evidence (supports text or uploaded file)
  app.post('/api/evaluate', async (req, res) => {
    try {
      const {
        studentName,
        documentId,
        category, // Documentos Comerciales, Word, Excel Básico e Intermedio, Excel Avanzado
        subtema, // Specific dependent topic selected
        evidenceText,
        fileData, // base64 string if file uploaded
        fileMimeType, // mime type of uploaded file
        fileName, // original file name
        customPrompt,
      } = req.body;

      if (!studentName || !category || (!evidenceText && !fileData)) {
        return res.status(400).json({ error: 'Faltan datos obligatorios: Nombre, Categoría y Archivo o Descripción de la Evidencia.' });
      }

      const systemInstruction = `Actúa como un Asistente Experto en Evaluación y Retroalimentación Pedagógica del SENA (Servicio Nacional de Aprendizaje), especializado en competencias tecnológicas y formación por competencias.
Catálogo oficial de categorías y temas específicos:
1. Documentos Comerciales:
   - MEMORANDO
   - Carta Comercial
   - Acta
   - Informe
2. Word:
   - Formato – Fuente, párrafo
   - Tablas
   - Imágenes y estilos
   - Combinación de Correspondencia
   - Columnas
3. Excel Básico e Intermedio:
   - Ejercicios de Formatos y Formulación Básica
   - Ordenación y Filtro
   - Funciones de Texto, Fecha y Validaciones
   - Gráficos
   - Funciones Buscar
   - Tablas y Gráficos Dinámicos
4. Excel Avanzado:
   - Dashboard Ejemplo 1
   - Dashboard Ejemplo 2
   - Dashboard Ejemplo 3
   - Dashboard Ejemplo 4
   - Dashboard Ejemplo 5

Debes estructurar tu respuesta estrictamente en formato JSON que contenga:
- razonamiento: {
    identificacionTematica: string (explicar la categoría y el tema específico evaluado),
    evaluacionCriterios: string (criterios técnicos aplicados según el tema específico),
    clasificacionResultados: string (separación de aciertos y errores),
    planificacionPedagogica: string (plan de mejoramiento formativo SENA)
  }
- datosAprendiz: {
    nombre: string,
    identificacion: string,
    categoria: string,
    subtema: string,
    fechaEvaluacion: string
  }
- ejerciciosCorrectos: Array<{ id: string, titulo: string, descripcion: string, criterioTecnico: string }>,
- ejerciciosIncorrectos: Array<{ id: string, titulo: string, descripcionError: string, causaRaiz: string, recomendacionTecnica: string }>,
- sugerenciasMejora: Array<{ area: string, recomendacion: string, recursoSena: string }>
- calificacionEstimada: string (ej: "Aprobado (A)" o "No Aprobado (D)" según criterios SENA)
- comentarioGeneral: string (tono profesional, empático y estrictamente pedagógico).`;

      const promptText = `Evalúa la siguiente evidencia de aprendizaje del aprendiz ${studentName}:
- Categoría: "${category}"
- Tema Específico: "${subtema || 'General'}"
- Ficha SENA: ${documentId || 'N/A'}
${fileName ? `[Archivo de evidencia adjunto: ${fileName}]` : ''}
${evidenceText ? `Descripción / Contenido textual aportado: \n${evidenceText}` : ''}
${customPrompt ? `Instrucciones o énfasis adicional del instructor: ${customPrompt}` : ''}

Analiza minuciosamente el contenido de la evidencia o archivo adjunto frente al tema específico seleccionado ("${subtema || category}"), identifica aciertos y errores técnicos según los estándares SENA, y responde en el esquema JSON requerido.`;

      // Define response schema for structured output
      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          razonamiento: {
            type: Type.OBJECT,
            properties: {
              identificacionTematica: { type: Type.STRING },
              evaluacionCriterios: { type: Type.STRING },
              clasificacionResultados: { type: Type.STRING },
              planificacionPedagogica: { type: Type.STRING }
            },
            required: ['identificacionTematica', 'evaluacionCriterios', 'clasificacionResultados', 'planificacionPedagogica']
          },
          datosAprendiz: {
            type: Type.OBJECT,
            properties: {
              nombre: { type: Type.STRING },
              identificacion: { type: Type.STRING },
              categoria: { type: Type.STRING },
              subtema: { type: Type.STRING },
              fechaEvaluacion: { type: Type.STRING }
            },
            required: ['nombre', 'identificacion', 'categoria', 'subtema', 'fechaEvaluacion']
          },
          ejerciciosCorrectos: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                titulo: { type: Type.STRING },
                descripcion: { type: Type.STRING },
                criterioTecnico: { type: Type.STRING }
              },
              required: ['id', 'titulo', 'descripcion', 'criterioTecnico']
            }
          },
          ejerciciosIncorrectos: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                titulo: { type: Type.STRING },
                descripcionError: { type: Type.STRING },
                causaRaiz: { type: Type.STRING },
                recomendacionTecnica: { type: Type.STRING }
              },
              required: ['id', 'titulo', 'descripcionError', 'causaRaiz', 'recomendacionTecnica']
            }
          },
          sugerenciasMejora: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                area: { type: Type.STRING },
                recomendacion: { type: Type.STRING },
                recursoSena: { type: Type.STRING }
              },
              required: ['area', 'recomendacion', 'recursoSena']
            }
          },
          calificacionEstimada: { type: Type.STRING },
          comentarioGeneral: { type: Type.STRING }
        },
        required: [
          'razonamiento',
          'datosAprendiz',
          'ejerciciosCorrectos',
          'ejerciciosIncorrectos',
          'sugerenciasMejora',
          'calificacionEstimada',
          'comentarioGeneral'
        ]
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [promptText, ...(fileData && fileMimeType ? [{ inlineData: { mimeType: fileMimeType, data: fileData } }] : [])],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.2,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('No se recibió respuesta del modelo Gemini.');
      }

      const resultJson = JSON.parse(responseText);
      if (!resultJson.datosAprendiz.subtema && subtema) {
        resultJson.datosAprendiz.subtema = subtema;
      }
      res.json(resultJson);

    } catch (error: any) {
      console.error('Error in /api/evaluate:', error);
      res.status(500).json({ error: error.message || 'Error al procesar la evaluación con IA.' });
    }
  });

  // Setup Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Servidor SENA Asistente corriendo en http://localhost:${port}`);
  });
}

startServer();
