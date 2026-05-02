import {SpinnerPane} from '@sqlrooms/ui';
import {useRoomStore} from '../store';
import MapView from './map/MapView';
import FiltersPanel from './filters/FiltersPanel';
import BondTable from './BondTable'; // 👈 Import our new table!

export const MainView = () => {
  const mosaicConn = useRoomStore((state) => state.mosaic.connection);
  
  const countiesReady = useRoomStore((state) =>
    state.db.tables.find(({table: {table}}) => table === 'counties'),
  );
  const bondsReady = useRoomStore((state) =>
    state.db.tables.find(({table: {table}}) => table === 'bonds'),
  );

  if (mosaicConn.status === 'loading') {
    return <SpinnerPane className="h-full w-full" />;
  } else if (mosaicConn.status === 'error') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-4 text-red-500">
        <h2 className="text-2xl font-bold">
          Error initializing Mosaic:{' '}
          {mosaicConn.error instanceof Error ? mosaicConn.error.message : 'Unknown error'}
        </h2>
      </div>
    );
  }
  
  if (!countiesReady || !bondsReady) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-4 text-slate-400">
        <h2 className="text-xl tracking-widest animate-pulse">Downloading data lake...</h2>
      </div>
    );
  }

  // 👈 We changed this layout to a column so the table sits cleanly at the bottom!
  return (
    <div className="flex h-full w-full flex-col">
      
      {/* Top Section: Map & Filters */}
      <div className="flex flex-1 min-h-0 flex-row">
        <MapView className="w-[70%] grow" />
        <FiltersPanel className="w-[30%] max-w-100" />
      </div>

      {/* Bottom Section: Infinite Scroll Table */}
      <BondTable />
      
    </div>
  );
};