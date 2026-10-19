// GEO-MARTE 3D — Herramienta: Columna Estratigráfica Interactiva
// SAE SPACE AI — Mineral-01

import { useState } from 'react';

interface Interval {
  id: string;
  depthFrom: number;
  depthTo: number;
  lithology: string;
  color: string;
  description?: string;
}

const LITHOLOGIES: Record<string, { color: string; pattern: string }> = {
  'Arcilla': { color: '#8B7355', pattern: 'solid' },
  'Limo': { color: '#C4A57B', pattern: 'dots' },
  'Arena fina': { color: '#E8D4A0', pattern: 'fine-dots' },
  'Arena media': { color: '#D4B87A', pattern: 'medium-dots' },
  'Arena gruesa': { color: '#B89968', pattern: 'coarse-dots' },
  'Grava': { color: '#9E9E9E', pattern: 'gravel' },
  'Roca': { color: '#6B6B6B', pattern: 'solid' },
  'Desconocido': { color: '#CCCCCC', pattern: 'unknown' },
};

export default function StratigraphicColumn() {
  const [intervals, setIntervals] = useState<Interval[]>([
    { id: '1', depthFrom: 0, depthTo: 2, lithology: 'Arena media', color: '#D4B87A', description: 'Nivel superficial' },
    { id: '2', depthFrom: 2, depthTo: 5, lithology: 'Limo', color: '#C4A57B', description: 'Capa limosa' },
    { id: '3', depthFrom: 5, depthTo: 8, lithology: 'Arcilla', color: '#8B7355', description: 'Nivel arcilloso' },
    { id: '4', depthFrom: 8, depthTo: 12, lithology: 'Arena gruesa', color: '#B89968', description: 'Acuífero' },
    { id: '5', depthFrom: 12, depthTo: 15, lithology: 'Grava', color: '#9E9E9E', description: 'Nivel de gravas' },
    { id: '6', depthFrom: 15, depthTo: 20, lithology: 'Roca', color: '#6B6B6B', description: 'Sustrato rocoso' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [newInterval, setNewInterval] = useState({
    depthFrom: '',
    depthTo: '',
    lithology: 'Arena media',
    description: '',
  });

  const maxDepth = 20;
  const scale = 15; // pixels per meter

  const addInterval = () => {
    const from = parseFloat(newInterval.depthFrom);
    const to = parseFloat(newInterval.depthTo);

    if (isNaN(from) || isNaN(to) || from >= to || from < 0 || to > maxDepth) {
      alert('Profundidades inválidas');
      return;
    }

    const lithology = LITHOLOGIES[newInterval.lithology];
    const interval: Interval = {
      id: Date.now().toString(),
      depthFrom: from,
      depthTo: to,
      lithology: newInterval.lithology,
      color: lithology.color,
      description: newInterval.description || undefined,
    };

    setIntervals([...intervals, interval].sort((a, b) => a.depthFrom - b.depthFrom));
    setNewInterval({ depthFrom: '', depthTo: '', lithology: 'Arena media', description: '' });
    setShowForm(false);
  };

  const removeInterval = (id: string) => {
    setIntervals(intervals.filter(i => i.id !== id));
  };

  const getPatternStyle = (pattern: string, color: string) => {
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Columna Estratigráfica</h2>
          <p className="text-sm text-gray-400 mt-1">Visualización interactiva de intervalos de sondeo</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm hover:bg-blue-600"
        >
          <i className="fas fa-plus mr-2"></i>
          Añadir intervalo
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-300">Nuevo intervalo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Profundidad desde (m)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max={maxDepth}
                value={newInterval.depthFrom}
                onChange={e => setNewInterval({ ...newInterval, depthFrom: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Profundidad hasta (m)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max={maxDepth}
                value={newInterval.depthTo}
                onChange={e => setNewInterval({ ...newInterval, depthTo: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                placeholder="2.0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Litología</label>
              <select
                value={newInterval.lithology}
                onChange={e => setNewInterval({ ...newInterval, lithology: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                {Object.keys(LITHOLOGIES).map(lith => (
                  <option key={lith} value={lith}>{lith}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Descripción (opcional)</label>
              <input
                type="text"
                value={newInterval.description}
                onChange={e => setNewInterval({ ...newInterval, description: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                placeholder="Observaciones"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addInterval} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-600">
              Añadir
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna visual */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="relative" style={{ height: `${maxDepth * scale}px` }}>
            {/* Escala de profundidad */}
            <div className="absolute left-0 top-0 bottom-0 w-12">
              {Array.from({ length: maxDepth + 1 }, (_, i) => (
                <div
                  key={i}
                  className="absolute left-0 text-xs text-gray-500 font-mono"
                  style={{ top: `${i * scale}px` }}
                >
                  {i}m
                </div>
              ))}
            </div>

            {/* Intervalos */}
            <div className="ml-16 relative h-full">
              {intervals.map((interval, idx) => {
                const height = (interval.depthTo - interval.depthFrom) * scale;
                const top = interval.depthFrom * scale;
                const pattern = LITHOLOGIES[interval.lithology]?.pattern || 'solid';

                return (
                  <div
                    key={interval.id}
                    className="absolute left-0 right-0 border border-gray-700 overflow-hidden group cursor-pointer hover:border-blue-500 transition-colors"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      ...getPatternStyle(pattern, interval.color),
                    }}
                    onClick={() => removeInterval(interval.id)}
                    title="Click para eliminar"
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                      <span className="text-white text-xs font-bold">Click para eliminar</span>
                    </div>
                    {height > 30 && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white/80 drop-shadow-lg">
                        {interval.lithology}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lista de intervalos */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-300 mb-3">Intervalos registrados</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {intervals.map((interval, idx) => (
              <div key={interval.id} className="bg-gray-800 rounded-lg p-3 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">{idx + 1}. {interval.lithology}</span>
                  <button
                    onClick={() => removeInterval(interval.id)}
                    className="text-red-400 hover:text-red-300"
                    title="Eliminar"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
                <div className="text-gray-400">
                  {interval.depthFrom.toFixed(1)} – {interval.depthTo.toFixed(1)} m
                  <span className="text-gray-500 ml-2">
                    ({(interval.depthTo - interval.depthFrom).toFixed(1)} m)
                  </span>
                </div>
                {interval.description && (
                  <div className="text-gray-500 mt-1 italic">{interval.description}</div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="text-xs text-gray-400">
              <div className="flex justify-between mb-1">
                <span>Total intervalos:</span>
                <span className="text-white font-bold">{intervals.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Profundidad total:</span>
                <span className="text-white font-bold">
                  {intervals.length > 0 ? Math.max(...intervals.map(i => i.depthTo)).toFixed(1) : 0} m
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-300 mb-3">Leyenda de litologías</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(LITHOLOGIES).map(([name, data]) => (
            <div key={name} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded border border-gray-700"
                style={getPatternStyle(data.pattern, data.color)}
              ></div>
              <span className="text-xs text-gray-300">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Aviso científico */}
      <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4 text-sm text-yellow-200">
        <i className="fas fa-info-circle mr-2"></i>
        <strong>Nota:</strong> Esta herramienta es de demostración. Los intervalos mostrados son sintéticos.
        En producción, los datos provendrán de sondeos reales con validación de fuentes y métodos.
      </div>
    </div>
  );
}
