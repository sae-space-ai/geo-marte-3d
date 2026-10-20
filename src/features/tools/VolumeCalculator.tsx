// GEO-MARTE 3D — Calculadora de Volúmenes
// SAE SPACE AI — Mineral-01
// Herramienta para calcular volúmenes de intervalos estratigráficos

import { useState, useMemo } from 'react';

interface Interval {
  id: string;
  depthFrom: number;
  depthTo: number;
  area: number; // m²
}

export default function VolumeCalculator() {
  const [intervals, setIntervals] = useState<Interval[]>([
    { id: '1', depthFrom: 0, depthTo: 2, area: 4 },
    { id: '2', depthFrom: 2, depthTo: 5, area: 4 },
    { id: '3', depthFrom: 5, depthTo: 8, area: 4 },
  ]);

  const [newInterval, setNewInterval] = useState({
    depthFrom: '',
    depthTo: '',
    area: '4',
  });

  const [showForm, setShowForm] = useState(false);

  const calculations = useMemo(() => {
    return intervals.map(interval => {
      const thickness = interval.depthTo - interval.depthFrom;
      const volume = thickness * interval.area;
      return {
        ...interval,
        thickness,
        volume,
      };
    });
  }, [intervals]);

  const totals = useMemo(() => {
    const totalThickness = calculations.reduce((sum, c) => sum + c.thickness, 0);
    const totalVolume = calculations.reduce((sum, c) => sum + c.volume, 0);
    const avgArea = intervals.length > 0
      ? intervals.reduce((sum, i) => sum + i.area, 0) / intervals.length
      : 0;

    return { totalThickness, totalVolume, avgArea };
  }, [calculations, intervals]);

  const addInterval = () => {
    const from = parseFloat(newInterval.depthFrom);
    const to = parseFloat(newInterval.depthTo);
    const area = parseFloat(newInterval.area);

    if (isNaN(from) || isNaN(to) || isNaN(area)) {
      alert('Todos los campos deben ser números válidos');
      return;
    }

    if (to <= from) {
      alert('La profundidad hasta debe ser mayor que la profundidad desde');
      return;
    }

    if (area <= 0) {
      alert('El área debe ser positiva');
      return;
    }

    setIntervals([...intervals, {
      id: Date.now().toString(),
      depthFrom: from,
      depthTo: to,
      area,
    }]);

    setNewInterval({ depthFrom: '', depthTo: '', area: '4' });
    setShowForm(false);
  };

  const removeInterval = (id: string) => {
    setIntervals(intervals.filter(i => i.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Calculadora de Volúmenes</h2>
        <p className="text-sm text-gray-400 mt-1">
          Calcula volúmenes de intervalos estratigráficos basado en espesor y área
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-300">Intervalos registrados</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs hover:bg-blue-600"
          >
            <i className="fas fa-plus mr-1"></i> Añadir intervalo
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Profundidad desde (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newInterval.depthFrom}
                  onChange={e => setNewInterval({ ...newInterval, depthFrom: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Profundidad hasta (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newInterval.depthTo}
                  onChange={e => setNewInterval({ ...newInterval, depthTo: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                  placeholder="2.0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Área (m²)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={newInterval.area}
                  onChange={e => setNewInterval({ ...newInterval, area: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                  placeholder="4.0"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addInterval} className="px-3 py-1.5 bg-green-700 text-white rounded text-xs">
                Añadir
              </button>
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 bg-gray-700 text-white rounded text-xs">
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {calculations.map(calc => (
            <div key={calc.id} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm text-white font-mono">
                  {calc.depthFrom.toFixed(1)} – {calc.depthTo.toFixed(1)} m
                </div>
                <div className="text-xs text-gray-400">
                  Espesor: {calc.thickness.toFixed(2)} m · Área: {calc.area.toFixed(2)} m²
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-300">{calc.volume.toFixed(2)} m³</div>
                <button
                  onClick={() => removeInterval(calc.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>

        {calculations.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No hay intervalos registrados. Añade uno para comenzar.
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-800 rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Espesor total</div>
          <div className="text-2xl font-bold text-white">{totals.totalThickness.toFixed(2)} m</div>
        </div>
        <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-800 rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Volumen total</div>
          <div className="text-2xl font-bold text-white">{totals.totalVolume.toFixed(2)} m³</div>
        </div>
        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-800 rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Área promedio</div>
          <div className="text-2xl font-bold text-white">{totals.avgArea.toFixed(2)} m²</div>
        </div>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4 text-sm text-yellow-200">
        <i className="fas fa-info-circle mr-2"></i>
        <strong>Fórmula:</strong> Volumen = Espesor × Área. Cada intervalo se calcula independientemente.
        Los volúmenes no se interpolan ni se proyectan a voxeles adyacentes.
      </div>
    </div>
  );
}
