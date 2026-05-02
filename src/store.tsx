import { createRoomShellSlice, createRoomStore, RoomShellSliceState } from '@sqlrooms/room-shell';
import { createCommandSlice, CommandSliceState } from '@sqlrooms/room-store';
import { createDuckDbSlice, DuckDbSliceState } from '@sqlrooms/duckdb';
import { createMosaicSlice } from '@sqlrooms/mosaic'; 
import { MosaicSliceState } from '@sqlrooms/mosaic/dist/MosaicSlice'; // 👈 ADD THIS IMPORT
import { MainView } from './components/MainView.tsx'; 

export type RoomState = RoomShellSliceState & CommandSliceState & DuckDbSliceState & MosaicSliceState;

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
          nodes: 'main', // Pass full control to MainView!
        },
        panels: {
          main: {
            title: 'California Bonds Dashboard',
            component: MainView,
            placement: 'main'
          }
        }
      }
    })(set, get, store),
    
    ...createCommandSlice()(set, get, store),
    ...createDuckDbSlice()(set, get, store),
    ...createMosaicSlice()(set as any, get as any, store as any)
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