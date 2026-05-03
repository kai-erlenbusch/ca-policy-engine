import { useMosaicClient, Query, sql } from '@sqlrooms/mosaic';
import { CosmosGraph, CosmosGraphControls, CosmosSimulationControls } from '@sqlrooms/cosmos';
import { Table } from 'apache-arrow';
import { useEffect, useState } from 'react';
import { roomStore } from '../store';

export default function NetworkView() {
  const [graphData, setGraphData] = useState<any>(null);

  // 1. Ask DuckDB to map the relationships and sum the principal amounts
  const { data, isLoading } = useMosaicClient<Table>({
    query: () => Query.from('bonds')
      .select({
        issuer: 'Issuer',
        underwriter: 'LeadUnderwriter',
        counsel: 'BondCounsel',
        principal: sql`SUM(PrincipalAmount)`
      })
      .where(sql`LeadUnderwriter IS NOT NULL AND BondCounsel IS NOT NULL`)
      .groupby(['Issuer', 'LeadUnderwriter', 'BondCounsel'])
  });

  // 2. Transform the DuckDB table into raw WebGL Buffers for Cosmos.gl
  useEffect(() => {
    if (!data) return;

    const rows = data.toArray();
    const nodeMap = new Map();
    const linksList: any[] = [];

    rows.forEach((row: any) => {
      const issuer = row.issuer?.trim();
      const underwriter = row.underwriter?.trim();
      const counsel = row.counsel?.trim();
      const weight = Number(row.principal) || 0;

      if (!issuer || !underwriter || !counsel || weight === 0) return;

      const addNode = (id: string, type: string) => {
        if (!nodeMap.has(id)) nodeMap.set(id, { id, type, value: 0 });
        nodeMap.get(id).value += weight;
      };

      addNode(issuer, 'Issuer');
      addNode(underwriter, 'Underwriter');
      addNode(counsel, 'Counsel');

      linksList.push({ source: issuer, target: underwriter, weight });
      linksList.push({ source: issuer, target: counsel, weight });
    });

    const nodes = Array.from(nodeMap.values());
    const numNodes = nodes.length;
    const numLinks = linksList.length;

    // --- Allocate WebGL Float32Arrays ---
    const pointPositions = new Float32Array(numNodes * 2); // [x, y, x, y...]
    const pointColors = new Float32Array(numNodes * 4);    // [r, g, b, a...]
    const pointSizes = new Float32Array(numNodes);         // [size, size...]
    const linkIndexes = new Float32Array(numLinks * 2);    // [sourceIdx, targetIdx...]
    const linkColors = new Float32Array(numLinks * 4);     // [r, g, b, a...]

    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return [r, g, b, 1.0];
    };

    const nodeIndices = new Map<string, number>();

    // Populate Node Buffers
    nodes.forEach((n, i) => {
      nodeIndices.set(n.id, i);
      
      // Random initial position for the physics simulation to start from
      pointPositions[i * 2] = (Math.random() - 0.5) * 100;
      pointPositions[i * 2 + 1] = (Math.random() - 0.5) * 100;
      
      // Size based on log scale of debt volume
      pointSizes[i] = Math.max(2, Math.log10(n.value) * 1.2);
      
      // Colors: Issuers = Blue, Underwriters = Emerald, Counsels = Amber
      const colorHex = n.type === 'Issuer' ? '#3b82f6' : n.type === 'Underwriter' ? '#10b981' : '#f59e0b';
      const [r, g, b, a] = hexToRgb(colorHex);
      pointColors[i * 4] = r;
      pointColors[i * 4 + 1] = g;
      pointColors[i * 4 + 2] = b;
      pointColors[i * 4 + 3] = a;
    });

    // Populate Link Buffers
    linksList.forEach((l, i) => {
      linkIndexes[i * 2] = nodeIndices.get(l.source) ?? 0;
      linkIndexes[i * 2 + 1] = nodeIndices.get(l.target) ?? 0;
      
      // Faint gray links connecting them
      linkColors[i * 4] = 0.5;
      linkColors[i * 4 + 1] = 0.5;
      linkColors[i * 4 + 2] = 0.5;
      linkColors[i * 4 + 3] = 0.15;
    });

    // The exact object signature expected by Cosmos
    const webglGraphData = {
      pointPositions,
      pointColors,
      pointSizes,
      linkIndexes,
      linkColors
    };

    setGraphData(webglGraphData);

    try {
      roomStore.getState().cosmos.updateGraphData(webglGraphData);
    } catch (e) {
      console.warn("Could not update store data", e);
    }

  }, [data]);

  return (
    <div className="relative h-full w-full bg-slate-950 overflow-hidden pt-20">
      
      {/* Title & Legend overlay */}
      <div className="absolute top-24 left-6 z-20 pointer-events-none">
        <h2 className="text-2xl font-bold text-white drop-shadow-md">Market Monopolies</h2>
        <p className="text-slate-400 text-sm mb-4 drop-shadow-md">Entity relationships by total debt volume.</p>
        
        <div className="flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md p-4 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-xs font-semibold text-slate-300">Issuers</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs font-semibold text-slate-300">Wall St. Underwriters</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-xs font-semibold text-slate-300">Bond Counsel (Law Firms)</span></div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
          <div className="text-emerald-400 animate-pulse text-xl tracking-widest">Simulating Physics Engine...</div>
        </div>
      )}

      {/* 3. Render the GPU-Accelerated Cosmos Graph */}
      {graphData && (
        <CosmosGraph 
          {...graphData} 
          config={{
            backgroundColor: '#020617', 
            simulationGravity: 0.25,
            simulationRepulsion: 1.0,
            simulationLinkSpring: 1.0,
            simulationLinkDistance: 15
          }}
        >
          <CosmosGraphControls className="absolute bottom-28 left-6" />
          <CosmosSimulationControls className="absolute top-24 right-6 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-4 rounded-lg shadow-xl" />
        </CosmosGraph>
      )}
    </div>
  );
}