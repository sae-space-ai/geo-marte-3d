// GEO-MARTE 3D — Exportador de Datos Científicos
// SAE SPACE AI — Mineral-01
// Herramienta para exportar datos con metadatos de procedencia

import { useState } from 'react';

interface ExportData {
  type: 'json' | 'csv';
  includeMetadata: boolean;
  includeProvenance: boolean;
  formatVersion: string;
}

export default function ScientificExporter() {
  const [exportConfig, setExportConfig] = useState<ExportData>({
    type: 'json',
    includeMetadata: true,
    includeProvenance: true,
    formatVersion: '1.0',
  });

  const [exportedData, setExportedData] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const generateExport = () => {
    const timestamp = new Date().toISOString();
    const data: any = {
      schemaVersion: exportConfig.formatVersion,
      exportedAt: timestamp,
      generator: 'GEO-MARTE 3D — SAE Space AI',
    };

    if (exportConfig.includeMetadata) {
      data.metadata = {
        project: 'demo-001',
        description: 'Datos de demostración — No representan mediciones reales',
        warning: 'DATOS SINTÉTICOS — Verificar procedencia antes de usar',
      };
    }

    if (exportConfig.includeProvenance) {
      data.provenance = {
        source: 'Demostración sintética',
        method: 'Generado automáticamente',
        qualityStatus: 'SYNTHETIC',
        verifiedData: false,
      };
    }

    // Datos de ejemplo
    data.intervals = [
      {
        id: 'int-demo-1',
        depthFromM: 0,
        depthToM: 2,
        lithologyRaw: 'Arena (SINTÉTICA)',
        observationMethod: 'demo',
        sourceId: 'src-demo-001',
        qualityStatus: 'valid',
      },
      {
        id: 'int-demo-2',
        depthFromM: 2,
        depthToM: 5,
        lithologyRaw: 'Limo (SINTÉTICO)',
        observationMethod: 'demo',
        sourceId: 'src-demo-001',
        qualityStatus: 'valid',
      },
    ];

    if (exportConfig.type === 'json') {
      setExportedData(JSON.stringify(data, null, 2));
    } else {
      // CSV
      const headers = ['id', 'depthFromM', 'depthToM', 'lithologyRaw', 'observationMethod', 'sourceId', 'qualityStatus'];
      const rows = data.intervals.map((i: any) =>
        headers.map(h => i[h] || '').join(',')
      );
      setExportedData([headers.join(','), ...rows].join('\n'));
    }

    setShowPreview(true);
  };

  const downloadExport = () => {
    const ext = exportConfig.type;
    const mime = ext === 'json' ? 'application/json' : 'text/csv';
    const blob = new Blob([exportedData], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geo-marte-3d-export-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Exportador de Datos Científicos</h2>
        <p className="text-sm text-gray-400 mt-1">
          Exporta datos con metadatos de procedencia y trazabilidad completa
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-300">Configuración de exportación</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Formato</label>
            <div className="flex gap-2">
              <button
                onClick={() => setExportConfig({ ...exportConfig, type: 'json' })}
                className={`px-4 py-2 rounded text-sm ${
                  exportConfig.type === 'json'
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                JSON
              </button>
              <button
                onClick={() => setExportConfig({ ...exportConfig, type: 'csv' })}
                className={`px-4 py-2 rounded text-sm ${
                  exportConfig.type === 'csv'
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                CSV
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block">Versión del formato</label>
            <select
              value={exportConfig.formatVersion}
              onChange={e => setExportConfig({ ...exportConfig, formatVersion: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
            >
              <option value="1.0">v1.0 (actual)</option>
              <option value="0.9">v0.9 (legacy)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={exportConfig.includeMetadata}
              onChange={e => setExportConfig({ ...exportConfig, includeMetadata: e.target.checked })}
              className="rounded"
            />
            Incluir metadatos del proyecto
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={exportConfig.includeProvenance}
              onChange={e => setExportConfig({ ...exportConfig, includeProvenance: e.target.checked })}
              className="rounded"
            />
            Incluir información de procedencia
          </label>
        </div>

        <button
          onClick={generateExport}
          className="w-full px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-600"
        >
          <i className="fas fa-file-export mr-2"></i>
          Generar exportación
        </button>
      </div>

      {showPreview && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-300">Vista previa</h3>
            <button
              onClick={downloadExport}
              className="px-3 py-1.5 bg-blue-700 text-white rounded text-xs hover:bg-blue-600"
            >
              <i className="fas fa-download mr-1"></i> Descargar
            </button>
          </div>
          <pre className="bg-gray-800 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto max-h-96 overflow-y-auto">
            {exportedData}
          </pre>
        </div>
      )}

      <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4 text-sm text-yellow-200">
        <i className="fas fa-exclamation-triangle mr-2"></i>
        <strong>Importante:</strong> Los datos exportados incluyen marcadores de procedencia.
        Verifica siempre la fuente antes de usar los datos en análisis científicos.
        Los datos sintéticos están claramente identificados.
      </div>
    </div>
  );
}
