// GEO-MARTE 3D — Visor 3D con React Three Fiber
// Visualiza voxeles UNKNOWN sin inventar datos geológicos

import { useRef, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Voxel, KNOWLEDGE_COLORS, KNOWLEDGE_LABELS } from '../../domain/types';

interface VoxelGridProps {
  voxels: Voxel[];
  gridCellsX: number;
  gridCellsY: number;
  cellSizeXM: number;
  cellSizeYM: number;
  verticalStepM: number;
  selectedDepth: number;
  maxVisibleDepth: number;
  onVoxelClick: (voxel: Voxel) => void;
  selectedVoxelId: string | null;
}

function VoxelInstances({
  voxels,
  gridCellsX,
  gridCellsY,
  cellSizeXM,
  cellSizeYM,
  verticalStepM,
  selectedDepth,
  maxVisibleDepth,
  onVoxelClick,
  selectedVoxelId,
}: VoxelGridProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const visibleVoxels = useMemo(() => {
    return voxels.filter(v => v.iz >= selectedDepth && v.iz < selectedDepth + maxVisibleDepth);
  }, [voxels, selectedDepth, maxVisibleDepth]);

  const { matrices, colors } = useMemo(() => {
    const mats: THREE.Matrix4[] = [];
    const cols: THREE.Color[] = [];
    const matrix = new THREE.Matrix4();

    visibleVoxels.forEach((voxel) => {
      const x = (voxel.ix - gridCellsX / 2 + 0.5) * cellSizeXM;
      const z = (voxel.iy - gridCellsY / 2 + 0.5) * cellSizeYM;
      const y = -(voxel.iz * verticalStepM + verticalStepM / 2);

      matrix.makeScale(cellSizeXM * 0.95, verticalStepM * 0.95, cellSizeYM * 0.95);
      matrix.setPosition(x, y, z);
      mats.push(matrix.clone());

      const isSelected = voxel.id === selectedVoxelId;
      const baseColor = KNOWLEDGE_COLORS[voxel.state];
      const color = new THREE.Color(baseColor);
      if (isSelected) {
        color.multiplyScalar(1.5);
      }
      cols.push(color);
    });

    return { matrices: mats, colors: cols };
  }, [visibleVoxels, gridCellsX, gridCellsY, cellSizeXM, cellSizeYM, verticalStepM, selectedVoxelId]);

  useMemo(() => {
    if (!meshRef.current) return;
    matrices.forEach((matrix, i) => {
      meshRef.current!.setMatrixAt(i, matrix);
      meshRef.current!.setColorAt(i, colors[i]);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [matrices, colors]);

  const handleClick = (event: any) => {
    if (event.instanceId !== undefined && event.instanceId < visibleVoxels.length) {
      onVoxelClick(visibleVoxels[event.instanceId]);
    }
  };

  if (visibleVoxels.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, visibleVoxels.length]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(e.instanceId ?? null);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(null);
        document.body.style.cursor = 'default';
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        transparent
        opacity={0.85}
        roughness={0.6}
        metalness={0.1}
      />
    </instancedMesh>
  );
}

function DepthMarker({ depth, width, height }: { depth: number; width: number; height: number }) {
  return (
    <group position={[width / 2 + 0.3, -depth, height / 2 + 0.3]}>
      <mesh>
        <boxGeometry args={[0.05, 0.02, height + 0.6]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} />
      </mesh>
      <Text
        position={[0.3, 0.1, 0]}
        fontSize={0.15}
        color="#f59e0b"
        anchorX="left"
      >
        {`${depth.toFixed(1)} m`}
      </Text>
    </group>
  );
}

function GridFloor({ width, height }: { width: number; height: number }) {
  return (
    <group position={[0, 0.01, 0]}>
      <gridHelper args={[Math.max(width, height) + 2, Math.max(width, height) + 2, '#4b5563', '#374151']} />
    </group>
  );
}

interface Viewer3DProps {
  voxels: Voxel[];
  gridCellsX: number;
  gridCellsY: number;
  cellSizeXM: number;
  cellSizeYM: number;
  verticalStepM: number;
  maxDepthM: number;
  selectedDepth: number;
  onDepthChange: (depth: number) => void;
  onVoxelClick: (voxel: Voxel) => void;
  selectedVoxelId: string | null;
}

export default function Viewer3D({
  voxels,
  gridCellsX,
  gridCellsY,
  cellSizeXM,
  cellSizeYM,
  verticalStepM,
  maxDepthM,
  selectedDepth,
  onDepthChange,
  onVoxelClick,
  selectedVoxelId,
}: Viewer3DProps) {
  const maxVisibleDepth = 20;
  const totalWidth = gridCellsX * cellSizeXM;
  const totalHeight = gridCellsY * cellSizeYM;

  const depthMarkers = useMemo(() => {
    const markers: number[] = [];
    for (let d = 0; d <= maxDepthM; d += 5) {
      markers.push(d);
    }
    return markers;
  }, [maxDepthM]);

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [5, -5, 5], fov: 50, near: 0.1, far: 100 }}
        style={{ background: '#111827' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, -10, 5]} intensity={0.8} />
        <pointLight position={[0, -2, 0]} intensity={0.3} />

        <VoxelInstances
          voxels={voxels}
          gridCellsX={gridCellsX}
          gridCellsY={gridCellsY}
          cellSizeXM={cellSizeXM}
          cellSizeYM={cellSizeYM}
          verticalStepM={verticalStepM}
          selectedDepth={selectedDepth}
          maxVisibleDepth={maxVisibleDepth}
          onVoxelClick={onVoxelClick}
          selectedVoxelId={selectedVoxelId}
        />

        <GridFloor width={totalWidth} height={totalHeight} />

        {depthMarkers.map(d => (
          <DepthMarker key={d} depth={d} width={totalWidth} height={totalHeight} />
        ))}

        <axesHelper args={[3]} position={[-totalWidth / 2 - 1, 0, -totalHeight / 2 - 1]} />

        <Text
          position={[0, 0.3, -totalHeight / 2 - 0.5]}
          fontSize={0.2}
          color="#9ca3af"
        >
          GEO-MARTE 3D — SIN DATOS VERIFICADOS
        </Text>

        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          minDistance={2}
          maxDistance={30}
        />
      </Canvas>

      {/* Aviso científico */}
      <div className="absolute top-3 left-3 bg-red-900/80 text-red-100 px-3 py-2 rounded-lg text-xs font-bold border border-red-700">
        <i className="fas fa-exclamation-triangle mr-1"></i>
        SIN DATOS GEOLÓGICOS VERIFICADOS — Todos los voxeles UNKNOWN
      </div>

      {/* Leyenda */}
      <div className="absolute bottom-3 left-3 bg-gray-900/90 text-gray-200 p-3 rounded-lg text-xs border border-gray-700">
        <div className="font-bold mb-2">Leyenda de evidencia</div>
        {Object.entries(KNOWLEDGE_COLORS).map(([state, color]) => (
          <div key={state} className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }}></div>
            <span>{KNOWLEDGE_LABELS[state as keyof typeof KNOWLEDGE_LABELS]}</span>
          </div>
        ))}
      </div>

      {/* Control de profundidad */}
      <div className="absolute top-3 right-3 bg-gray-900/90 text-gray-200 p-3 rounded-lg text-xs border border-gray-700">
        <div className="font-bold mb-2">Profundidad de visualización</div>
        <input
          type="range"
          min={0}
          max={199}
          value={selectedDepth}
          onChange={(e) => onDepthChange(parseInt(e.target.value))}
          className="w-32 mb-1"
        />
        <div className="text-center">
          Nivel {selectedDepth} — {(selectedDepth * verticalStepM).toFixed(1)} m a {((selectedDepth + 1) * verticalStepM).toFixed(1)} m
        </div>
      </div>

      {/* Info del voxel seleccionado */}
      {selectedVoxelId && (
        <div className="absolute bottom-3 right-3 bg-gray-900/90 text-gray-200 p-3 rounded-lg text-xs border border-blue-700 max-w-xs">
          <div className="font-bold mb-1 text-blue-300">Voxel seleccionado</div>
          <div>ID: {selectedVoxelId}</div>
        </div>
      )}
    </div>
  );
}
