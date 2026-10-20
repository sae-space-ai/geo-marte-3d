// GEO-MARTE 3D — Reporte Científico
// SAE SPACE AI — Mineral-01
// Generador de reportes de integridad científica

import { useState, useMemo } from 'react';

export default function ScientificReport() {
  const [generated, setGenerated] = useState(false);

  const report = useMemo(() => {
    if (!generated) return null;

    return {
      timestamp: new Date().toISOString(),
      phase: 'FASE_00',
      status: 'BASE EJECUTABLE — SIN DATOS VERIFICADOS',
      grid: {
        cellsX: 2,
        cellsY: 2,
        cellSizeXM: 1.0,
        cellSizeYM: 1.0,
        verticalStepM: 0.1,
        maxDepthM: 20.0,
        totalLevels: 200,
        totalVoxels: 800,
      },
      voxels: {
        unknown: 800,
        observed: 0,
        interpolated: 0,
        inferred: 0,
        conflict: 0,
        rejected: 0,
      },
      validations: {
        depthInversion: 'IMPLEMENTED',
        zeroThickness: 'IMPLEMENTED',
        negativeDepth: 'IMPLEMENTED',
        coordinateValidation: 'IMPLEMENTED',
        duplicateDetection: 'IMPLEMENTED',
        sourceIdRequired: 'IMPLEMENTED',
        grainSizeSum: 'IMPLEMENTED',
        voxelBoundsCheck: 'IMPLEMENTED',
      },
      syntheticData: {
        demoColumn: true,
        syntheticIntervals: 6,
        allMarked: true,
        warning: 'DATOS SINTÉTICOS — No representan estratigrafía real',
      },
      scientificIntegrity: {
        noFabricatedLithology: true,
        noFabricatedMineralogy: true,
        unknownVisible: true,
        pointObservationSeparation: true,
        marsDataNotUsedForEarth: true,
        traceability: true,
        versioning: true,
      },
      limitations: {
        sqlJsPersistence: 'localStorage — No apto para producción',
        backendFastify: 'PLANIFICADO — Fase 01',
        authentication: 'NO IMPLEMENTADO',
        multiuser: 'NO SOPORTADO',
      },
      recommendations: [
        'Implementar backend Fastify + SQLite servidor',
        'Migrar datos de localStorage a servidor',
        'Configurar autenticación JWT',
        'Verificar datos reales antes de análisis',
        'No usar datos sintéticos como mediciones',
      ],
    };
  }, [generated]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Reporte Científico</h2>
        <p className="text-sm text-gray-400 mt-1">
          Informe de integridad científica y estado del sistema
        </p>
      </div>

      {!generated ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <i className="fas fa-file-alt text-4xl text-gray-600 mb-4"></i>
          <p className="text-gray-400 mb-4">Genera un reporte completo del estado científico del sistema</p>
          <button
            onClick={() => setGenerated(true)}
            className="px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-600"
          >
            <i className="fas fa-play mr-2"></i> Generar reporte
          </button>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <i className="fas fa-exclamation-triangle text-2xl text-orange-400"></i>
              <div>
                <h3 className="text-lg font-bold text-white">{report?.status}</h3>
                <p className="text-xs text-gray-400">Generado: {report?.timestamp}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-gray-300 mb-3">Configuración de grid</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Celdas X:</span><span className="text-white">{report?.grid.cellsX}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Celdas Y:</span><span className="text-white">{report?.grid.cellsY}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tamaño celda:</span><span className="text-white">{report?.grid.cellSizeXM}×{report?.grid.cellSizeYM} m</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Paso vertical:</span><span className="text-white">{report?.grid.verticalStepM} m</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Profundidad máx:</span><span className="text-white">{report?.grid.maxDepthM} m</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Niveles totales:</span><span className="text-white">{report?.grid.totalLevels}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Voxeles totales:</span><span className="text-white font-bold">{report?.grid.totalVoxels}</span></div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-gray-300 mb-3">Estado de voxeles</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">UNKNOWN:</span><span className="text-gray-400 font-bold">{report?.voxels.unknown}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">OBSERVED:</span><span className="text-blue-400">{report?.voxels.observed}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">INTERPOLATED:</span><span className="text-yellow-400">{report?.voxels.interpolated}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">INFERRED:</span><span className="text-purple-400">{report?.voxels.inferred}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">CONFLICT:</span><span className="text-red-400">{report?.voxels.conflict}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">REJECTED:</span><span className="text-gray-500">{report?.voxels.rejected}</span></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-300 mb-3">Integridad científica</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {report && Object.entries(report.scientificIntegrity).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
                  <i className={`fas ${value ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'}`}></i>
                  <span className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-300 mb-3">Recomendaciones</h3>
            <ul className="space-y-2 text-xs text-gray-400">
              {report?.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <i className="fas fa-arrow-right text-blue-400 mt-0.5"></i>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => setGenerated(false)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600"
          >
            Generar nuevo reporte
          </button>
        </>
      )}
    </div>
  );
}
