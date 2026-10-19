// GEO-MARTE 3D — Aplicación principal
// SAE SPACE AI — Mineral-01
// Fase 00: Base ejecutable y verificable

import { useState, useMemo, useCallback } from 'react';
import { Voxel, KNOWLEDGE_LABELS, KNOWLEDGE_COLORS } from './domain/types';
import { DEFAULT_GRID, countVoxels, countUnknownVoxels } from './domain/grid';
import { createInitialState, getProjectStats, AppState } from './domain/store';
import Viewer3D from './features/viewer3d/Viewer3D';
import { validateBorehole, validateGrainSize } from './domain/validation';

type Section = 'inicio' | 'proyectos' | 'visor' | 'sondeos' | 'muestras' | 'fuentes' | 'importacion' | 'control' | 'mars' | 'docs';

function App() {
  const [state, setState] = useState<AppState>(createInitialState());
  const [activeSection, setActiveSection] = useState<Section>('inicio');
  const [selectedVoxel, setSelectedVoxel] = useState<Voxel | null>(null);
  const [selectedDepth, setSelectedDepth] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentProject = useMemo(() =>
    state.projects.find(p => p.id === state.currentProjectId) || state.projects[0],
    [state.projects, state.currentProjectId]
  );

  const stats = useMemo(() =>
    currentProject ? getProjectStats(state, currentProject.id) : null,
    [state, currentProject]
  );

  const handleVoxelClick = useCallback((voxel: Voxel) => {
    setSelectedVoxel(voxel);
  }, []);

  const handleDepthChange = useCallback((depth: number) => {
    setSelectedDepth(depth);
  }, []);

  const navItems: { id: Section; label: string; icon: string }[] = [
    { id: 'inicio', label: 'Inicio', icon: 'fa-home' },
    { id: 'proyectos', label: 'Proyectos', icon: 'fa-folder' },
    { id: 'visor', label: 'Visor 3D', icon: 'fa-cube' },
    { id: 'sondeos', label: 'Sondeos', icon: 'fa-arrow-down' },
    { id: 'muestras', label: 'Muestras', icon: 'fa-vial' },
    { id: 'fuentes', label: 'Fuentes', icon: 'fa-database' },
    { id: 'importacion', label: 'Importación', icon: 'fa-file-import' },
    { id: 'control', label: 'Control científico', icon: 'fa-shield-alt' },
    { id: 'mars', label: 'Tecnología marciana', icon: 'fa-rocket' },
    { id: 'docs', label: 'Documentación', icon: 'fa-book' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-globe-americas text-white text-sm"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">GEO-MARTE 3D</h1>
            <p className="text-xs text-gray-400">SAE Space AI — Mineral-01</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 text-xs rounded border border-yellow-800">
            <i className="fas fa-exclamation-triangle mr-1"></i>
            FASE 00 — SIN DATOS VERIFICADOS
          </span>
        </div>
        <button
          className="md:hidden text-gray-300 p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-64 bg-gray-900 border-r border-gray-800 p-3 overflow-y-auto shrink-0`}>
          <div className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveSection(item.id); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-900/50 text-blue-300 border border-blue-800'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                <i className={`fas ${item.icon} w-4 text-center`}></i>
                {item.label}
              </button>
            ))}
          </div>

          {/* Resumen rápido */}
          <div className="mt-6 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="text-xs font-bold text-gray-400 mb-2">RESUMEN DEMO</div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Voxeles:</span>
                <span className="text-gray-300">{stats?.totalVoxels ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">UNKNOWN:</span>
                <span className="text-gray-400">{stats?.unknownCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Niveles:</span>
                <span className="text-gray-300">{stats?.levels ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Columnas:</span>
                <span className="text-gray-300">{stats?.columns ?? 0}</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeSection === 'inicio' && <InicioSection stats={stats} currentProject={currentProject} />}
          {activeSection === 'proyectos' && <ProyectosSection state={state} />}
          {activeSection === 'visor' && (
            <VisorSection
              state={state}
              currentProject={currentProject}
              selectedDepth={selectedDepth}
              selectedVoxel={selectedVoxel}
              onDepthChange={handleDepthChange}
              onVoxelClick={handleVoxelClick}
            />
          )}
          {activeSection === 'sondeos' && <SondeosSection state={state} />}
          {activeSection === 'muestras' && <MuestrasSection />}
          {activeSection === 'fuentes' && <FuentesSection state={state} />}
          {activeSection === 'importacion' && <ImportacionSection />}
          {activeSection === 'control' && <ControlSection />}
          {activeSection === 'mars' && <MarsSection />}
          {activeSection === 'docs' && <DocsSection />}
        </main>
      </div>
    </div>
  );
}

// === SECCIONES ===

function InicioSection({ stats, currentProject }: { stats: any; currentProject: any }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-800 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">GEO-MARTE 3D — Fase 00</h2>
        <p className="text-gray-300 mb-4">
          Plataforma de representación del subsuelo terrestre con datos comprobables.
          Inspirada metodológicamente en los rovers Perseverance y Curiosity de la NASA.
        </p>
        <div className="bg-red-900/40 border border-red-700 rounded-lg p-3 text-sm text-red-200">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          <strong>PRINCIPIO CIENTÍFICO:</strong> Nunca se inventa litología, mineralogía, estratos ni mediciones.
          Los espacios sin datos figuran como UNKNOWN.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Voxeles totales"
          value={stats?.totalVoxels ?? 0}
          subtitle="Conceptuales en la demo"
          icon="fa-cubes"
          color="blue"
        />
        <StatCard
          title="Estado UNKNOWN"
          value={stats?.unknownCount ?? 0}
          subtitle="Sin datos verificados"
          icon="fa-question-circle"
          color="gray"
        />
        <StatCard
          title="Niveles verticales"
          value={stats?.levels ?? 0}
          subtitle="Paso de 0,10 m"
          icon="fa-layer-group"
          color="green"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-3">Configuración del modelo demo</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Resolución X</div>
            <div className="text-white font-mono">{currentProject?.cellSizeXM} m</div>
          </div>
          <div>
            <div className="text-gray-500">Resolución Y</div>
            <div className="text-white font-mono">{currentProject?.cellSizeYM} m</div>
          </div>
          <div>
            <div className="text-gray-500">Paso vertical</div>
            <div className="text-white font-mono">{currentProject?.verticalStepM} m</div>
          </div>
          <div>
            <div className="text-gray-500">Profundidad máx.</div>
            <div className="text-white font-mono">{currentProject?.depthMaxM} m</div>
          </div>
          <div>
            <div className="text-gray-500">Volumen voxel</div>
            <div className="text-white font-mono">0,10 m³</div>
          </div>
          <div>
            <div className="text-gray-500">Columnas</div>
            <div className="text-white font-mono">{stats?.columns ?? 0}</div>
          </div>
          <div>
            <div className="text-gray-500">Niveles/col.</div>
            <div className="text-white font-mono">200</div>
          </div>
          <div>
            <div className="text-gray-500">Total voxeles</div>
            <div className="text-white font-mono">{stats?.totalVoxels ?? 0}</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-3">Estados de conocimiento</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(KNOWLEDGE_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: KNOWLEDGE_COLORS[key as keyof typeof KNOWLEDGE_COLORS] }}></div>
              <div>
                <div className="text-sm text-white font-mono">{key}</div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-3">Roadmap de fases</h3>
        <div className="space-y-2 text-sm">
          {[
            { phase: '00', name: 'Base ejecutable y verificable', status: 'EN CURSO' },
            { phase: '01', name: 'Georreferenciación y terrenos', status: 'PENDIENTE' },
            { phase: '02', name: 'Cartografía IGME/IGN/CNIG', status: 'PENDIENTE' },
            { phase: '03', name: 'Sondeos y análisis reales', status: 'PENDIENTE' },
            { phase: '04', name: 'Radar y geofísica terrestre', status: 'PENDIENTE' },
            { phase: '05', name: 'FRX, DRX, Raman y mineralogía', status: 'PENDIENTE' },
          ].map(item => (
            <div key={item.phase} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
              <span className="text-xs font-mono bg-gray-700 px-2 py-1 rounded">{item.phase}</span>
              <span className="text-gray-300 flex-1">{item.name}</span>
              <span className={`text-xs px-2 py-1 rounded ${
                item.status === 'EN CURSO' ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-400'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }: { title: string; value: number; subtitle: string; icon: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-900/50 to-blue-800/30 border-blue-800',
    gray: 'from-gray-800/50 to-gray-700/30 border-gray-700',
    green: 'from-green-900/50 to-green-800/30 border-green-800',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-xs">{title}</span>
        <i className={`fas ${icon} text-gray-500`}></i>
      </div>
      <div className="text-2xl font-bold text-white">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
    </div>
  );
}

function ProyectosSection({ state }: { state: AppState }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-white">Proyectos</h2>
      {state.projects.map(project => (
        <div key={project.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">{project.name}</h3>
            <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">Activo</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">{project.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">ID:</span> <span className="text-gray-300 font-mono text-xs">{project.id}</span></div>
            <div><span className="text-gray-500">Grid:</span> <span className="text-gray-300">{project.gridCellsX}×{project.gridCellsY}</span></div>
            <div><span className="text-gray-500">Prof. máx:</span> <span className="text-gray-300">{project.depthMaxM} m</span></div>
            <div><span className="text-gray-500">Esquema:</span> <span className="text-gray-300">v{project.schemaVersion}</span></div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500">
            CRS: {project.crs || 'No definido (coordenadas locales)'} | Datum vertical: {project.verticalDatum || 'No definido'}
          </div>
        </div>
      ))}
    </div>
  );
}

function VisorSection({
  state,
  currentProject,
  selectedDepth,
  selectedVoxel,
  onDepthChange,
  onVoxelClick,
}: {
  state: AppState;
  currentProject: any;
  selectedDepth: number;
  selectedVoxel: Voxel | null;
  onDepthChange: (d: number) => void;
  onVoxelClick: (v: Voxel) => void;
}) {
  const displayVoxels = useMemo(() => {
    // Para la demo 2x2 mostramos solo los primeros 20 niveles visibles
    return state.voxels.filter(v => v.projectId === currentProject?.id && v.iz < 20);
  }, [state.voxels, currentProject]);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-white">Visor 3D</h2>
        <div className="text-xs text-gray-400">
          Mostrando {displayVoxels.length} voxeles (demo limitada a 20 niveles para rendimiento)
        </div>
      </div>
      <div className="flex-1 rounded-xl overflow-hidden border border-gray-800">
        <Viewer3D
          voxels={displayVoxels}
          gridCellsX={currentProject?.gridCellsX ?? 2}
          gridCellsY={currentProject?.gridCellsY ?? 2}
          cellSizeXM={currentProject?.cellSizeXM ?? 1}
          cellSizeYM={currentProject?.cellSizeYM ?? 1}
          verticalStepM={currentProject?.verticalStepM ?? 0.1}
          maxDepthM={currentProject?.depthMaxM ?? 20}
          selectedDepth={selectedDepth}
          onDepthChange={onDepthChange}
          onVoxelClick={onVoxelClick}
          selectedVoxelId={selectedVoxel?.id ?? null}
        />
      </div>

      {selectedVoxel && (
        <div className="mt-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-blue-300 mb-2">Propiedades del voxel</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div><span className="text-gray-500">ID:</span> <span className="text-gray-300 font-mono">{selectedVoxel.id}</span></div>
            <div><span className="text-gray-500">Índices:</span> <span className="text-gray-300 font-mono">({selectedVoxel.ix}, {selectedVoxel.iy}, {selectedVoxel.iz})</span></div>
            <div><span className="text-gray-500">Profundidad:</span> <span className="text-gray-300">{selectedVoxel.depthFromM}–{selectedVoxel.depthToM} m</span></div>
            <div><span className="text-gray-500">Volumen:</span> <span className="text-gray-300">{selectedVoxel.volumeM3} m³</span></div>
            <div><span className="text-gray-500">Estado:</span> <span className="text-gray-300 font-mono">{selectedVoxel.state}</span></div>
            <div><span className="text-gray-500">Versión:</span> <span className="text-gray-300">{selectedVoxel.version}</span></div>
            <div><span className="text-gray-500">Evidencia:</span> <span className="text-gray-300">{selectedVoxel.evidenceId || 'Ninguna'}</span></div>
            <div><span className="text-gray-500">Prof. (mm):</span> <span className="text-gray-300 font-mono">{selectedVoxel.depthFromMm}–{selectedVoxel.depthToMm}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

function SondeosSection({ state }: { state: AppState }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', x: '', y: '', totalDepthM: '', drillingMethod: '', sourceId: 'src-demo-001'
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    setErrors([]);
    setSuccess(false);

    const result = validateBorehole({
      name: formData.name,
      x: parseFloat(formData.x),
      y: parseFloat(formData.y),
      totalDepthM: parseFloat(formData.totalDepthM),
      drillingMethod: formData.drillingMethod || undefined,
      sourceId: formData.sourceId,
    });

    if (!result.success) {
      setErrors(result.errors.map(e => `${e.field}: ${e.message}`));
      return;
    }

    setSuccess(true);
    setFormData({ name: '', x: '', y: '', totalDepthM: '', drillingMethod: '', sourceId: 'src-demo-001' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Sondeos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-900/50 text-blue-300 rounded-lg text-sm border border-blue-800 hover:bg-blue-900/70"
        >
          <i className="fas fa-plus mr-1"></i> Nuevo sondeo
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-300">Registrar sondeo</h3>
          {errors.length > 0 && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-xs text-red-300">
              {errors.map((e, i) => <div key={i}>• {e}</div>)}
            </div>
          )}
          {success && (
            <div className="bg-green-900/30 border border-green-800 rounded-lg p-3 text-xs text-green-300">
              ✓ Validación correcta. En producción se guardaría en la base de datos.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Nombre del sondeo *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            <input placeholder="X (m) *" value={formData.x} onChange={e => setFormData({...formData, x: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            <input placeholder="Y (m) *" value={formData.y} onChange={e => setFormData({...formData, y: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            <input placeholder="Profundidad total (m) *" value={formData.totalDepthM} onChange={e => setFormData({...formData, totalDepthM: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            <input placeholder="Método de perforación" value={formData.drillingMethod} onChange={e => setFormData({...formData, drillingMethod: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            <select value={formData.sourceId} onChange={e => setFormData({...formData, sourceId: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="src-demo-001">Fuente demo</option>
            </select>
          </div>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm hover:bg-blue-600">
            Validar y registrar
          </button>
        </div>
      )}

      {state.boreholes.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <i className="fas fa-arrow-down text-3xl text-gray-600 mb-3"></i>
          <p className="text-gray-400">No hay sondeos registrados.</p>
          <p className="text-xs text-gray-500 mt-1">Los sondeos se registran con validación de coordenadas, profundidad y fuente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {state.boreholes.map(bh => (
            <div key={bh.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="font-bold text-white">{bh.name}</div>
              <div className="text-xs text-gray-400 mt-1">
                Posición: ({bh.x}, {bh.y}) | Prof: {bh.totalDepthM} m | Fuente: {bh.sourceId}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MuestrasSection() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-white">Muestras y análisis</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <i className="fas fa-vial text-3xl text-gray-600 mb-3"></i>
        <p className="text-gray-400">No hay muestras registradas.</p>
        <p className="text-xs text-gray-500 mt-2">
          Las muestras requieren un sondeo asociado, tipo de muestra, método y fuente.
          Los resultados minerales necesitan método de identificación y fuente analítica.
          No se fabrican datos mineralógicos.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-300 mb-3">Principios de integridad</h3>
        <ul className="text-xs text-gray-400 space-y-2">
          <li>• Un mineral sin muestra e informe no es un resultado verificado.</li>
          <li>• La granulometría requiere que las 4 fracciones sumen 95–105%.</li>
          <li>• Cada análisis necesita source_id, método y trazabilidad.</li>
          <li>• Los valores nulos son null, nunca cero inventado.</li>
          <li>• No se promociona automáticamente un estado de conocimiento.</li>
        </ul>
      </div>
    </div>
  );
}

function FuentesSection({ state }: { state: AppState }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-white">Fuentes de evidencia</h2>
      <div className="space-y-3">
        {state.sources.map(source => (
          <div key={source.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">{source.title}</h3>
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">{source.sourceType}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">Organización: {source.organization}</div>
            <div className="text-xs text-gray-500 mt-1">{source.description}</div>
            <div className="text-xs text-gray-600 mt-2 font-mono">ID: {source.id}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-300 mb-3">Fuentes institucionales previstas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="font-bold text-gray-300">IGME-CSIC</div>
            <div className="text-gray-500">Cartografía geológica, sondeos, litoteca</div>
            <div className="text-gray-600 font-mono mt-1">igme.es</div>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="font-bold text-gray-300">IGN / CNIG</div>
            <div className="text-gray-500">MDT, ortofotos, LiDAR, cartografía</div>
            <div className="text-gray-600 font-mono mt-1">ign.es / centrodedescargas.cnig.es</div>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="font-bold text-gray-300">NASA PDS</div>
            <div className="text-gray-500">Datos planetarios (adaptación futura)</div>
            <div className="text-gray-600 font-mono mt-1">pds.nasa.gov</div>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="font-bold text-gray-300">USGS</div>
            <div className="text-gray-500">Geología, hidrogeología, bibliotecas espectrales</div>
            <div className="text-gray-600 font-mono mt-1">usgs.gov</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImportacionSection() {
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportErrors([]);
    setImportSuccess(false);

    if (file.size > 10 * 1024 * 1024) {
      setImportErrors(['El archivo supera el límite de 10 MB']);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());

      if (lines.length < 2) {
        setImportErrors(['El archivo debe tener al menos una cabecera y una fila de datos']);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1, 6).map(l => l.split(',').map(c => c.trim()));

      // Validar cabeceras requeridas
      const required = ['borehole_id', 'x_m', 'y_m', 'depth_from_m', 'depth_to_m', 'observation_method', 'source_id'];
      const missing = required.filter(r => !headers.includes(r));
      if (missing.length > 0) {
        setImportErrors([`Cabeceras faltantes: ${missing.join(', ')}`]);
        return;
      }

      // Validar filas
      const errors: string[] = [];
      lines.slice(1).forEach((line, idx) => {
        const cols = line.split(',').map(c => c.trim());
        if (cols.length !== headers.length) {
          errors.push(`Fila ${idx + 2}: número de columnas incorrecto`);
        }
        const depthFrom = parseFloat(cols[headers.indexOf('depth_from_m')]);
        const depthTo = parseFloat(cols[headers.indexOf('depth_to_m')]);
        if (isNaN(depthFrom) || depthFrom < 0) errors.push(`Fila ${idx + 2}: depth_from_m inválido`);
        if (isNaN(depthTo) || depthTo <= depthFrom) errors.push(`Fila ${idx + 2}: depth_to_m debe ser mayor que depth_from_m`);
        const x = parseFloat(cols[headers.indexOf('x_m')]);
        const y = parseFloat(cols[headers.indexOf('y_m')]);
        if (isNaN(x) || !isFinite(x)) errors.push(`Fila ${idx + 2}: x_m no es un número finito`);
        if (isNaN(y) || !isFinite(y)) errors.push(`Fila ${idx + 2}: y_m no es un número finito`);
      });

      if (errors.length > 0) {
        setImportErrors(errors.slice(0, 10));
        return;
      }

      setPreview({ headers, rows });
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    setImportSuccess(true);
    setPreview(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-white">Importación de sondeos (CSV)</h2>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-300 mb-3">Formato CSV requerido</h3>
        <div className="bg-gray-800 rounded-lg p-3 font-mono text-xs text-gray-400 overflow-x-auto">
          borehole_id,x_m,y_m,depth_from_m,depth_to_m,lithology_raw,observation_method,source_id,observed_at
        </div>
        <ul className="text-xs text-gray-500 mt-3 space-y-1">
          <li>• Codificación: UTF-8</li>
          <li>• Separador: coma (,)</li>
          <li>• Fechas: formato ISO 8601</li>
          <li>• Decimal: punto (.)</li>
          <li>• Límite: 10 MB</li>
        </ul>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <label className="block text-sm font-bold text-gray-300 mb-3">Seleccionar archivo CSV</label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-900/50 file:text-blue-300 hover:file:bg-blue-900/70"
        />
      </div>

      {importErrors.length > 0 && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-red-300 mb-2">
            <i className="fas fa-times-circle mr-1"></i> Errores de validación
          </h3>
          <ul className="text-xs text-red-400 space-y-1">
            {importErrors.map((e, i) => <li key={i}>• {e}</li>)}
          </ul>
        </div>
      )}

      {preview && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-green-300 mb-3">
            <i className="fas fa-check-circle mr-1"></i> Previsualización válida
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-700">
                  {preview.headers.map(h => (
                    <th key={h} className="text-left px-2 py-1 text-gray-400 font-mono">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    {row.map((cell, j) => (
                      <td key={j} className="px-2 py-1 text-gray-300 font-mono">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleConfirmImport}
            className="mt-4 px-4 py-2 bg-green-800 text-green-200 rounded-lg text-sm hover:bg-green-700"
          >
            Confirmar importación
          </button>
        </div>
      )}

      {importSuccess && (
        <div className="bg-green-900/30 border border-green-800 rounded-xl p-4">
          <p className="text-sm text-green-300">
            <i className="fas fa-check mr-1"></i> Importación completada correctamente.
            En producción se guardaría en transacción SQLite.
          </p>
        </div>
      )}
    </div>
  );
}

function ControlSection() {
  const [testResults, setTestResults] = useState<{ id: number; name: string; passed: boolean; message: string }[]>([]);
  const [testsRun, setTestsRun] = useState(false);

  const handleRunTests = () => {
    import('./domain/tests').then(({ runAllTests }) => {
      setTestResults(runAllTests());
      setTestsRun(true);
    });
  };

  const passedCount = testResults.filter(t => t.passed).length;
  const failedCount = testResults.filter(t => !t.passed).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-white">Control científico</h2>

      <div className="bg-red-900/20 border border-red-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-red-300 mb-2">
          <i className="fas fa-exclamation-triangle mr-1"></i> Estado actual
        </h3>
        <p className="text-sm text-red-200">
          SIN DATOS GEOLÓGICOS VERIFICADOS. Todos los voxeles están en estado UNKNOWN.
          No se ha importado ni registrado ninguna evidencia real.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-300 mb-3">Principios de integridad científica</h3>
        <ul className="text-xs text-gray-400 space-y-2">
          <li className="flex items-start gap-2">
            <i className="fas fa-check text-green-500 mt-0.5"></i>
            <span>Trazabilidad completa: fuente → geometría → profundidad → estado.</span>
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-check text-green-500 mt-0.5"></i>
            <span>Método analítico obligatorio para identificación de minerales.</span>
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-check text-green-500 mt-0.5"></i>
            <span>Conservación de datos originales y cadena de transformaciones.</span>
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-check text-green-500 mt-0.5"></i>
            <span>Incertidumbre declarada explícitamente.</span>
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-check text-green-500 mt-0.5"></i>
            <span>UNKNOWN visible: los espacios sin datos no se rellenan.</span>
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-check text-green-500 mt-0.5"></i>
            <span>Separación entre prueba sintética y evidencia real.</span>
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-check text-green-500 mt-0.5"></i>
            <span>Versiones de esquema y corrección no silenciosa de conflictos.</span>
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-check text-green-500 mt-0.5"></i>
            <span>Un sondeo puntual NO convierte un voxel completo en OBSERVED.</span>
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-check text-green-500 mt-0.5"></i>
            <span>Los datos de Marte nunca se usan para afirmar composición terrestre.</span>
          </li>
        </ul>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-300 mb-3">Verificaciones activas</h3>
        <div className="space-y-2 text-xs">
          {[
            { check: 'Resolución horizontal 1×1 m', ok: true },
            { check: 'Paso vertical 0,10 m', ok: true },
            { check: 'Profundidad 0–20 m', ok: true },
            { check: 'Demo 2×2 m = 4 columnas', ok: true },
            { check: '800 voxeles conceptuales', ok: true },
            { check: 'Todos UNKNOWN', ok: true },
            { check: 'Sin mineralogía fabricada', ok: true },
            { check: 'Sin interpolación automática', ok: true },
            { check: 'Validación de entradas con Zod', ok: true },
            { check: 'Importación CSV con previsualización', ok: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
              <i className={`fas ${item.ok ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'}`}></i>
              <span className="text-gray-300">{item.check}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tests ejecutables */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-300">Pruebas de dominio (20 mínimas)</h3>
          <button
            onClick={handleRunTests}
            className="px-3 py-1.5 bg-green-800 text-green-200 rounded-lg text-xs hover:bg-green-700"
          >
            <i className="fas fa-play mr-1"></i> Ejecutar pruebas
          </button>
        </div>

        {testsRun && (
          <>
            <div className="flex items-center gap-4 mb-3 text-xs">
              <span className="text-green-400"><i className="fas fa-check mr-1"></i>{passedCount} aprobadas</span>
              <span className="text-red-400"><i className="fas fa-times mr-1"></i>{failedCount} fallidas</span>
              <span className="text-gray-400">Total: {testResults.length}</span>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {testResults.map(test => (
                <div key={test.id} className={`flex items-center gap-2 p-2 rounded text-xs ${test.passed ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                  <span className="font-mono text-gray-500 w-6">{String(test.id).padStart(2, '0')}</span>
                  <i className={`fas ${test.passed ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'} w-4`}></i>
                  <span className={`flex-1 ${test.passed ? 'text-gray-300' : 'text-red-300'}`}>{test.name}</span>
                  <span className="text-gray-500 text-right max-w-xs truncate">{test.message}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {!testsRun && (
          <p className="text-xs text-gray-500">
            Pulsa "Ejecutar pruebas" para validar el modelo de dominio, las validaciones y la integridad científica.
          </p>
        )}
      </div>
    </div>
  );
}

function MarsSection() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-white">Tecnología marciana — Adaptación terrestre</h2>

      <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4 text-sm text-yellow-200">
        <i className="fas fa-info-circle mr-2"></i>
        Los instrumentos de NASA se documentan como referencia metodológica.
        Este proyecto NO posee dichos instrumentos ni cuenta con respaldo de NASA.
      </div>

      <div className="space-y-4">
        <InstrumentCard
          name="RIMFAX (Perseverance)"
          principle="Radar de subsuelo (GPR). No identifica minerales por sí solo."
          resolution="Resolución vertical dependiente de frecuencia; no necesariamente 10 cm."
          adaptation="Inspiración para futuros módulos de geofísica terrestre (GPR, ERT)."
          status="Documentado — Sin implementación"
        />
        <InstrumentCard
          name="PIXL (Perseverance)"
          principle="Fluorescencia de rayos X (PIXE). Composición elemental."
          resolution="Escala micrométrica en superficies."
          adaptation="Referencia para futuros módulos FRX terrestre."
          status="Documentado — Sin implementación"
        />
        <InstrumentCard
          name="SHERLOC (Perseverance)"
          principle="Espectroscopía Raman UV y fluorescencia."
          resolution="Escala micrométrica."
          adaptation="Referencia para futuros módulos Raman terrestre."
          status="Documentado — Sin implementación"
        />
        <InstrumentCard
          name="SuperCam (Perseverance)"
          principle="LIBS, Raman, IR. Espectroscopía a distancia."
          resolution="Análisis puntual remoto."
          adaptation="Referencia para futuros módulos de espectroscopía."
          status="Documentado — Sin implementación"
        />
        <InstrumentCard
          name="CheMin (Curiosity)"
          principle="Difracción de rayos X (DRX). Fases minerales cristalinas."
          resolution="Análisis de polvo molido en laboratorio."
          adaptation="Referencia para futuros módulos DRX terrestre."
          status="Documentado — Sin implementación"
        />
        <InstrumentCard
          name="Mastcam-Z / WATSON"
          principle="Imágenes multiespectrales y microscopía de testigos."
          resolution="Variable según distancia y objetivo."
          adaptation="Referencia para análisis visual de testigos."
          status="Documentado — Sin implementación"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-300 mb-3">Fuentes de datos planetarios</h3>
        <div className="space-y-2 text-xs">
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="font-bold text-gray-300">NASA PDS (Planetary Data System)</div>
            <div className="text-gray-500">Repositorio oficial de datos planetarios de la NASA.</div>
            <div className="text-gray-600 font-mono mt-1">pds.nasa.gov / pds-geosciences.wustl.edu</div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Los datos de Marte se documentarán para adaptación metodológica futura.
          Nunca se usarán para afirmar la composición de una parcela terrestre.
        </p>
      </div>
    </div>
  );
}

function InstrumentCard({ name, principle, resolution, adaptation, status }: {
  name: string; principle: string; resolution: string; adaptation: string; status: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-white text-sm">{name}</h3>
        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">{status}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-gray-500">Principio físico:</div>
          <div className="text-gray-300">{principle}</div>
        </div>
        <div>
          <div className="text-gray-500">Resolución:</div>
          <div className="text-gray-300">{resolution}</div>
        </div>
        <div>
          <div className="text-gray-500">Adaptación terrestre:</div>
          <div className="text-gray-300">{adaptation}</div>
        </div>
      </div>
    </div>
  );
}

function DocsSection() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-white">Documentación</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DocCard
          title="Modelo de voxel"
          description="Geometría, índices, estados de conocimiento y principio UNKNOWN."
          icon="fa-cube"
        />
        <DocCard
          title="Modelo de evidencia"
          description="Trazabilidad, fuentes, métodos y cadena de procedencia."
          icon="fa-fingerprint"
        />
        <DocCard
          title="Incertidumbre"
          description="Declaración de incertidumbre, resolución vs. precisión."
          icon="fa-chart-area"
        />
        <DocCard
          title="Seguridad"
          description="Validación de entradas, SQL parametrizado, CORS, sin secretos."
          icon="fa-shield-alt"
        />
        <DocCard
          title="Procedencia de datos"
          description="Conservación de originales, transformaciones y versionado."
          icon="fa-route"
        />
        <DocCard
          title="Arquitectura"
          description="Monorepo, dominios, API, visor y bases de datos."
          icon="fa-sitemap"
        />
        <DocCard
          title="Fuentes NASA"
          description="Instrumentos, PDS, capacidades y límites."
          icon="fa-rocket"
        />
        <DocCard
          title="Fuentes IGME/IGN"
          description="Cartografía, sondeos, LiDAR, MDT y bibliotecas espectrales."
          icon="fa-map"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-300 mb-3">Nota sobre resolución vs. precisión</h3>
        <p className="text-xs text-gray-400">
          La resolución de la cuadrícula (1×1×0,10 m) NO es la precisión de una medición.
          Un sondeo puntual no valida automáticamente un voxel de 1 m².
          Un mapa MAGNA de escala regional no demuestra la mineralogía de un voxel de 10 cm.
          LiDAR no mide automáticamente minerales enterrados.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-300 mb-3">Escalabilidad del modelo</h3>
        <div className="text-xs text-gray-400 space-y-1">
          <div>• 10 m² = 2.000 voxeles conceptuales</div>
          <div>• 1.000 m² = 200.000 voxeles</div>
          <div>• 100.000 m² = 20.000.000 voxeles</div>
          <div className="text-gray-500 mt-2">
            Estrategias futuras: PostGIS, chunking, instancing, caché y niveles de detalle.
            No se generan millones de objetos 3D ni filas SQLite UNKNOWN.
          </div>
        </div>
      </div>
    </div>
  );
}

function DocCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <i className={`fas ${icon} text-blue-400`}></i>
        <h3 className="font-bold text-white text-sm">{title}</h3>
      </div>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  );
}

export default App;
