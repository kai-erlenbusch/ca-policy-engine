import { createRoomShellSlice, createRoomStore, RoomShellSliceState } from '@sqlrooms/room-shell';
import { createCommandSlice, CommandSliceState } from '@sqlrooms/room-store';
import { createDuckDbSlice, DuckDbSliceState } from '@sqlrooms/duckdb';
import { createMosaicSlice } from '@sqlrooms/mosaic'; 
import { MosaicSliceState } from '@sqlrooms/mosaic/dist/MosaicSlice'; 
import { MainView } from './components/MainView.tsx'; 
import { createCosmosSlice, CosmosSliceState } from '@sqlrooms/cosmos';

// 1. Define our custom UI state interface for the Data Explorer
export interface UIState {
  mapDomain: 'bonds' | 'esg';
  setMapDomain: (domain: 'bonds' | 'esg') => void;
  activeEsgLayer: string | null;
  setActiveEsgLayer: (layer: string | null) => void;
  activeDistrict: string | null;
  setActiveDistrict: (district: string | null) => void;
  esgYear: number;
  setEsgYear: (year: number) => void;
  ozoneMetric: 'exceedance' | 'concentration';
  setOzoneMetric: (metric: 'exceedance' | 'concentration') => void;
  selectedFeature: any | null;
  setSelectedFeature: (feature: any | null) => void;
}

// 2. Add UIState to the global RoomState type
export type RoomState = RoomShellSliceState & CommandSliceState & DuckDbSliceState & MosaicSliceState & CosmosSliceState & UIState;

export const { roomStore, useRoomStore } = createRoomStore<RoomState>(
  (set, get, store) => ({
    ...createRoomShellSlice({
      config: {
        title: 'California Policy Engine',
        dataSources: [
          { type: 'url', tableName: 'counties', url: '/data/geometries/Counties.parquet' },
          { type: 'url', tableName: 'bonds', url: '/data/bonds/california_debt_watch_detailed.csv' },
          { type: 'url', tableName: 'county_populations', url: '/data/county_populations.csv' }
        ],
      },
      layout: {
        config: { type: 'mosaic', nodes: 'main' },
        panels: { main: { title: 'California Bonds Dashboard', component: MainView, placement: 'main' } }
      }
    })(set, get, store),
    
    ...createCommandSlice()(set, get, store),
    ...createDuckDbSlice()(set, get, store),
    ...createMosaicSlice()(set as any, get as any, store as any),
    ...createCosmosSlice()(set as any, get as any, store as any),

    // 3. Initialize our custom UI state variables and setter actions
    mapDomain: 'bonds',
    setMapDomain: (domain) => set({ mapDomain: domain, selectedFeature: null }),
    
    activeEsgLayer: null,
    setActiveEsgLayer: (layer) => set({ activeEsgLayer: layer, selectedFeature: null }),
    
    activeDistrict: null,
    setActiveDistrict: (district) => set({ activeDistrict: district, selectedFeature: null }),
    
    esgYear: 2026,
    setEsgYear: (year) => set({ esgYear: year }),
    
    ozoneMetric: 'exceedance',
    setOzoneMetric: (metric) => set({ ozoneMetric: metric }),

    selectedFeature: null,
    setSelectedFeature: (feature) => set({ selectedFeature: feature }),
  })
);

// Load the Spatial extension
roomStore.getState().room.initialize().then(async () => {
  try {
    const connector = await roomStore.getState().db.getConnector();
    await connector.query('INSTALL spatial; LOAD spatial;');
    console.log('✅ DuckDB Spatial extension loaded successfully!');
  } catch (error) {
    console.error('❌ Failed to load spatial extension:', error);
  }
});