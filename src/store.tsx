import { createRoomShellSlice, createRoomStore, RoomShellSliceState } from '@sqlrooms/room-shell';
import { createCommandSlice, CommandSliceState } from '@sqlrooms/room-store';
import { createDuckDbSlice, DuckDbSliceState } from '@sqlrooms/duckdb';
import { createMosaicSlice } from '@sqlrooms/mosaic'; 
import { VgPlotChart, Spec } from '@sqlrooms/mosaic'; 
import MapCanvas from './MapCanvas';

// 1. Define ControlCenter HERE to destroy the circular dependency bug!
const ControlCenter = () => {
  // Wait until DuckDB has fully loaded your CDIAC Bonds CSV
  const tableReady = useRoomStore((state) => state.db.findTableByName('bonds'));

  if (!tableReady) {
    return (
      <div className="p-6 h-full text-slate-400">
        <h2 className="text-xl font-bold mb-4 animate-pulse">Loading CDIAC Data...</h2>
      </div>
    );
  }

  // A declarative Mosaic JSON Specification (Properly typed!)
  const spec: Spec = {
    vconcat: [
      {
        input: "menu",
        label: "Filter by Primary Purpose: ",
        as: "$brush",
        from: "bonds",
        column: "PrimaryPurpose" // Filtering by the column you actually care about!
      },
      { vspace: 30 },
      {
        plot: [
          {
            mark: "barX",
            data: { from: "bonds", filterBy: "$brush" },
            x: { sql: "SUM(PrincipalAmount)" },
            y: "IssuerCounty", // Show the counties receiving the money in the chart
            fill: "steelblue",
            sort: { y: "-x", limit: 10 } // Sort highest funding to the top, limit 10
          }
        ],
        width: 350,
        height: 400,
        marginLeft: 150, // Give room for the long purpose labels
        xLabel: "Total Principal Amount ($)",
        yLabel: ""
      }
    ]
  };

  return (
    <div className="p-6 h-full text-slate-700 dark:text-slate-300 overflow-y-auto">
      <h2 className="text-xl font-bold mb-6">Control Center</h2>
      <VgPlotChart spec={spec} />
    </div>
  );
};

// 2. We keep ALL of our states, including Commands for the SLM!
export type RoomState = RoomShellSliceState & CommandSliceState & DuckDbSliceState;

export const { roomStore, useRoomStore } = createRoomStore<RoomState>(
  (set, get, store) => ({
    ...createRoomShellSlice({
      config: {
        title: 'California Policy Engine',
        dataSources: [
          {
            type: 'url',
            tableName: 'counties',
            url: '/data/geometries/Counties.parquet',
          },
          {
            type: 'url',
            tableName: 'bonds',
            url: '/data/bonds/california_debt_watch_detailed.csv',
          }
        ],
      },
      layout: {
        config: {
          type: 'mosaic',
          nodes: {
            direction: 'row',
            first: 'controls',
            second: 'map',
            splitPercentage: 25,
          }
        },
        panels: {
          controls: {
            title: 'Control Center',
            component: ControlCenter,
            placement: 'sidebar'
          },
          map: {
            title: 'Geospatial Map',
            component: MapCanvas,
            placement: 'main'
          }
        }
      }
    })(set, get, store),
    
    ...createCommandSlice()(set, get, store),
    ...createDuckDbSlice()(set, get, store),
    ...createMosaicSlice()(set as any, get as any, store as any) // Initialize the Mosaic Coordinator
  })
);

// 3. We keep our custom spatial initialization guard!
roomStore.getState().room.initialize().then(async () => {
  try {
    const connector = await roomStore.getState().db.getConnector();
    await connector.query('INSTALL spatial; LOAD spatial;');
    console.log('✅ DuckDB Spatial extension loaded successfully!');
  } catch (error) {
    console.error('❌ Failed to load spatial extension:', error);
  }
});