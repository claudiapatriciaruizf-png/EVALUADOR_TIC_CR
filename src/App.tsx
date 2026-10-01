/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  BrainCircuit, 
  BookOpen, 
  ClipboardCheck, 
  History, 
  Trash2, 
  Copy, 
  Printer, 
  Sparkles, 
  ChevronRight, 
  AlertTriangle, 
  RefreshCw, 
  Award, 
  Layers, 
  HelpCircle, 
  Upload, 
  FileCheck2, 
  X, 
  BarChart3, 
  Users, 
  Search, 
  Filter, 
  Database,
  ListTree,
  Tag
} from 'lucide-react';

interface Razonamiento {
  identificacionTematica: string;
  evaluacionCriterios: string;
  clasificacionResultados: string;
  planificacionPedagogica: string;
}

interface DatosAprendiz {
  nombre: string;
  identificacion: string; // Número de ficha
  categoria: string;
  subtema?: string; // Subtema o tema específico evaluado
  fechaEvaluacion: string;
}

interface EjercicioCorrecto {
  id: string;
  titulo: string;
  descripcion: string;
  criterioTecnico: string;
}

interface EjercicioIncorrecto {
  id: string;
  titulo: string;
  descripcionError: string;
  causaRaiz: string;
  recomendacionTecnica: string;
}

interface SugerenciaMejora {
  area: string;
  recomendacion: string;
  recursoSena: string;
}

interface EvaluacionResult {
  razonamiento: Razonamiento;
  datosAprendiz: DatosAprendiz;
  ejerciciosCorrectos: EjercicioCorrecto[];
  ejerciciosIncorrectos: EjercicioIncorrecto[];
  sugerenciasMejora: SugerenciaMejora[];
  calificacionEstimada: string;
  comentarioGeneral: string;
}

const CATEGORIAS_SENA = [
  {
    id: 'Documentos Comerciales',
    name: 'Documentos Comerciales',
    desc: 'Memorandos, Cartas Comerciales, Actas e Informes técnicos',
    icon: FileText,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    subtemas: [
      'MEMORANDO',
      'Carta Comercial',
      'Acta',
      'Informe'
    ]
  },
  {
    id: 'Word',
    name: 'Word',
    desc: 'Formato, Tablas, Imágenes y estilos, Correspondencia y Columnas',
    icon: BookOpen,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    subtemas: [
      'Formato – Fuente, párrafo',
      'Tablas',
      'Imágenes y estilos',
      'Combinación de Correspondencia',
      'Columnas'
    ]
  },
  {
    id: 'Excel Básico e Intermedio',
    name: 'Excel Básico e Intermedio',
    desc: 'Formatos, Formulación, Filtros, Funciones, Gráficos y Tablas Dinámicas',
    icon: Layers,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    subtemas: [
      'Ejercicios de Formatos y Formulación Básica',
      'Ordenación y Filtro',
      'Funciones de Texto, Fecha y Validaciones',
      'Gráficos',
      'Funciones Buscar',
      'Tablas y Gráficos Dinámicos'
    ]
  },
  {
    id: 'Excel Avanzado',
    name: 'Excel Avanzado',
    desc: 'Dashboards analíticos y modelos gerenciales de control',
    icon: Award,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    subtemas: [
      'Dashboard Ejemplo 1',
      'Dashboard Ejemplo 2',
      'Dashboard Ejemplo 3',
      'Dashboard Ejemplo 4',
      'Dashboard Ejemplo 5'
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'evaluar' | 'historial' | 'guia' | 'admin'>('evaluar');
  const [studentName, setStudentName] = useState('');
  const [fichaNumber, setFichaNumber] = useState('');
  const [category, setCategory] = useState(CATEGORIAS_SENA[0].id);
  const [subtema, setSubtema] = useState(CATEGORIAS_SENA[0].subtemas[0]);
  const [evidenceText, setEvidenceText] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<EvaluacionResult | null>(null);
  const [historial, setHistorial] = useState<EvaluacionResult[]>([]);
  const [showReasoning, setShowReasoning] = useState(false);
  const [copied, setCopied] = useState(false);

  // Admin filters
  const [adminSearch, setAdminSearch] = useState('');
  const [adminFichaFilter, setAdminFichaFilter] = useState('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState('ALL');
  const [adminSubtemaFilter, setAdminSubtemaFilter] = useState('ALL');

  useEffect(() => {
    const saved = localStorage.getItem('sena_evaluaciones_historial');
    if (saved) {
      try {
        setHistorial(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading history', e);
      }
    }
  }, []);

  const saveToHistory = (result: EvaluacionResult) => {
    const updated = [result, ...historial.filter(h => h.datosAprendiz.nombre !== result.datosAprendiz.nombre || h.datosAprendiz.fechaEvaluacion !== result.datosAprendiz.fechaEvaluacion)];
    setHistorial(updated);
    localStorage.setItem('sena_evaluaciones_historial', JSON.stringify(updated));
  };

  const deleteFromHistory = (index: number) => {
    const updated = historial.filter((_, i) => i !== index);
    setHistorial(updated);
    localStorage.setItem('sena_evaluaciones_historial', JSON.stringify(updated));
  };

  // Handler for category change with dependent subtopic auto-selection
  const handleCategoryChange = (newCatId: string) => {
    setCategory(newCatId);
    const catObj = CATEGORIAS_SENA.find(c => c.id === newCatId);
    if (catObj && catObj.subtemas.length > 0) {
      setSubtema(catObj.subtemas[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileMimeType(file.type || 'application/octet-stream');

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      const base64Content = resultStr.split(',')[1];
      setFileBase64(base64Content);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileBase64(null);
    setFileMimeType(null);
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setError('Por favor ingrese el nombre completo del aprendiz.');
      return;
    }
    if (!fichaNumber.trim()) {
      setError('Por favor ingrese el número de ficha SENA.');
      return;
    }
    if (!subtema) {
      setError('Por favor seleccione el tema específico / subtema.');
      return;
    }
    if (!selectedFile && !evidenceText.trim()) {
      setError('Es obligatorio cargar el archivo de trabajo del aprendiz o ingresar la descripción de la evidencia.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          documentId: fichaNumber,
          category,
          subtema,
          evidenceText: evidenceText || (selectedFile ? `Evidencia cargada mediante archivo: ${selectedFile.name}` : ''),
          fileData: fileBase64,
          fileMimeType: fileMimeType,
          fileName: selectedFile?.name,
          customPrompt
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error en el servidor al procesar la evaluación.');
      }

      if (!data.datosAprendiz.fechaEvaluacion) {
        data.datosAprendiz.fechaEvaluacion = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
      }

      if (!data.datosAprendiz.subtema) {
        data.datosAprendiz.subtema = subtema;
      }

      setCurrentResult(data);
      saveToHistory(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servicio de IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!currentResult) return;
    const reportText = `
INFORME DE EVALUACIÓN Y RETROALIMENTACIÓN PEDAGÓGICA - SENA
--------------------------------------------------------------
Aprendiz: ${currentResult.datosAprendiz.nombre}
Número de Ficha: ${currentResult.datosAprendiz.identificacion}
Competencia: ${currentResult.datosAprendiz.categoria}
Tema Específico: ${currentResult.datosAprendiz.subtema || 'General'}
Fecha: ${currentResult.datosAprendiz.fechaEvaluacion}
Calificación Estimada: ${currentResult.calificacionEstimada}

1. COMENTARIO GENERAL:
${currentResult.comentarioGeneral}

2. EJERCICIOS CORRECTOS:
${currentResult.ejerciciosCorrectos.map(e => `- ${e.titulo}: ${e.descripcion} (Criterio: ${e.criterioTecnico})`).join('\n')}

3. EJERCICIOS INCORRECTOS Y ANÁLISIS DEL ERROR:
${currentResult.ejerciciosIncorrectos.map(e => `- ${e.titulo}: ${e.descripcionError}\n  Causa Raíz: ${e.causaRaiz}\n  Recomendación: ${e.recomendacionTecnica}`).join('\n\n')}

4. SUGERENCIAS PERSONALIZADAS DE MEJORA:
${currentResult.sugerenciasMejora.map(s => `- [${s.area}] ${s.recomendacion} (Recurso SENA: ${s.recursoSena})`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Analytics computed from historial
  const totalEvaluaciones = historial.length;
  const uniqueFichas = Array.from(new Set(historial.map(h => h.datosAprendiz.identificacion))).filter(Boolean);
  const uniqueAprendices = Array.from(new Set(historial.map(h => h.datosAprendiz.nombre))).filter(Boolean);
  const aprobadosCount = historial.filter(h => h.calificacionEstimada.toLowerCase().includes('aprobado') && !h.calificacionEstimada.toLowerCase().includes('no')).length;
  const porcentajeAprobacion = totalEvaluaciones > 0 ? Math.round((aprobadosCount / totalEvaluaciones) * 100) : 0;

  // Current category object for dependent select
  const currentCategoryObj = CATEGORIAS_SENA.find(c => c.id === category) || CATEGORIAS_SENA[0];

  // Available subtopics for admin filter when a category is selected
  const adminCategoryObj = CATEGORIAS_SENA.find(c => c.id === adminCategoryFilter);

  // Filtered historial for admin
  const filteredHistorial = historial.filter(item => {
    const matchesSearch = item.datosAprendiz.nombre.toLowerCase().includes(adminSearch.toLowerCase()) ||
                          item.datosAprendiz.identificacion.toLowerCase().includes(adminSearch.toLowerCase());
    const matchesFicha = adminFichaFilter === '' || item.datosAprendiz.identificacion.includes(adminFichaFilter);
    const matchesCategory = adminCategoryFilter === 'ALL' || item.datosAprendiz.categoria === adminCategoryFilter;
    const matchesSubtema = adminSubtemaFilter === 'ALL' || item.datosAprendiz.subtema === adminSubtemaFilter;
    return matchesSearch && matchesFicha && matchesCategory && matchesSubtema;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* SENA Header Navbar */}
      <header className="bg-[#00324D] text-white shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#39A900] flex items-center justify-center font-bold text-2xl shadow-lg border-2 border-white/20">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider bg-[#39A900] px-2 py-0.5 rounded font-semibold text-white">SENA</span>
                <span className="text-xs text-slate-300">Formación por Competencias</span>
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Asistente de Evaluación Pedagógica</h1>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-1 bg-white/10 p-1.5 rounded-xl backdrop-blur-sm">
              <button
                onClick={() => setActiveTab('evaluar')}
                className={`px-3.5 py-2 rounded-lg font-medium text-xs md:text-sm transition-all flex items-center gap-1.5 ${activeTab === 'evaluar' ? 'bg-[#39A900] text-white shadow' : 'hover:bg-white/10 text-slate-200'}`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Evaluar</span>
              </button>
              <button
                onClick={() => setActiveTab('historial')}
                className={`px-3.5 py-2 rounded-lg font-medium text-xs md:text-sm transition-all flex items-center gap-1.5 ${activeTab === 'historial' ? 'bg-[#39A900] text-white shadow' : 'hover:bg-white/10 text-slate-200'}`}
              >
                <History className="w-4 h-4" />
                <span>Historial</span>
              </button>
              <button
                onClick={() => setActiveTab('guia')}
                className={`px-3.5 py-2 rounded-lg font-medium text-xs md:text-sm transition-all flex items-center gap-1.5 ${activeTab === 'guia' ? 'bg-[#39A900] text-white shadow' : 'hover:bg-white/10 text-slate-200'}`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Guía</span>
              </button>
            </div>

            {/* Admin Panel Button in Top Right */}
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 shadow-md cursor-pointer ${activeTab === 'admin' ? 'bg-amber-500 text-slate-900 ring-2 ring-white/40' : 'bg-[#39A900] hover:bg-[#329600] text-white'}`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Panel de Administrador</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        {activeTab === 'evaluar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Form */}
            <div className="lg:col-span-5 space-y-6 no-print">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-[#00324D] flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-[#39A900]" />
                    Carga de Evidencia del Aprendiz
                  </h2>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">Instructor SENA</span>
                </div>

                <form onSubmit={handleEvaluate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Nombre Completo del Aprendiz *
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Ej: Ana María Rodríguez"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none bg-white transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Número de Ficha SENA *
                    </label>
                    <input
                      type="text"
                      value={fichaNumber}
                      onChange={(e) => setFichaNumber(e.target.value)}
                      placeholder="Ej: 2854912"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none bg-white transition-all"
                      required
                    />
                  </div>

                  {/* Categoría Principal */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Categoría / Competencia *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none bg-white transition-all font-medium text-slate-800"
                    >
                      {CATEGORIAS_SENA.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      {currentCategoryObj.desc}
                    </p>
                  </div>

                  {/* Lista Desplegable Dependiente: Subtema */}
                  <div className="bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-200">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-900 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ListTree className="w-4 h-4 text-[#39A900]" />
                        Tema Específico de {currentCategoryObj.name} *
                      </span>
                      <span className="text-[10px] bg-[#39A900] text-white px-2 py-0.5 rounded-full font-bold">
                        Lista Dependiente
                      </span>
                    </label>
                    <select
                      value={subtema}
                      onChange={(e) => setSubtema(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-emerald-300 focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none bg-white transition-all font-semibold text-slate-800 shadow-2xs"
                      required
                    >
                      {currentCategoryObj.subtemas.map((sub, idx) => (
                        <option key={idx} value={sub}>
                          • {sub}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-emerald-700 mt-1.5 flex items-center gap-1">
                      <span>Criterio técnico enfocado en:</span>
                      <strong>{subtema}</strong>
                    </p>
                  </div>

                  {/* Mandatory File Upload Section */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                      <span>Archivo de Trabajo del Aprendiz *</span>
                      <span className="text-[11px] text-emerald-700 font-normal">Excel, Word, PDF, CSV, Imagen</span>
                    </label>
                    
                    {!selectedFile ? (
                      <label className="border-2 border-dashed border-slate-300 hover:border-[#39A900] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-emerald-50/40 transition-all group">
                        <Upload className="w-8 h-8 text-slate-400 group-hover:text-[#39A900] mb-2 transition-all" />
                        <span className="text-xs font-bold text-slate-700 group-hover:text-[#00324D]">Haga clic para cargar el archivo</span>
                        <span className="text-[11px] text-slate-400 mt-0.5">(.xlsx, .docx, .pdf, .csv, .txt, .png, .jpg)</span>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept=".xlsx,.xls,.docx,.doc,.csv,.txt,.pdf,.png,.jpg,.jpeg"
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <FileCheck2 className="w-6 h-6 text-[#39A900] shrink-0" />
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800 block truncate">{selectedFile.name}</span>
                            <span className="text-[11px] text-slate-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeFile}
                          className="p-1.5 hover:bg-emerald-200/60 rounded-lg text-slate-600 transition-all"
                          title="Remover archivo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Observaciones o Contexto Adicional (Opcional)
                    </label>
                    <textarea
                      rows={3}
                      value={evidenceText}
                      onChange={(e) => setEvidenceText(e.target.value)}
                      placeholder="Agregue notas adicionales sobre el taller, fórmulas específicas utilizadas o contexto del ejercicio..."
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none bg-white transition-all text-xs leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Criterios o Énfasis de Evaluación (Opcional)
                    </label>
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Ej: Enfocarse en normas ICONTEC o uso de VLOOKUP."
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none bg-white transition-all"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-[#39A900] hover:bg-[#329600] active:bg-[#2d8500] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Analizando Archivo con IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Evaluar {subtema} y Generar Retroalimentación</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Result / Report */}
            <div className="lg:col-span-7 space-y-6">
              {!currentResult && !loading && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center justify-center h-full min-h-[500px]">
                  <div className="w-20 h-20 bg-emerald-50 text-[#39A900] rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                    <BrainCircuit className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-[#00324D] mb-2">Cargue el archivo de trabajo del aprendiz</h3>
                  <p className="text-slate-500 max-w-md text-sm leading-relaxed mb-6">
                    Seleccione la categoría y el tema específico ({subtema}), luego adjunte el archivo para que el asistente aplique la rúbrica técnica institucional SENA.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-left max-w-md w-full text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#39A900]" />
                      <span>Temas específicos detallados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#39A900]" />
                      <span>Causas raíz de errores técnicos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#39A900]" />
                      <span>Juicio evaluativo SENA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#39A900]" />
                      <span>Reporte exportable</span>
                    </div>
                  </div>
                </div>
              )}

              {loading && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center flex flex-col items-center justify-center h-full min-h-[500px]">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-full border-4 border-emerald-100 border-t-[#39A900] animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-[#39A900] font-bold">
                      SENA
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[#00324D] mb-1">Analizando Evidencia: {subtema}</h3>
                  <p className="text-slate-500 text-sm max-w-sm">
                    Revisando criterios técnicos específicos para <strong>{category}</strong> y formulando la retroalimentación constructiva.
                  </p>
                </div>
              )}

              {currentResult && !loading && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none">
                  {/* Report Header Actions */}
                  <div className="bg-[#00324D] text-white p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs uppercase tracking-wider bg-[#39A900] px-2.5 py-0.5 rounded font-semibold text-white">
                          {currentResult.datosAprendiz.categoria}
                        </span>
                        {currentResult.datosAprendiz.subtema && (
                          <span className="text-xs uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded font-semibold text-emerald-200 border border-white/10">
                            • {currentResult.datosAprendiz.subtema}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-extrabold mt-1">{currentResult.datosAprendiz.nombre}</h2>
                      <p className="text-xs text-slate-300">Número de Ficha: {currentResult.datosAprendiz.identificacion} • {currentResult.datosAprendiz.fechaEvaluacion}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyReport}
                        className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
                      >
                        <Copy className="w-4 h-4" />
                        <span>{copied ? '¡Copiado!' : 'Copiar Informe'}</span>
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="px-3.5 py-2 bg-[#39A900] hover:bg-[#329600] text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Imprimir / PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Print-only Header */}
                  <div className="hidden print-only p-6 border-b border-slate-300 mb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h1 className="text-2xl font-bold text-[#00324D]">SERVICIO NACIONAL DE APRENDIZAJE SENA</h1>
                        <p className="text-sm font-semibold text-slate-600">INFORME DE EVALUACIÓN Y RETROALIMENTACIÓN PEDAGÓGICA</p>
                      </div>
                      <div className="text-right text-xs text-slate-600">
                        <p><strong>Fecha:</strong> {currentResult.datosAprendiz.fechaEvaluacion}</p>
                        <p><strong>Ficha SENA:</strong> {currentResult.datosAprendiz.identificacion}</p>
                      </div>
                    </div>
                    <hr className="my-3 border-slate-300" />
                    <p><strong>Aprendiz:</strong> {currentResult.datosAprendiz.nombre}</p>
                    <p><strong>Competencia:</strong> {currentResult.datosAprendiz.categoria}</p>
                    <p><strong>Tema Específico:</strong> {currentResult.datosAprendiz.subtema || 'General'}</p>
                  </div>

                  <div className="p-6 md:p-8 space-y-8">
                    {/* Juicio Evaluativo & General Comment */}
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Juicio Evaluativo Sugerido</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentResult.calificacionEstimada.toLowerCase().includes('aprobado') && !currentResult.calificacionEstimada.toLowerCase().includes('no') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {currentResult.calificacionEstimada}
                          </span>
                          {currentResult.datosAprendiz.subtema && (
                            <span className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                              Tema: {currentResult.datosAprendiz.subtema}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 md:text-right">
                        <span className="text-xs text-slate-500 italic block">Evaluación técnica según estándares SENA</span>
                      </div>
                    </div>

                    {/* Comentario General */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#00324D] mb-2 flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#39A900]" />
                        Retroalimentación General del Instructor
                      </h3>
                      <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-700 text-sm leading-relaxed">
                        {currentResult.comentarioGeneral}
                      </div>
                    </div>

                    {/* Reasoning Process Accordion */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setShowReasoning(!showReasoning)}
                        className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <BrainCircuit className="w-4 h-4 text-[#39A900]" />
                          <span>Proceso de Razonamiento Paso a Paso (Metodología SENA)</span>
                        </div>
                        <span className="text-slate-400 font-normal lowercase">{showReasoning ? 'Ocultar' : 'Ver detalle'}</span>
                      </button>

                      {showReasoning && currentResult.razonamiento && (
                        <div className="p-5 bg-white space-y-4 text-xs border-t border-slate-200">
                          <div>
                            <strong className="text-[#00324D] block mb-1">1. Identificación de la Temática:</strong>
                            <p className="text-slate-600 leading-relaxed">{currentResult.razonamiento.identificacionTematica}</p>
                          </div>
                          <div>
                            <strong className="text-[#00324D] block mb-1">2. Evaluación de Criterios:</strong>
                            <p className="text-slate-600 leading-relaxed">{currentResult.razonamiento.evaluacionCriterios}</p>
                          </div>
                          <div>
                            <strong className="text-[#00324D] block mb-1">3. Clasificación de Resultados:</strong>
                            <p className="text-slate-600 leading-relaxed">{currentResult.razonamiento.clasificacionResultados}</p>
                          </div>
                          <div>
                            <strong className="text-[#00324D] block mb-1">4. Planificación Pedagógica:</strong>
                            <p className="text-slate-600 leading-relaxed">{currentResult.razonamiento.planificacionPedagogica}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ejercicios Correctos */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#00324D] mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#39A900]" />
                        Ejercicios y Criterios Correctos ({currentResult.ejerciciosCorrectos.length})
                      </h3>
                      {currentResult.ejerciciosCorrectos.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">No se registraron ejercicios totalmente correctos en esta evidencia.</p>
                      ) : (
                        <div className="space-y-3">
                          {currentResult.ejerciciosCorrectos.map((item, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-[#39A900] shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-bold text-slate-800 text-sm">{item.titulo}</h4>
                                <p className="text-slate-600 text-xs mt-0.5">{item.descripcion}</p>
                                <span className="inline-block mt-2 text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                                  Criterio: {item.criterioTecnico}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Ejercicios Incorrectos y Análisis del Error */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#00324D] mb-3 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        Ejercicios con Oportunidades de Mejora / Errores ({currentResult.ejerciciosIncorrectos.length})
                      </h3>
                      {currentResult.ejerciciosIncorrectos.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">¡Excelente! No se identificaron errores técnicos significativos en el archivo.</p>
                      ) : (
                        <div className="space-y-3">
                          {currentResult.ejerciciosIncorrectos.map((item, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-red-50/40 border border-red-100 flex items-start gap-3">
                              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                              <div className="space-y-1.5 flex-1">
                                <h4 className="font-bold text-slate-800 text-sm">{item.titulo}</h4>
                                <p className="text-slate-600 text-xs"><strong className="text-red-700">Error:</strong> {item.descripcionError}</p>
                                <p className="text-slate-600 text-xs"><strong className="text-slate-700">Causa Raíz:</strong> {item.causaRaiz}</p>
                                <div className="p-2.5 bg-white rounded-lg border border-red-200 mt-2 text-xs text-slate-700">
                                  <strong className="text-[#00324D] block mb-0.5">💡 Recomendación Técnica:</strong>
                                  {item.recomendacionTecnica}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sugerencias Personalizadas de Mejora */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#00324D] mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        Sugerencias Personalizadas de Mejora (Plan Pedagógico)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentResult.sugerenciasMejora.map((item, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 flex flex-col justify-between">
                            <div>
                              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">{item.area}</span>
                              <p className="text-slate-700 text-xs leading-relaxed mb-3">{item.recomendacion}</p>
                            </div>
                            <div className="pt-2 border-t border-amber-200/50 text-[11px] text-slate-500 flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                              <span>Recurso SENA / Práctica: {item.recursoSena}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#00324D]">Historial de Evaluaciones Realizadas</h2>
                <p className="text-xs text-slate-500">Consulte las retroalimentaciones generadas previamente guardadas en este dispositivo.</p>
              </div>
              <span className="text-xs font-bold bg-emerald-50 text-[#39A900] px-3 py-1.5 rounded-full border border-emerald-200">
                Total Registros: {historial.length}
              </span>
            </div>

            {historial.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700">No hay evaluaciones guardadas aún.</p>
                <p className="text-xs mt-1">Las evaluaciones que genere aparecerán listadas aquí.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {historial.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between transition-all hover:shadow-md">
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] uppercase tracking-wider bg-emerald-50 text-[#39A900] px-2 py-0.5 rounded font-bold">
                            {item.datosAprendiz.categoria}
                          </span>
                          {item.datosAprendiz.subtema && (
                            <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold border border-slate-200">
                              • {item.datosAprendiz.subtema}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">{item.datosAprendiz.fechaEvaluacion}</span>
                      </div>
                      <h3 className="font-bold text-[#00324D] text-base">{item.datosAprendiz.nombre}</h3>
                      <p className="text-xs text-slate-500 mb-3">Ficha SENA: {item.datosAprendiz.identificacion}</p>
                      <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 line-clamp-3 mb-4">
                        {item.comentarioGeneral}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-700">Estado: {item.calificacionEstimada}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCurrentResult(item);
                            setActiveTab('evaluar');
                          }}
                          className="px-3 py-1.5 bg-[#00324D] hover:bg-[#002233] text-white text-xs font-medium rounded-lg transition-all"
                        >
                          Ver Informe
                        </button>
                        <button
                          onClick={() => deleteFromHistory(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar del historial"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="space-y-6">
            {/* Admin Header */}
            <div className="bg-[#00324D] text-white rounded-2xl p-6 md:p-8 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-amber-500 text-slate-900 text-xs font-bold px-2.5 py-0.5 rounded-full">Panel de Control</span>
                  <span className="text-xs text-slate-300">Gestión y Analítica Institucional</span>
                </div>
                <h2 className="text-2xl font-black">Base de Datos y Analítica por Ficha y Aprendiz</h2>
                <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
                  Monitoreo centralizado de todas las respuestas evaluadas, estadísticas de aprobación por ficha SENA y rendimiento por módulos y temas específicos.
                </p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 flex items-center gap-4">
                <div>
                  <span className="text-xs text-slate-300 block">Total Evaluaciones</span>
                  <span className="text-2xl font-black text-[#39A900]">{totalEvaluaciones}</span>
                </div>
                <div className="h-8 w-px bg-white/20"></div>
                <div>
                  <span className="text-xs text-slate-300 block">Fichas Activas</span>
                  <span className="text-2xl font-black text-white">{uniqueFichas.length}</span>
                </div>
              </div>
            </div>

            {/* Analytics KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 block mb-1">Aprendices Evaluados</span>
                  <span className="text-2xl font-black text-[#00324D]">{uniqueAprendices.length}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 block mb-1">Fichas SENA Únicas</span>
                  <span className="text-2xl font-black text-[#00324D]">{uniqueFichas.length}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#39A900] flex items-center justify-center">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 block mb-1">Tasa de Aprobación</span>
                  <span className="text-2xl font-black text-emerald-600">{porcentajeAprobacion}%</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#39A900] flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 block mb-1">Módulos Oficiales</span>
                  <span className="text-2xl font-black text-[#00324D]">{CATEGORIAS_SENA.length}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    placeholder="Buscar por aprendiz, ficha o tema específico..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none bg-white transition-all"
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                  {/* Category Filter */}
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 w-full sm:w-auto">
                    <Filter className="w-4 h-4 text-slate-500 shrink-0" />
                    <select
                      value={adminCategoryFilter}
                      onChange={(e) => {
                        setAdminCategoryFilter(e.target.value);
                        setAdminSubtemaFilter('ALL');
                      }}
                      className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="ALL">Todas las Competencias</option>
                      {CATEGORIAS_SENA.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subtema Filter (Available when a category is selected) */}
                  {adminCategoryObj && (
                    <div className="flex items-center gap-2 bg-emerald-50/50 px-3 py-2 rounded-xl border border-emerald-200 w-full sm:w-auto">
                      <ListTree className="w-4 h-4 text-[#39A900] shrink-0" />
                      <select
                        value={adminSubtemaFilter}
                        onChange={(e) => setAdminSubtemaFilter(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                      >
                        <option value="ALL">Todos los Temas de {adminCategoryObj.name}</option>
                        {adminCategoryObj.subtemas.map((sub, i) => (
                          <option key={i} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Ficha Filter */}
                  <select
                    value={adminFichaFilter}
                    onChange={(e) => setAdminFichaFilter(e.target.value)}
                    className="bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 outline-none cursor-pointer w-full sm:w-auto"
                  >
                    <option value="">Todas las Fichas</option>
                    {uniqueFichas.map(f => (
                      <option key={f} value={f}>Ficha: {f}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Database Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-[#00324D] text-base">Base de Datos de Respuestas y Evaluaciones ({filteredHistorial.length})</h3>
                <span className="text-xs text-slate-500">Registros almacenados localmente</span>
              </div>

              {filteredHistorial.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold text-slate-700">No se encontraron registros que coincidan con los filtros.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                        <th className="p-4">Aprendiz</th>
                        <th className="p-4">Ficha SENA</th>
                        <th className="p-4">Competencia y Tema Específico</th>
                        <th className="p-4">Fecha</th>
                        <th className="p-4">Juicio Evaluativo</th>
                        <th className="p-4 text-center">Correctos / Errores</th>
                        <th className="p-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredHistorial.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-all">
                          <td className="p-4 font-bold text-[#00324D]">{item.datosAprendiz.nombre}</td>
                          <td className="p-4 font-mono text-slate-600 bg-slate-50/50 rounded">{item.datosAprendiz.identificacion}</td>
                          <td className="p-4">
                            <span className="font-semibold text-slate-800 block">{item.datosAprendiz.categoria}</span>
                            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium inline-block mt-0.5 border border-emerald-100">
                              • {item.datosAprendiz.subtema || 'General'}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">{item.datosAprendiz.fechaEvaluacion}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${item.calificacionEstimada.toLowerCase().includes('aprobado') && !item.calificacionEstimada.toLowerCase().includes('no') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {item.calificacionEstimada}
                            </span>
                          </td>
                          <td className="p-4 text-center font-medium">
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mr-1">✓ {item.ejerciciosCorrectos.length}</span>
                            <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded">✗ {item.ejerciciosIncorrectos.length}</span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setCurrentResult(item);
                                setActiveTab('evaluar');
                              }}
                              className="px-3 py-1.5 bg-[#00324D] hover:bg-[#002233] text-white font-medium rounded-lg transition-all"
                            >
                              Ver Informe
                            </button>
                            <button
                              onClick={() => deleteFromHistory(historial.indexOf(item))}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all inline-block"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'guia' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#39A900] flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#00324D]">Guía Metodológica y Catálogo de Temáticas SENA</h2>
                <p className="text-xs text-slate-500">Estructura oficial de competencias y listas desplegables dependientes.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-700 leading-relaxed">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-bold text-[#00324D] mb-1 flex items-center gap-2 text-sm">
                  <ChevronRight className="w-4 h-4 text-[#39A900]" />
                  1. Listas Desplegables Dependientes
                </h3>
                <p>
                  Al seleccionar una de las 4 categorías principales, el sistema habilita automáticamente el listado de temas específicos asociados para que la inteligencia artificial calibre los criterios técnicos de evaluación exactos.
                </p>
              </div>

              <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-[#00324D] text-sm flex items-center gap-2">
                  <ListTree className="w-4 h-4 text-[#39A900]" />
                  2. Catálogo Oficial por Competencia:
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Documentos Comerciales */}
                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                    <h4 className="font-bold text-emerald-900 text-sm mb-2 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#39A900]" />
                      Documentos Comerciales
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-700 pl-4 list-disc">
                      <li>MEMORANDO</li>
                      <li>Carta Comercial</li>
                      <li>Acta</li>
                      <li>Informe</li>
                    </ul>
                  </div>

                  {/* Word */}
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200">
                    <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      Word
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-700 pl-4 list-disc">
                      <li>Formato – Fuente, párrafo</li>
                      <li>Tablas</li>
                      <li>Imágenes y estilos</li>
                      <li>Combinación de Correspondencia</li>
                      <li>Columnas</li>
                    </ul>
                  </div>

                  {/* Excel Básico e Intermedio */}
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
                    <h4 className="font-bold text-amber-900 text-sm mb-2 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-600" />
                      Excel Básico e Intermedio
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-700 pl-4 list-disc">
                      <li>Ejercicios de Formatos y Formulación Básica</li>
                      <li>Ordenación y Filtro</li>
                      <li>Funciones de Texto, Fecha y Validaciones</li>
                      <li>Gráficos</li>
                      <li>Funciones Buscar</li>
                      <li>Tablas y Gráficos Dinámicos</li>
                    </ul>
                  </div>

                  {/* Excel Avanzado */}
                  <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200">
                    <h4 className="font-bold text-purple-900 text-sm mb-2 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-purple-600" />
                      Excel Avanzado
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-700 pl-4 list-disc">
                      <li>Dashboard Ejemplo 1</li>
                      <li>Dashboard Ejemplo 2</li>
                      <li>Dashboard Ejemplo 3</li>
                      <li>Dashboard Ejemplo 4</li>
                      <li>Dashboard Ejemplo 5</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#00324D] text-slate-300 py-6 mt-12 border-t border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#39A900] text-white flex items-center justify-center font-bold text-xs">S</span>
            <span className="font-semibold text-white">Servicio Nacional de Aprendizaje SENA</span>
          </div>
          <p>© 2026 Asistente de Evaluación Pedagógica • Formación Profesional Integral</p>
        </div>
      </footer>
    </div>
  );
}
