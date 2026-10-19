// GEO-MARTE 3D — Columna Estratigráfica Científica
// SAE SPACE AI — Mineral-01
//
// REGLA ABSOLUTA: una columna estratigráfica introducida manualmente
// NO demuestra la composición mineralógica real de todo el volumen investigado.
// Los espacios sin información siguen siendo UNKNOWN.
// Una observación puntual NO se proyecta automáticamente a voxeles adyacentes.

import { useState, useEffect, useMemo } from 'react';
import {
  ensureSchemaV2,
  insertStratColumn,
  getAllStratColumns,
  getStratColumnById,
  deleteStratColumn,
  insertStratInterval,
  getStratIntervalsByColumn,
  deleteStratInterval,
  validateColumn,
  validateInterval,
  validateColumnIntervals,
  exportColumnToJSON,
  exportColumnToCSV,
  parseColumnCSV,
  parseColumnJSON,
  StratigraphicColumn,
  StratigraphicInterval,
  IntervalValidationReport,
} from '../../database/stratigraphy';

// Catálogo de litologías (solo descriptivas, NO mineralogía)
const LITHOLOGIES = [
  { name: 'Arcilla', color: '#8B7355', pattern: 'solid' },
  { name: 'Limo', color: '#C4A57B', pattern: 'dots' },
  { name: 'Arena fina', color: '#E8D4A0', pattern: 'fine-dots' },
  { name: 'Arena media', color: '#D4B87A', pattern: 'medium-dots' },
  { name: 'Arena gruesa', color: '#B89968', pattern: 'coarse-dots' },
  { name: 'Grava', color: '#9E9E9E', pattern: 'gravel' },
  { name: 'Roca', color: '#6B6B6B', pattern: 'solid' },
  { name: 'Sin datos', color: '#6b7280', pattern: 'unknown' },
];

// Datos DEMOSTRACIÓN SINTÉTICA — NO representan estratigrafía real
const SYNTHETIC_DEMO_COLUMN: Omit<StratigraphicColumn, 'id' | 'createdAt' | 'updatedAt'> = {
  projectId: 'demo-001',
  name: 'SONDEO DEMO SINTÉTICO — NO REAL',
  x: 0,
  y: 0,
  totalDepthM: 20,
  sourceId: 'src-demo-001',
  isSynthetic: true,
  syntheticNotice: 'DATOS SINTÉTICOS DE DEMOSTRACIÓN. No representan estratigrafía real. No usar para análisis científico.',
  notes: 'Columna generada automáticamente para demostrar la herramienta. Todos los intervalos son ficticios.',
};

const SYNTHETIC_DEMO_INTERVALS: Omit<StratigraphicInterval, 'id' | 'columnId' | 'createdAt'>[] = [
  { depthFromM: 0, depthToM: 2, lithologyRaw: 'Arena media (SINTÉTICA)', observationMethod: 'demo', sourceId: 'src-demo-001', qualityStatus: 'valid', notes: 'FICTICIO' },
  { depthFromM: 2, depthToM: 5, lithologyRaw: 'Limo (SINTÉTICO)', observationMethod: 'demo', sourceId: 'src-demo-001', qualityStatus: 'valid', notes: 'FICTICIO' },
  { depthFromM: 5, depthToM: 8, lithologyRaw: 'Arcilla (SINTÉTICA)', observationMethod: 'demo', sourceId: 'src-demo-001', qualityStatus: 'valid', notes: 'FICTICIO' },
  { depthFromM: 8, depthToM: 12, lithologyRaw: 'Arena gruesa (SINTÉTICA)', observationMethod: 'demo', sourceId: 'src-demo-001', qualityStatus: 'valid', notes: 'FICTICIO' },
  { depthFromM: 12, depthToM: 15, lithologyRaw: 'Grava (SINTÉTICA)', observationMethod: 'demo', sourceId: 'src-demo-001', qualityStatus: 'valid', notes: 'FICTICIO' },
  { depthFromM: 15, depthToM: 20, lithologyRaw: 'Roca (SINTÉTICA)', observationMethod: 'demo', sourceId: 'src-demo-001', qualityStatus: 'valid', notes: 'FICTICIO' },
];

export default function StratigraphicColumnTool() {
  const [dbReady, setDbReady] = useState(false);
  const [columns, setColumns] = useState<StratigraphicColumn[]>([]);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [intervals, setIntervals] = useState<StratigraphicInterval[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('csv');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importPreview, setImportPreview] = useState<{ column: any; intervals: any[] } | null>(null);
  const [newColumn, setNewColumn] = useState({
    name: '',
    x: '',
    y: '',
    totalDepthM: '20',
    sourceId: 'src-demo-001',
    isSynthetic: true,
  });
  const [newInterval, setNewInterval] = useState({
    depthFrom: '',
    depthTo: '',
    lithology: 'Arena media',
    observationMethod: 'visual',
    notes: '',
  });
  const [showIntervalForm, setShowIntervalForm] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Inicializar BD y cargar datos
  useEffect(() => {
    (async () => {
      await ensureSchemaV2();
      setDbReady(true);
      const loaded = getAllStratColumns();
      setColumns(loaded);

      // Si no hay columnas, crear la demo sintética
      if (loaded.length === 0) {
        const demoId = `col-demo-${Date.now()}`;
        const now = new Date().toISOString();
        const demoCol: StratigraphicColumn = {
          ...SYNTHETIC_DEMO_COLUMN,
          id: demoId,
          createdAt: now,
          updatedAt: now,
        };
        if (insertStratColumn(demoCol)) {
          for (const sint of SYNTHETIC_DEMO_INTERVALS) {
            insertStratInterval({
              ...sint,
              id: `int-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              columnId: demoId,
              createdAt: now,
            });
          }
          setColumns([demoCol]);
          setSelectedColumnId(demoId);
        }
      } else {
        setSelectedColumnId(loaded[0].id);
      }
    })();
  }, []);

  // Cargar intervalos al cambiar de columna
  useEffect(() => {
    if (selectedColumnId && dbReady) {
      setIntervals(getStratIntervalsByColumn(selectedColumnId));
    } else {
      setIntervals([]);
    }
  }, [selectedColumnId, dbReady]);

  const selectedColumn = useMemo(
    () => columns.find(c => c.id === selectedColumnId) || null,
    [columns, selectedColumnId]
  );

  // Validación de integridad de intervalos
  const validationReport: IntervalValidationReport | null = useMemo(() => {
    if (!selectedColumn || intervals.length === 0) return null;
    return validateColumnIntervals(intervals, selectedColumn.totalDepthM);
  }, [intervals, selectedColumn]);

  // Vinculación con el visor 3D: mapeo a niveles de 10 cm
  const voxelMapping = useMemo(() => {
    if (!selectedColumn) return { mapped: 0, total: 200, unmapped: 200 };
    const totalLevels = Math.round(selectedColumn.totalDepthM / 0.1);
    const mappedLevels = new Set<number>();

    for (const interval of intervals) {
      const izFrom = Math.floor(interval.depthFromM / 0.1);
      const izTo = Math.ceil(interval.depthToM / 0.1);
      for (let iz = izFrom; iz < izTo; iz++) {
        mappedLevels.add(iz);
      }
    }

    return {
      mapped: mappedLevels.size,
      total: totalLevels,
      unmapped: totalLevels - mappedLevels.size,
    };
  }, [intervals, selectedColumn]);

  // === Handlers ===

  const handleCreateColumn = () => {
    setFormErrors([]);
    const errors = validateColumn({
      projectId: 'demo-001',
      name: newColumn.name,
      x: parseFloat(newColumn.x),
      y: parseFloat(newColumn.y),
      totalDepthM: parseFloat(newColumn.totalDepthM),
      sourceId: newColumn.sourceId,
    });

    if (errors.length > 0) {
      setFormErrors(errors.map(e => `${e.field}: ${e.message}`));
      return;
    }

    const id = `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const col: StratigraphicColumn = {
      id,
      projectId: 'demo-001',
      name: newColumn.name,
      x: parseFloat(newColumn.x),
      y: parseFloat(newColumn.y),
      totalDepthM: parseFloat(newColumn.totalDepthM),
      sourceId: newColumn.sourceId,
      isSynthetic: newColumn.isSynthetic,
      syntheticNotice: newColumn.isSynthetic
        ? 'DATOS SINTÉTICOS — No representan estratigrafía real'
        : undefined,
      createdAt: now,
      updatedAt: now,
    };

    if (insertStratColumn(col)) {
      setColumns([col, ...columns]);
      setSelectedColumnId(id);
      setShowNewForm(false);
      setNewColumn({ name: '', x: '', y: '', totalDepthM: '20', sourceId: 'src-demo-001', isSynthetic: true });
    }
  };

  const handleAddInterval = () => {
    if (!selectedColumn) return;
    setFormErrors([]);

    const errors = validateInterval({
      columnId: selectedColumn.id,
      depthFromM: parseFloat(newInterval.depthFrom),
      depthToM: parseFloat(newInterval.depthTo),
      observationMethod: newInterval.observationMethod,
      sourceId: selectedColumn.sourceId,
    });

    if (errors.length > 0) {
      setFormErrors(errors.map(e => `${e.field}: ${e.message}`));
      return;
    }

    const from = parseFloat(newInterval.depthFrom);
    const to = parseFloat(newInterval.depthTo);

    if (to > selectedColumn.totalDepthM) {
      setFormErrors([`Profundidad hasta (${to}m) excede profundidad total (${selectedColumn.totalDepthM}m)`]);
      return;
    }

    const lith = LITHOLOGIES.find(l => l.name === newInterval.lithology);
    const id = `int-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const interval: StratigraphicInterval = {
      id,
      columnId: selectedColumn.id,
      depthFromM: from,
      depthToM: to,
      lithologyRaw: newInterval.lithology,
      colorHex: lith?.color,
      observationMethod: newInterval.observationMethod,
      sourceId: selectedColumn.sourceId,
      qualityStatus: 'valid',
      notes: newInterval.notes || undefined,
      createdAt: new Date().toISOString(),
    };

    if (insertStratInterval(interval)) {
      setIntervals([...intervals, interval].sort((a, b) => a.depthFromM - b.depthFromM));
      setShowIntervalForm(false);
      setNewInterval({ depthFrom: '', depthTo: '', lithology: 'Arena media', observationMethod: 'visual', notes: '' });
    }
  };

  const handleDeleteColumn = (id: string) => {
    if (!confirm('¿Eliminar columna y todos sus intervalos? Esta acción no se puede deshacer.')) return;
    if (deleteStratColumn(id)) {
      const remaining = columns.filter(c => c.id !== id);
      setColumns(remaining);
      setSelectedColumnId(remaining[0]?.id || null);
    }
  };

  const handleDeleteInterval = (id: string) => {
    if (deleteStratInterval(id)) {
      setIntervals(intervals.filter(i => i.id !== id));
    }
  };

  const handleImport = () => {
    setImportErrors([]);
    setImportPreview(null);

    if (!importText.trim()) {
      setImportErrors(['Contenido vacío']);
      return;
    }

    const parsed = importFormat === 'csv'
      ? parseColumnCSV(importText)
      : parseColumnJSON(importText);

    if (parsed.errors.length > 0) {
      setImportErrors(parsed.errors);
      return;
    }

    setImportPreview({ column: parsed.column, intervals: parsed.intervals });
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;

    const id = importPreview.column.id || `col-${Date.now()}`;
    const now = new Date().toISOString();
    const col: StratigraphicColumn = {
      id,
      projectId: 'demo-001',
      name: importPreview.column.name || id,
      x: importPreview.column.x ?? 0,
      y: importPreview.column.y ?? 0,
      totalDepthM: importPreview.column.totalDepthM ?? 20,
      sourceId: importPreview.column.sourceId || 'src-demo-001',
      isSynthetic: importPreview.column.isSynthetic ?? false,
      syntheticNotice: importPreview.column.isSynthetic
        ? 'Importado — verificar procedencia'
        : undefined,
      createdAt: now,
      updatedAt: now,
    };

    if (insertStratColumn(col)) {
      for (const i of importPreview.intervals) {
        insertStratInterval({
          id: `int-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          columnId: id,
          depthFromM: i.depthFromM!,
          depthToM: i.depthToM!,
          lithologyRaw: i.lithologyRaw,
          observationMethod: i.observationMethod || 'desconocido',
          sourceId: i.sourceId || col.sourceId,
          qualityStatus: 'valid',
          createdAt: now,
        });
      }
      setColumns([col, ...columns]);
      setSelectedColumnId(id);
      setShowImport(false);
      setImportText('');
      setImportPreview(null);
    }
  };

  const handleExportJSON = () => {
    if (!selectedColumn) return;
    const json = exportColumnToJSON(selectedColumn, intervals);
    downloadFile(json, `columna-${selectedColumn.id}.json`, 'application/json');
  };

  const handleExportCSV = () => {
    if (!selectedColumn) return;
    const csv = exportColumnToCSV(selectedColumn, intervals);
    downloadFile(csv, `columna-${selectedColumn.id}.csv`, 'text/csv');
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPatternStyle = (color: string, pattern?: string) => {
    switch (pattern) {
      case 'dots':
        return { backgroundColor: color, backgroundImage: 'radial-gradient(circle, #00000020 1px, transparent 1px)', backgroundSize: '8px 8px' };
      case 'fine-dots':
        return { backgroundColor: color, backgroundImage: 'radial-gradient(circle, #00000015 0.5px, transparent 0.5px)', backgroundSize: '4px 4px' };
      case 'medium-dots':
        return { backgroundColor: color, backgroundImage: 'radial-gradient(circle, #00000020 1px, transparent 1px)', backgroundSize: '6px 6px' };
      case 'coarse-dots':
        return { backgroundColor: color, backgroundImage: 'radial-gradient(circle, #00000030 1.5px, transparent 1.5px)', backgroundSize: '10px 10px' };
      case 'gravel':
        return { backgroundColor: color, backgroundImage: 'radial-gradient(ellipse, #00000040 2px, transparent 2px)', backgroundSize: '12px 12px' };
      case 'unknown':
        return { backgroundColor: color, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, #00000010 5px, #00000010 10px)' };
      default:
        return { backgroundColor: color };
    }
  };

  if (!dbReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Inicializando base de datos...</div>
      </div>
    );
  }

  const scale = 15; // px por metro
  const maxDepth = selectedColumn?.totalDepthM ?? 20;

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Aviso científico principal */}
      <div className="bg-red-900/30 border border-red-700 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <i className="fas fa-exclamation-triangle text-red-400 text-xl mt-0.5"></i>
          <div>
            <h3 className="text-sm font-bold text-red-200">REGLA CIENTÍFICA ABSOLUTA</h3>
            <p className="text-xs text-red-300 mt-1">
              Una columna estratigráfica introducida manualmente <strong>NO demuestra la composición mineralógica real</strong> de todo el volumen investigado.
              Los espacios sin información permanecen en estado <strong>UNKNOWN</strong>.
              Una observación puntual <strong>NO se proyecta automáticamente</strong> a voxeles adyacentes.
            </p>
          </div>
        </div>
      </div>

      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Columna Estratigráfica Científica</h2>
          <p className="text-sm text-gray-400 mt-1">Persistencia SQLite · Validación de intervalos · Vinculación con visor 3D</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(!showImport)}
            className="px-3 py-2 bg-purple-900/50 text-purple-300 rounded-lg text-sm border border-purple-800 hover:bg-purple-900/70"
          >
            <i className="fas fa-file-import mr-1"></i> Importar
          </button>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="px-3 py-2 bg-blue-900/50 text-blue-300 rounded-lg text-sm border border-blue-800 hover:bg-blue-900/70"
          >
            <i className="fas fa-plus mr-1"></i> Nueva columna
          </button>
        </div>
      </div>

      {/* Selector de columnas */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-300">Columnas registradas ({columns.length})</h3>
          {selectedColumn?.isSynthetic && (
            <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 text-xs rounded border border-yellow-800 font-bold">
              <i className="fas fa-flask mr-1"></i>
              DATOS SINTÉTICOS — NO REALES
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {columns.map(col => (
            <button
              key={col.id}
              onClick={() => setSelectedColumnId(col.id)}
              className={`px-3 py-2 rounded-lg text-xs border transition-colors ${
                selectedColumnId === col.id
                  ? 'bg-blue-900/50 border-blue-700 text-blue-200'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {col.isSynthetic && <i className="fas fa-flask text-yellow-500" title="Sintético"></i>}
                <span>{col.name}</span>
                <span className="text-gray-500">({col.totalDepthM}m)</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Formulario nueva columna */}
      {showNewForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-300">Nueva columna estratigráfica</h3>
          {formErrors.length > 0 && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-xs text-red-300">
              {formErrors.map((e, i) => <div key={i}>• {e}</div>)}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              placeholder="Nombre del sondeo/columna *"
              value={newColumn.name}
              onChange={e => setNewColumn({ ...newColumn, name: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <input
              placeholder="X (m) *"
              value={newColumn.x}
              onChange={e => setNewColumn({ ...newColumn, x: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <input
              placeholder="Y (m) *"
              value={newColumn.y}
              onChange={e => setNewColumn({ ...newColumn, y: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <input
              placeholder="Profundidad total (m) *"
              value={newColumn.totalDepthM}
              onChange={e => setNewColumn({ ...newColumn, totalDepthM: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={newColumn.isSynthetic}
              onChange={e => setNewColumn({ ...newColumn, isSynthetic: e.target.checked })}
              className="rounded"
            />
            Marcar como datos sintéticos de demostración
          </label>
          <div className="flex gap-2">
            <button onClick={handleCreateColumn} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-600">
              Crear columna
            </button>
            <button onClick={() => { setShowNewForm(false); setFormErrors([]); }} className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Importación */}
      {showImport && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-300">Importar columna (CSV / JSON)</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setImportFormat('csv')}
              className={`px-3 py-1 rounded text-xs ${importFormat === 'csv' ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
              CSV
            </button>
            <button
              onClick={() => setImportFormat('json')}
              className={`px-3 py-1 rounded text-xs ${importFormat === 'json' ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
              JSON
            </button>
          </div>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder={importFormat === 'csv'
              ? 'column_id,column_name,x_m,y_m,total_depth_m,source_id,is_synthetic,depth_from_m,depth_to_m,lithology_raw,observation_method\n...'
              : '{"column": {...}, "intervals": [...]}'}
            className="w-full h-40 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
          />
          {importErrors.length > 0 && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-xs text-red-300">
              {importErrors.map((e, i) => <div key={i}>• {e}</div>)}
            </div>
          )}
          {importPreview && (
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 text-xs text-green-300">
              <div className="font-bold mb-1">Previsualización válida</div>
              <div>Columna: {importPreview.column.name || importPreview.column.id}</div>
              <div>Intervalos: {importPreview.intervals.length}</div>
              <button onClick={handleConfirmImport} className="mt-2 px-3 py-1 bg-green-700 text-white rounded text-xs">
                Confirmar importación
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={handleImport} className="px-4 py-2 bg-purple-700 text-white rounded-lg text-sm">
              Validar
            </button>
            <button onClick={() => { setShowImport(false); setImportText(''); setImportErrors([]); setImportPreview(null); }} className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Contenido de la columna seleccionada */}
      {selectedColumn && (
        <>
          {/* Aviso sintético */}
          {selectedColumn.isSynthetic && (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-3">
              <div className="flex items-center gap-2 text-sm text-yellow-200">
                <i className="fas fa-flask text-yellow-400"></i>
                <strong>DEMOSTRACIÓN SINTÉTICA:</strong>
                <span>{selectedColumn.syntheticNotice || 'Los datos de esta columna son ficticios y no representan estratigrafía real.'}</span>
              </div>
            </div>
          )}

          {/* Metadatos de la columna */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">{selectedColumn.name}</h3>
              <div className="flex gap-2">
                <button onClick={handleExportJSON} className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs hover:bg-gray-700">
                  <i className="fas fa-download mr-1"></i> JSON
                </button>
                <button onClick={handleExportCSV} className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs hover:bg-gray-700">
                  <i className="fas fa-download mr-1"></i> CSV
                </button>
                <button onClick={() => handleDeleteColumn(selectedColumn.id)} className="px-2 py-1 bg-red-900/50 text-red-300 rounded text-xs hover:bg-red-900/70">
                  <i className="fas fa-trash mr-1"></i> Eliminar
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div><span className="text-gray-500">ID:</span> <span className="text-gray-300 font-mono">{selectedColumn.id}</span></div>
              <div><span className="text-gray-500">Proyecto:</span> <span className="text-gray-300 font-mono">{selectedColumn.projectId}</span></div>
              <div><span className="text-gray-500">Coordenadas:</span> <span className="text-gray-300 font-mono">({selectedColumn.x}, {selectedColumn.y})</span></div>
              <div><span className="text-gray-500">Profundidad total:</span> <span className="text-gray-300">{selectedColumn.totalDepthM} m</span></div>
              <div><span className="text-gray-500">Fuente:</span> <span className="text-gray-300 font-mono">{selectedColumn.sourceId}</span></div>
              <div><span className="text-gray-500">Sondeo asociado:</span> <span className="text-gray-300 font-mono">{selectedColumn.boreholeId || 'Ninguno'}</span></div>
              <div><span className="text-gray-500">Tipo:</span> <span className={`font-mono ${selectedColumn.isSynthetic ? 'text-yellow-400' : 'text-green-400'}`}>{selectedColumn.isSynthetic ? 'SINTÉTICO' : 'REAL'}</span></div>
              <div><span className="text-gray-500">Intervalos:</span> <span className="text-gray-300">{intervals.length}</span></div>
            </div>
          </div>

          {/* Reporte de validación */}
          {validationReport && (
            <div className={`border rounded-xl p-4 ${validationReport.valid ? 'bg-green-900/20 border-green-800' : 'bg-yellow-900/20 border-yellow-800'}`}>
              <h3 className="text-sm font-bold mb-2">
                <i className={`fas ${validationReport.valid ? 'fa-check-circle text-green-400' : 'fa-exclamation-circle text-yellow-400'} mr-2`}></i>
                Reporte de integridad
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div><span className="text-gray-500">Intervalos:</span> <span className="text-white">{intervals.length}</span></div>
                <div><span className="text-gray-500">Solapamientos:</span> <span className={validationReport.overlaps.length > 0 ? 'text-red-400' : 'text-green-400'}>{validationReport.overlaps.length}</span></div>
                <div><span className="text-gray-500">Espacios UNKNOWN:</span> <span className={validationReport.gaps.length > 0 ? 'text-yellow-400' : 'text-green-400'}>{validationReport.gaps.length}</span></div>
                <div><span className="text-gray-500">Fuera de límites:</span> <span className={validationReport.outOfBounds.length > 0 ? 'text-red-400' : 'text-green-400'}>{validationReport.outOfBounds.length}</span></div>
              </div>
              {validationReport.warnings.length > 0 && (
                <div className="mt-2 text-xs text-yellow-300">
                  {validationReport.warnings.map((w, i) => <div key={i}>• {w}</div>)}
                </div>
              )}
              {validationReport.gaps.length > 0 && (
                <div className="mt-2 text-xs text-gray-400">
                  Tramos UNKNOWN: {validationReport.gaps.map(g => `${g.from.toFixed(1)}–${g.to.toFixed(1)}m`).join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Vinculación con visor 3D */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-300 mb-2">
              <i className="fas fa-link mr-2"></i>
              Vinculación con visor 3D (resolución 10 cm)
            </h3>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-gray-500">Niveles totales (10 cm)</div>
                <div className="text-xl font-bold text-white">{voxelMapping.total}</div>
              </div>
              <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-800">
                <div className="text-blue-400">Niveles con observación</div>
                <div className="text-xl font-bold text-blue-300">{voxelMapping.mapped}</div>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-gray-500">Niveles UNKNOWN</div>
                <div className="text-xl font-bold text-gray-400">{voxelMapping.unmapped}</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <i className="fas fa-info-circle mr-1"></i>
              Cada intervalo se mapea a los niveles digitales de 10 cm correspondientes.
              Un intervalo grueso (ej. 5 m) <strong>NO se convierte en 50 mediciones independientes</strong>;
              mantiene su resolución original y los voxeles adyacentes permanecen UNKNOWN.
            </p>
          </div>

          {/* Visualización y gestión */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Columna visual */}
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-300">Visualización vertical</h3>
                <button
                  onClick={() => setShowIntervalForm(!showIntervalForm)}
                  className="px-3 py-1 bg-blue-700 text-white rounded text-xs hover:bg-blue-600"
                >
                  <i className="fas fa-plus mr-1"></i> Añadir intervalo
                </button>
              </div>

              {showIntervalForm && (
                <div className="bg-gray-800 rounded-lg p-3 mb-3 space-y-2">
                  {formErrors.length > 0 && (
                    <div className="bg-red-900/30 border border-red-800 rounded p-2 text-xs text-red-300">
                      {formErrors.map((e, i) => <div key={i}>• {e}</div>)}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Desde (m)"
                      value={newInterval.depthFrom}
                      onChange={e => setNewInterval({ ...newInterval, depthFrom: e.target.value })}
                      className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                    />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Hasta (m)"
                      value={newInterval.depthTo}
                      onChange={e => setNewInterval({ ...newInterval, depthTo: e.target.value })}
                      className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                    />
                    <select
                      value={newInterval.lithology}
                      onChange={e => setNewInterval({ ...newInterval, lithology: e.target.value })}
                      className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                    >
                      {LITHOLOGIES.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
                    </select>
                    <input
                      placeholder="Método observación"
                      value={newInterval.observationMethod}
                      onChange={e => setNewInterval({ ...newInterval, observationMethod: e.target.value })}
                      className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddInterval} className="px-3 py-1 bg-green-700 text-white rounded text-xs">Guardar</button>
                    <button onClick={() => { setShowIntervalForm(false); setFormErrors([]); }} className="px-3 py-1 bg-gray-700 text-white rounded text-xs">Cancelar</button>
                  </div>
                </div>
              )}

              <div className="relative" style={{ height: `${maxDepth * scale}px` }}>
                {/* Escala */}
                <div className="absolute left-0 top-0 bottom-0 w-10">
                  {Array.from({ length: Math.floor(maxDepth) + 1 }, (_, i) => (
                    <div
                      key={i}
                      className="absolute left-0 text-[10px] text-gray-500 font-mono"
                      style={{ top: `${i * scale}px` }}
                    >
                      {i}m
                    </div>
                  ))}
                </div>

                {/* Intervalos */}
                <div className="ml-12 relative h-full">
                  {/* Fondo UNKNOWN */}
                  <div
                    className="absolute inset-0 border border-gray-700"
                    style={{
                      backgroundColor: '#374151',
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, #00000015 5px, #00000015 10px)',
                    }}
                  >
                    <div className="absolute top-1 right-2 text-[10px] text-gray-500 italic">UNKNOWN</div>
                  </div>

                  {/* Intervalos observados */}
                  {intervals.map(interval => {
                    const height = (interval.depthToM - interval.depthFromM) * scale;
                    const top = interval.depthFromM * scale;
                    const lith = LITHOLOGIES.find(l => l.name === interval.lithologyRaw);
                    const pattern = lith?.pattern || 'solid';
                    const color = lith?.color || interval.colorHex || '#6b7280';

                    return (
                      <div
                        key={interval.id}
                        className="absolute left-0 right-0 border border-gray-600 group cursor-pointer hover:border-blue-500 transition-colors"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          ...getPatternStyle(color, pattern),
                        }}
                        title={`${interval.lithologyRaw || 'Sin litología'} (${interval.depthFromM}–${interval.depthToM}m)`}
                      >
                        {height > 20 && (
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/90 drop-shadow">
                            {interval.lithologyRaw}
                          </div>
                        )}
                        <button
                          onClick={() => handleDeleteInterval(interval.id)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-red-600 text-white rounded px-1 text-[10px]"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    );
                  })}

                  {/* Marcadores de gaps UNKNOWN */}
                  {validationReport?.gaps.map((gap, i) => {
                    const top = gap.from * scale;
                    const height = (gap.to - gap.from) * scale;
                    return (
                      <div
                        key={`gap-${i}`}
                        className="absolute left-0 right-0 pointer-events-none border border-dashed border-yellow-600/50"
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div className="absolute top-0 right-1 text-[9px] text-yellow-500 italic">UNKNOWN</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Lista de intervalos */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-gray-300 mb-3">Intervalos ({intervals.length})</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {intervals.length === 0 && (
                  <div className="text-xs text-gray-500 italic">Sin intervalos registrados</div>
                )}
                {intervals.map(interval => (
                  <div key={interval.id} className="bg-gray-800 rounded p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{interval.lithologyRaw || 'Sin litología'}</span>
                      <span className="text-gray-500 font-mono">{interval.depthFromM}–{interval.depthToM}m</span>
                    </div>
                    <div className="text-gray-500 mt-1">
                      Método: {interval.observationMethod} · Fuente: {interval.sourceId}
                    </div>
                    {interval.notes && <div className="text-gray-600 italic mt-1">{interval.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leyenda */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-300 mb-2">Leyenda de litologías (descriptiva, no mineralógica)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {LITHOLOGIES.map(lith => (
                <div key={lith.name} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border border-gray-700" style={getPatternStyle(lith.color, lith.pattern)}></div>
                  <span className="text-xs text-gray-300">{lith.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
