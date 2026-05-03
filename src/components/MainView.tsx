import { SpinnerPane } from '@sqlrooms/ui';
import { useRoomStore } from '../store';
import MapView from './map/MapView';
import FiltersPanel from './filters/FiltersPanel';
import BondTable from './BondTable';
import TerminalDashboard from './TerminalDashboard'; 
import NetworkView from './NetworkView'; // 👈 NEW: Imported the real Network Graph!
import { useMosaicClient, Query, sql } from '@sqlrooms/mosaic';
import { Table } from 'apache-arrow';
import { useState } from 'react';
import { Map as MapIcon, LineChart, Network } from 'lucide-react';

// --- 1. The KPI HUD (Remains available globally or just on the map) ---
function KPIBar() {
  const { data } = useMosaicClient<Table>({
    selectionName: 'brush',
    query: (filter: any) => {
      return Query.from('bonds')
        .select({
          total_principal: sql`SUM(PrincipalAmount)`,
          avg_interest: sql`AVG(TICInterestRate)`,
          bond_count: sql`COUNT(*)`
        })
        .where(filter);
    }
  });

  const row = data?.toArray()[0];
  const principal = row?.total_principal || 0;
  const interest = row?.avg_interest || 0;
  const count = row?.bond_count || 0;

  const formattedPrincipal = (principal / 1_000_000_000).toFixed(2);
  const formattedInterest = interest.toFixed(2);

  return (
    <div className="flex gap-10 bg-slate-950/80 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] text-white pointer-events-auto">
      <div className="flex flex-col items-center min-w-[120px]">
        <span className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-1">Total Debt</span>
        <span className="text-4xl font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">${formattedPrincipal}B</span>
      </div>
      <div className="w-px bg-slate-700" />
      <div className="flex flex-col items-center min-w-[120px]">
        <span className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-1">Avg Interest</span>
        <span className="text-4xl font-bold text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">{formattedInterest}%</span>
      </div>
      <div className="w-px bg-slate-700" />
      <div className="flex flex-col items-center min-w-[120px]">
        <span className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-1">Issuances</span>
        <span className="text-4xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">{count}</span>
      </div>
    </div>
  );
}

// 👈 NOTE: We deleted the dummy NetworkView placeholder from here!

// --- 3. Main Application Container ---
export const MainView = () => {
  const mosaicConn = useRoomStore((state) => state.mosaic.connection);
  const countiesReady = useRoomStore((state) => state.db.tables.find(({table: {table}}) => table === 'counties'));
  const bondsReady = useRoomStore((state) => state.db.tables.find(({table: {table}}) => table === 'bonds'));
  const populationsReady = useRoomStore((state) => state.db.tables.find(({table: {table}}) => table === 'county_populations'));

  // State to track which view is currently active
  const [activeView, setActiveView] = useState<'map' | 'dashboard' | 'network'>('map');

  if (mosaicConn.status === 'loading') return <SpinnerPane className="h-full w-full" />;
  if (mosaicConn.status === 'error') return <div className="p-4 text-red-500">Error initializing Mosaic</div>;
  if (!countiesReady || !bondsReady || !populationsReady) {
    return <div className="flex h-full items-center justify-center text-slate-400 animate-pulse">Downloading data lake...</div>;
  }

  return (
    <div className="relative h-full w-full bg-slate-950 overflow-hidden font-sans">
      
      {/* --- TOP LEFT VIEW SWITCHER --- */}
      <div className="absolute top-6 left-6 z-50 flex bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-lg p-1 shadow-lg pointer-events-auto">
        <button 
          onClick={() => setActiveView('map')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${activeView === 'map' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <MapIcon size={16} /> <span className="text-sm font-semibold">Geospatial</span>
        </button>
        <button 
          onClick={() => setActiveView('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${activeView === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <LineChart size={16} /> <span className="text-sm font-semibold">Terminal</span>
        </button>
        <button 
          onClick={() => setActiveView('network')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${activeView === 'network' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <Network size={16} /> <span className="text-sm font-semibold">Graph</span>
        </button>
      </div>


      {/* --- CONDITIONAL RENDERING OF VIEWS --- */}
      
      {/* VIEW 1: MAP */}
      {activeView === 'map' && (
        <>
          <MapView className="absolute inset-0 z-0" />
          <div className="absolute top-6 right-6 z-10 max-h-[calc(100vh-120px)] pointer-events-none">
            <FiltersPanel className="pointer-events-auto rounded-2xl shadow-2xl border border-slate-700/50 bg-slate-950/70 backdrop-blur-xl" />
          </div>
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <KPIBar />
          </div>
        </>
      )}

      {/* VIEW 2: TERMINAL DASHBOARD */}
      {activeView === 'dashboard' && <TerminalDashboard />} 

      {/* VIEW 3: COSMOS NETWORK */}
      {activeView === 'network' && <NetworkView />}


      {/* GLOBAL: Bond Table (Visible across all views) */}
      <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-auto">
        <BondTable />
      </div>
      
    </div>
  );
};