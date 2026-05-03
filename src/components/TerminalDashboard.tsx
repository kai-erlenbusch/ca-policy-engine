import { vg, sql } from '@sqlrooms/mosaic';
import { cn } from '@sqlrooms/ui';
import { useEffect, useRef } from 'react';
import { useRoomStore, roomStore } from '../store';
import { Activity, Layers, Database, ArrowRightLeft, LayoutTemplate } from 'lucide-react';

// --- MIRRORED OPTIONS FROM THE MAP ---
const ESG_OPTIONS = [
  { label: 'Asthma Rates', file: 'asthma/ces5_asthma' },
  { label: 'Cardiovascular Disease', file: 'cardiovascular/ces5_cardiovascular' },
  { label: 'Children Lead Housing Risk', file: 'children_lead_housing_risk/ces5_final_lead_housing_index' },
  { label: 'Cleanup Sites', file: 'cleanup_sites/ces5_cleanup_sites' },
  { label: 'Diabetes', file: 'diabetes/places_diabetes' },
  { label: 'Diesel HDV', file: 'disel_hdv/master_diesel_hdv' },
  { label: 'Drinking Water Threats', file: 'drinking_water/ces5_drinking_water' },
  { label: 'Groundwater Threats', file: 'groundwater_threats/ces5_groundwater_threats' },
  { label: 'Hazardous Waste', file: 'hazardous_waste/ces5_hazardous_waste' },
  { label: 'Impaired Waters', file: 'impaired_waters/ces5_impaired_waters' },
  { label: 'Low Birth Weight', file: 'low_birth_weight/ces5_low_birth_weight' },
  { label: 'Ozone (Air Quality)', file: 'air_quality/ozone/ozone_historical_mapped' },
  { label: 'PM 2.5 (Air Quality)', file: 'air_quality/pm25/pm25_historical_mapped' },
  { label: 'Pesticides', file: 'pesticides/master_pesticide_air_monitoring_mapped' },
  { label: 'SMATS', file: 'smats/ces5_smats' },
  { label: 'Socioeconomic Factors (ACS)', file: 'census_socioeconomic/acs_2022_socioeconomic' },
  { label: 'Toxic Releases', file: 'toxic_releases/ces5_toxic_releases' },
  { label: 'Traffic Density', file: 'traffic/ces5_traffic' },
  { label: 'TRI Facilities (Points)', file: 'tri/tri_facilities' },
];

// ==========================================
// 1. BOND CHARTS
// ==========================================
function YieldScatter() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const brush = roomStore.getState().mosaic.getSelection('brush');
    const el = vg.plot(
      vg.dot(vg.from('bonds', { filterBy: brush }), { x: 'SaleDate', y: 'TICInterestRate', fill: 'TaxStatus', r: 3, opacity: 0.5, tip: true }),
      vg.intervalXY({ as: brush }),
      vg.xLabel('Sale Date'), vg.yLabel('True Interest Cost (%)'), vg.colorLegend({ tooltip: true }),
      vg.width(600), vg.height(250), vg.margins({ left: 40, right: 20, top: 20, bottom: 30 })
    );
    if (ref.current) ref.current.replaceChildren(el);
  }, []);
  return <div ref={ref} className="[&_svg]:text-slate-300 [&_line]:stroke-slate-700/50 [&_path.domain]:stroke-slate-700/50 text-xs" />;
}

function MaturityCliff() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const brush = roomStore.getState().mosaic.getSelection('brush');
    const el = vg.plot(
      vg.rectY(vg.from('bonds'), { x: vg.bin('FinalMaturityDate'), y: vg.sum('PrincipalAmount'), fill: '#334155', inset: 0.5 }),
      vg.rectY(vg.from('bonds', { filterBy: brush }), { x: vg.bin('FinalMaturityDate'), y: vg.sum('PrincipalAmount'), fill: '#f59e0b', inset: 0.5 }),
      vg.intervalX({ as: brush }),
      vg.xLabel('Final Maturity Date (When Debt is Due)'), vg.yLabel('Principal Amount ($)'), vg.yTickFormat('s'),
      vg.width(600), vg.height(250), vg.margins({ left: 50, right: 20, top: 20, bottom: 30 })
    );
    if (ref.current) ref.current.replaceChildren(el);
  }, []);
  return <div ref={ref} className="[&_svg]:text-slate-300 [&_line]:stroke-slate-700/50 [&_path.domain]:stroke-slate-700/50 text-xs" />;
}

function UnderwriterBars() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const brush = roomStore.getState().mosaic.getSelection('brush');
    const el = vg.plot(
      vg.barX(vg.from('bonds'), { x: vg.sum('PrincipalAmount'), y: 'LeadUnderwriter', fill: '#334155', sort: { y: '-x', limit: 10 } }),
      vg.barX(vg.from('bonds', { filterBy: brush }), { x: vg.sum('PrincipalAmount'), y: 'LeadUnderwriter', fill: '#8b5cf6', sort: { y: '-x', limit: 10 } }),
      vg.toggleY({ as: brush }),
      vg.xLabel('Total Underwritten ($)'), vg.yLabel(null), vg.xTickFormat('s'),
      vg.width(500), vg.height(250), vg.marginLeft(220)
    );
    if (ref.current) ref.current.replaceChildren(el);
  }, []);
  return <div ref={ref} className="[&_svg]:text-slate-300 [&_line]:stroke-slate-700/50 [&_path.domain]:stroke-slate-700/50 text-xs" />;
}

function SectorBars() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const brush = roomStore.getState().mosaic.getSelection('brush');
    const el = vg.plot(
      vg.barX(vg.from('bonds'), { x: vg.sum('PrincipalAmount'), y: 'PrimaryPurpose', fill: '#334155', sort: { y: '-x', limit: 10 } }),
      vg.barX(vg.from('bonds', { filterBy: brush }), { x: vg.sum('PrincipalAmount'), y: 'PrimaryPurpose', fill: '#10b981', sort: { y: '-x', limit: 10 } }),
      vg.toggleY({ as: brush }),
      vg.xLabel('Total Principal ($)'), vg.yLabel(null), vg.xTickFormat('s'),
      vg.width(500), vg.height(250), vg.marginLeft(180)
    );
    if (ref.current) ref.current.replaceChildren(el);
  }, []);
  return <div ref={ref} className="[&_svg]:text-slate-300 [&_line]:stroke-slate-700/50 [&_path.domain]:stroke-slate-700/50 text-xs" />;
}

function TerminalTable() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const brush = roomStore.getState().mosaic.getSelection('brush');
    const el = vg.table({ from: 'bonds', filterBy: brush, width: '100%', height: 300 });
    if (ref.current) ref.current.replaceChildren(el);
  }, []);
  return <div ref={ref} className="w-full overflow-x-auto border border-slate-700/50 rounded-lg [&_table]:min-w-full [&_th]:bg-slate-800 [&_th]:text-left [&_th]:p-2 [&_th]:text-slate-300 [&_td]:p-2 [&_td]:text-slate-400 [&_tr]:border-b [&_tr]:border-slate-800 hover:[&_tr]:bg-slate-800/50 text-xs" />;
}

// ==========================================
// 2. ESG CHARTS
// ==========================================
function OzoneTerminal({ activeEsgLayer, esgYear }: { activeEsgLayer: string, esgYear: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const origin = window.location.origin;
    const metricUrl = `${origin}/data/enviroscreen/${activeEsgLayer}.parquet`;

    const el = vg.plot(
      vg.dot(
        vg.from(sql`(SELECT * FROM read_parquet('${metricUrl}') WHERE Year = ${esgYear})`), 
        { x: 'Max_8hr_Ozone', y: 'Exceedance_Days_070', fill: '#f43f5e', r: 5, opacity: 0.7, tip: true }
      ),
      vg.xDomain([0.04, 0.12]), vg.yDomain([0, 150]),
      vg.yLabel("Days Over Limit (0.070 ppm)"), vg.xLabel("Maximum 8-hr Concentration (ppm)"),
      vg.width(800), vg.height(400), vg.margins({ left: 60, right: 20, top: 20, bottom: 40 })
    );
    if (ref.current) ref.current.replaceChildren(el);
  }, [activeEsgLayer, esgYear]);

  return (
    <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700/50 shadow-lg">
      <h3 className="text-lg font-bold text-white mb-2">Air Quality Correlation ({esgYear})</h3>
      <p className="text-sm text-slate-400 mb-6">Scatter plot comparing peak concentration vs. sustained exceedance days across all CA monitors.</p>
      <div ref={ref} className="[&_svg]:text-slate-300 [&_line]:stroke-slate-700/50 [&_path.domain]:stroke-slate-700/50 text-xs" />
    </div>
  );
}

function PM25Terminal({ activeEsgLayer, esgYear }: { activeEsgLayer: string, esgYear: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const origin = window.location.origin;
    const metricUrl = `${origin}/data/enviroscreen/${activeEsgLayer}.parquet`;

    const el = vg.plot(
      vg.dot(
        vg.from(sql`(SELECT * FROM read_parquet('${metricUrl}') WHERE Year = ${esgYear})`), 
        { x: 'Daily_Avg_PM25', y: 'Days_Above_Std', fill: '#f59e0b', r: 5, opacity: 0.7, tip: true }
      ),
      vg.yLabel("Days Above National Standard"), 
      vg.xLabel("Annual Maximum 1-Day Average (µg/m³)"),
      vg.width(800), vg.height(400), vg.margins({ left: 60, right: 20, top: 20, bottom: 40 })
    );
    if (ref.current) ref.current.replaceChildren(el);
  }, [activeEsgLayer, esgYear]);

  return (
    <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700/50 shadow-lg">
      <h3 className="text-lg font-bold text-white mb-2">PM 2.5 Particulate Matter ({esgYear})</h3>
      <p className="text-sm text-slate-400 mb-6">Scatter plot comparing the 1-Day Average concentration vs. Days Above National Standard.</p>
      <div ref={ref} className="[&_svg]:text-slate-300 [&_line]:stroke-slate-700/50 [&_path.domain]:stroke-slate-700/50 text-xs" />
    </div>
  );
}

function AsthmaTerminal({ activeEsgLayer }: { activeEsgLayer: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const origin = window.location.origin;
    const metricUrl = `${origin}/data/enviroscreen/${activeEsgLayer}.parquet`;

    const el = vg.plot(
      vg.rectY(
        vg.from(sql`(SELECT * FROM read_parquet('${metricUrl}'))`), 
        { x: vg.bin('Asthma_ER_Rate'), y: vg.count(), fill: '#10b981', inset: 0.5, tip: true }
      ),
      vg.yLabel("Number of Census Tracts"), 
      vg.xLabel("Asthma ER Visits (per 10,000 people)"),
      vg.width(800), vg.height(400), vg.margins({ left: 60, right: 20, top: 20, bottom: 40 })
    );
    if (ref.current) ref.current.replaceChildren(el);
  }, [activeEsgLayer]);

  return (
    <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700/50 shadow-lg">
      <h3 className="text-lg font-bold text-white mb-2">Asthma Emergency Room Visits</h3>
      <p className="text-sm text-slate-400 mb-6">Distribution of Asthma ER visit rates across California census tracts.</p>
      <div ref={ref} className="[&_svg]:text-slate-300 [&_line]:stroke-slate-700/50 [&_path.domain]:stroke-slate-700/50 text-xs" />
    </div>
  );
}

function CardioTerminal({ activeEsgLayer }: { activeEsgLayer: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const origin = window.location.origin;
    const metricUrl = `${origin}/data/enviroscreen/${activeEsgLayer}.parquet`;

    const el = vg.plot(
      vg.rectY(
        vg.from(sql`(SELECT * FROM read_parquet('${metricUrl}'))`), 
        // Using a red/rose color for Cardiovascular
        { x: vg.bin('Cardiovascular_ER_Rate'), y: vg.count(), fill: '#e11d48', inset: 0.5, tip: true } 
      ),
      vg.yLabel("Number of Census Tracts"), 
      vg.xLabel("Cardiovascular ER Visits (per 10,000 people)"),
      vg.width(800), vg.height(400), vg.margins({ left: 60, right: 20, top: 20, bottom: 40 })
    );
    if (ref.current) ref.current.replaceChildren(el);
  }, [activeEsgLayer]);

  return (
    <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700/50 shadow-lg">
      <h3 className="text-lg font-bold text-white mb-2">Cardiovascular Disease Emergency Room Visits</h3>
      <p className="text-sm text-slate-400 mb-6">Distribution of Cardiovascular ER visit rates across California census tracts.</p>
      <div ref={ref} className="[&_svg]:text-slate-300 [&_line]:stroke-slate-700/50 [&_path.domain]:stroke-slate-700/50 text-xs" />
    </div>
  );
}

// ==========================================
// 3. MAIN TERMINAL ROUTER
// ==========================================
export default function TerminalDashboard() {
  const mapDomain = useRoomStore((state) => state.mapDomain);
  const setMapDomain = useRoomStore((state) => state.setMapDomain);
  const activeEsgLayer = useRoomStore((state) => state.activeEsgLayer);
  const setActiveEsgLayer = useRoomStore((state) => state.setActiveEsgLayer);
  const esgYear = useRoomStore((state) => state.esgYear);
  const setEsgYear = useRoomStore((state) => state.setEsgYear);

  const activeEsgLabel = ESG_OPTIONS.find(opt => opt.file === activeEsgLayer)?.label || 'Dataset';

  return (
    <div className="absolute inset-0 pt-24 px-8 pb-32 z-0 overflow-y-auto custom-scrollbar bg-slate-950">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        
        {/* --- DYNAMIC HEADER --- */}
        <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Database size={28} className="text-blue-400" />
            <div>
              <h1 className="text-2xl font-black text-white tracking-wide">Data Terminal</h1>
              <p className="text-sm text-slate-400">Direct query interface. Changes made here sync globally across the map.</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
              <button 
                onClick={() => setMapDomain('bonds')}
                className={cn("flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-md transition-all", mapDomain === 'bonds' ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white")}
              >
                <Layers size={16} /> Muni Bonds
              </button>
              <button 
                onClick={() => setMapDomain('esg')}
                className={cn("flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-md transition-all", mapDomain === 'esg' ? "bg-rose-600 text-white shadow-md" : "text-slate-400 hover:text-white")}
              >
                <Activity size={16} /> ESG Hazards
              </button>
            </div>

            {mapDomain === 'esg' && (
              <div className="border-l border-slate-700 pl-6">
                <select 
                  value={activeEsgLayer || ''} 
                  onChange={(e) => setActiveEsgLayer(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-300 text-sm font-bold rounded-lg focus:ring-rose-500 focus:border-rose-500 block w-64 p-2.5 outline-none cursor-pointer"
                >
                  <option value="" disabled>Select Hazard to Analyze...</option>
                  {ESG_OPTIONS.map((opt) => (
                    <option key={opt.label} value={opt.file}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 🧠 FIX: Changed 'ozone' to 'air_quality' so the slider shows for both! */}
            {mapDomain === 'esg' && activeEsgLayer?.includes('air_quality') && (
              <div className="flex items-center gap-4 border-l border-slate-700 pl-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Year</span>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" min="2006" max="2026" step="1"
                      value={esgYear}
                      onChange={(e) => setEsgYear(Number(e.target.value))}
                      className="w-32 accent-rose-500"
                    />
                    <span className="text-lg font-black text-rose-400 w-12">{esgYear}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- CONDITION: MUNI BONDS DASHBOARD --- */}
        {mapDomain === 'bonds' && (
          <div className="flex flex-col gap-6 animate-in fade-in">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 shadow-lg">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Cost of Borrowing (TIC)</h3>
                <YieldScatter />
              </div>
              <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 shadow-lg">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">The Maturity Cliff</h3>
                <MaturityCliff />
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 shadow-lg">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Top Lead Underwriters</h3>
                <UnderwriterBars />
              </div>
              <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 shadow-lg">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Top Debt Sectors</h3>
                <SectorBars />
              </div>
            </div>
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 shadow-lg">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Live Data Feed</h3>
               <TerminalTable />
            </div>
          </div>
        )}

        {/* --- CONDITION: AIR QUALITY ANALYSIS --- */}
        {mapDomain === 'esg' && activeEsgLayer?.includes('ozone') && (
          <div className="animate-in fade-in">
             <OzoneTerminal activeEsgLayer={activeEsgLayer} esgYear={esgYear} />
          </div>
        )}

        {/* --- CONDTIOIN: PM 2.5  */}
        {mapDomain === 'esg' && activeEsgLayer?.includes('pm25') && (
          <div className="animate-in fade-in">
             <PM25Terminal activeEsgLayer={activeEsgLayer} esgYear={esgYear} />
          </div>
        )}

        {/* --- CONDITION: ASTHMA ANALYSIS --- */}
        {mapDomain === 'esg' && activeEsgLayer?.includes('asthma') && (
          <div className="animate-in fade-in">
             <AsthmaTerminal activeEsgLayer={activeEsgLayer} />
          </div>
        )}

        {/* --- CONDITION: CARDIOVASCULAR ANALYSIS --- */}
        {mapDomain === 'esg' && activeEsgLayer?.includes('cardiovascular') && (
          <div className="animate-in fade-in">
             <CardioTerminal activeEsgLayer={activeEsgLayer} />
          </div>
        )}

        {/* --- CONDITION: DYNAMIC FALLBACK FOR UNBUILT CHARTS --- */}
        {/* 🧠 FIX: Changed 'ozone' to 'air_quality' so it only falls back for non-air datasets */}
        {mapDomain === 'esg' && activeEsgLayer && !activeEsgLayer.includes('air_quality') && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed animate-in fade-in">
            <LayoutTemplate size={48} className="mb-4 text-rose-500/50" />
            <h2 className="text-xl font-bold text-slate-300 mb-2">Terminal Analysis for <span className="text-rose-400">{activeEsgLabel}</span></h2>
            <p className="text-sm">This module is currently being configured for the data lake. Switch back to the Geospatial view to explore this data on the map.</p>
          </div>
        )}

        {/* --- CONDITION: NOTHING SELECTED --- */}
        {mapDomain === 'esg' && !activeEsgLayer && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed animate-in fade-in">
            <ArrowRightLeft size={48} className="mb-4 opacity-20" />
            <h2 className="text-xl font-bold text-slate-400 mb-2">Awaiting Analysis Parameters</h2>
            <p className="text-sm">Select an ESG Hazard from the dropdown above to begin.</p>
          </div>
        )}

      </div>
    </div>
  );
}