import { vg } from '@sqlrooms/mosaic';
import { cn } from '@sqlrooms/ui';
import { useEffect, useRef, useState } from 'react';
import { useRoomStore, roomStore } from '../../store'; 
import { ChevronRight, LayoutDashboard, MapPin, Activity, AlertTriangle } from 'lucide-react'; 

// --- DEFAULT BOND CHARTS (Shown when nothing is clicked) ---
function VolumeTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const brush = roomStore.getState().mosaic.getSelection('brush');
    const el = vg.plot(
      vg.rectY(vg.from('bonds'), { x: vg.bin('SaleDate'), y: vg.sum('PrincipalAmount'), fill: '#334155', inset: 0.5 }),
      vg.rectY(vg.from('bonds', { filterBy: brush }), { x: vg.bin('SaleDate'), y: vg.sum('PrincipalAmount'), fill: '#34d399', inset: 0.5 }),
      vg.intervalX({ as: brush }),
      vg.yAxis(null), vg.xLabel(null), vg.width(320), vg.height(150),
      vg.margins({left: 10, right: 10, top: 10, bottom: 20})
    );
    if (ref.current) ref.current.replaceChildren(el);
  }, []);
  return <div ref={ref} className="text-slate-400 [&_svg]:text-slate-400 [&_line]:stroke-slate-700/50 [&_path.domain]:stroke-transparent" />;
}

function PurposeBarChart() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const brush = roomStore.getState().mosaic.getSelection('brush');
    const el = vg.plot(
      vg.barX(vg.from('bonds'), { x: vg.sum('PrincipalAmount'), y: 'PrimaryPurpose', fill: '#334155', sort: { y: '-x', limit: 8 } }),
      vg.barX(vg.from('bonds', { filterBy: brush }), { x: vg.sum('PrincipalAmount'), y: 'PrimaryPurpose', fill: '#22d3ee', sort: { y: '-x', limit: 8 } }),
      vg.toggleY({ as: brush }),
      vg.xAxis(null), vg.yLabel(null), vg.width(320), vg.height(200), vg.marginLeft(160) 
    );
    if (ref.current) ref.current.replaceChildren(el);
  }, []);
  return <div ref={ref} className="text-slate-400 [&_svg]:text-slate-400 [&_line]:stroke-slate-700/50 [&_path.domain]:stroke-transparent text-xs" />;
}

// --- MAIN INSPECTOR COMPONENT ---
export default function InspectorPanel({className}: {className?: string}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const selectedFeature = useRoomStore((state) => state.selectedFeature);
  const mapDomain = useRoomStore((state) => state.mapDomain);
  const activeEsgLayer = useRoomStore((state) => state.activeEsgLayer); 

  const metricKey = selectedFeature ? Object.keys(selectedFeature).find(k => 
    k.toLowerCase().includes('percentile') || k.toLowerCase().includes('pctl') || k.toLowerCase().includes('score') ||
    k === 'Total_Lead_Risk_Factors' || k === 'Count_Below_Poverty' || k === 'Elevated_BLL_Percent'
  ) : null;

  return (
    <div className={cn('flex flex-col transition-all duration-300 ease-in-out overflow-hidden pointer-events-auto',
      isCollapsed ? '!w-12 !min-w-[3rem] p-2 items-center' : 'p-6 w-[380px]', className
    )}>
      {isCollapsed ? (
        <button onClick={() => setIsCollapsed(false)} className="text-slate-400 hover:text-emerald-400 mt-2 p-2 rounded transition-colors bg-slate-900/80 backdrop-blur-md border border-slate-700/50">
          <LayoutDashboard size={20} />
        </button>
      ) : (
        <div className="w-full flex flex-col gap-6">
          
          <div className="flex justify-between items-center text-white pb-2 border-b border-slate-700/50">
            <h2 className="text-lg font-bold tracking-wide flex items-center gap-2">
              <Activity size={18} className="text-indigo-400" />
              {selectedFeature ? 'Local Report Card' : 'Statewide Analysis'}
            </h2>
            <button onClick={() => setIsCollapsed(true)} className="text-slate-400 hover:text-white transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="flex flex-col gap-8 custom-scrollbar overflow-y-auto max-h-[70vh] pr-2">
            
            {!selectedFeature && (
              <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-8">
                {mapDomain === 'bonds' ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold tracking-widest text-slate-500 uppercase">Issue Volume Over Time</label>
                      <VolumeTimeline />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold tracking-widest text-slate-500 uppercase">Top Sectors by Principal</label>
                      <PurposeBarChart />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                    <MapPin size={32} className="mb-3 opacity-50" />
                    <p className="text-sm">Select a county, facility, or tract on the map to view localized data.</p>
                  </div>
                )}
              </div>
            )}

            {selectedFeature && (
              <div className="animate-in fade-in slide-in-from-right-4 flex flex-col gap-4">
                
                {/* BOND COUNTY CLICKED */}
                {selectedFeature.domain === 'bonds' && (
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 shadow-inner">
                    <h3 className="text-xl font-black text-white mb-1">{selectedFeature.CountyName} County</h3>
                    <p className="text-sm text-slate-400 mb-4">Local Municipal Bond Impact</p>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-500 uppercase">Total Weighted Funding</span>
                      <span className="text-3xl font-bold text-emerald-400">
                        ${(Number(selectedFeature.Funding_Amount) / 1_000_000_000).toFixed(2)}B
                      </span>
                    </div>
                  </div>
                )}

                {/* AIR QUALITY MONITOR POINT CLICKED */}
                {selectedFeature.Monitor_Name && (
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 shadow-inner">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-black text-white leading-tight">{selectedFeature.Monitor_Name}</h3>
                        <p className="text-xs text-slate-400 mt-1">{selectedFeature.County} County • {selectedFeature.Air_Basin || 'Unknown'} Basin</p>
                      </div>
                      <AlertTriangle size={24} className={
                        (activeEsgLayer?.includes('ozone') && Number(selectedFeature.Exceedance_Days_070) > 5) ||
                        (activeEsgLayer?.includes('pm25') && Number(selectedFeature.Days_Above_Std) > 2)
                        ? "text-rose-500" : "text-amber-500"
                      } />
                    </div>

                    {activeEsgLayer?.includes('ozone') && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Max 8-hr Conc.</span>
                          <span className="text-xl font-bold text-amber-400">{Number(selectedFeature.Max_8hr_Ozone || 0)} <span className="text-xs text-slate-500">ppm</span></span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Limit Breaches</span>
                          <span className="text-xl font-bold text-rose-400">{Number(selectedFeature.Exceedance_Days_070 || 0)} <span className="text-xs text-slate-500">days</span></span>
                        </div>
                      </div>
                    )}

                    {activeEsgLayer?.includes('pm25') && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Max 1-Day Avg</span>
                          <span className="text-xl font-bold text-amber-400">{Number(selectedFeature.Daily_Avg_PM25 || 0)} <span className="text-xs text-slate-500">µg/m³</span></span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Limit Breaches</span>
                          <span className="text-xl font-bold text-rose-400">{Number(selectedFeature.Days_Above_Std || 0)} <span className="text-xs text-slate-500">days</span></span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* AIR QUALITY COUNTY BACKGROUND CLICKED */}
                {selectedFeature.domain === 'esg_county' && (
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 shadow-inner">
                    <h3 className="text-xl font-black text-white mb-1">{selectedFeature.County} County</h3>
                    <p className="text-sm text-slate-400 mb-4">Worst Active Air Monitor</p>
                    
                    {activeEsgLayer?.includes('ozone') && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Highest 8-hr</span>
                          <span className="text-lg font-bold text-white">{Number(selectedFeature.Max_8hr_Ozone || 0)} ppm</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Days Over Limit</span>
                          <span className="text-lg font-bold text-rose-400">{Number(selectedFeature.Exceedance_Days_070 || 0)}</span>
                        </div>
                      </div>
                    )}

                    {activeEsgLayer?.includes('pm25') && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Highest 1-Day</span>
                          <span className="text-lg font-bold text-white">{Number(selectedFeature.Daily_Avg_PM25 || 0)} µg/m³</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Days Over Limit</span>
                          <span className="text-lg font-bold text-rose-400">{Number(selectedFeature.Days_Above_Std || 0)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ASTHMA TRACT CLICKED */}
                {selectedFeature.domain === 'esg' && activeEsgLayer?.includes('asthma') && (
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 shadow-inner">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin size={16} className="text-slate-400" />
                      <h3 className="text-sm font-bold text-slate-300">Tract {selectedFeature.Census_Tract || selectedFeature.Tract}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ER Visit Rate</span>
                        <span className="text-xl font-bold text-rose-400">{Number(selectedFeature.Asthma_ER_Rate).toFixed(1)}</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">State Percentile</span>
                        <span className="text-xl font-bold text-amber-400">{Number(selectedFeature.Asthma_Percentile).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* CARDIOVASCULAR TRACT CLICKED */}
                {selectedFeature.domain === 'esg' && activeEsgLayer?.includes('cardiovascular') && (
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 shadow-inner">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin size={16} className="text-slate-400" />
                      <h3 className="text-sm font-bold text-slate-300">Tract {selectedFeature.Census_Tract || selectedFeature.Tract}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ER Visit Rate</span>
                        <span className="text-xl font-bold text-rose-400">{Number(selectedFeature.Cardiovascular_ER_Rate).toFixed(1)}</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">State Percentile</span>
                        <span className="text-xl font-bold text-amber-400">{Number(selectedFeature.Cardiovascular_Percentile).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* GENERIC CHOROPLETH TRACT CLICKED (Fallback) */}
                {metricKey && selectedFeature.domain === 'esg' && !selectedFeature.Monitor_Name && !activeEsgLayer?.includes('asthma') && !activeEsgLayer?.includes('cardiovascular') && (
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 shadow-inner">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin size={16} className="text-slate-400" />
                      <h3 className="text-sm font-bold text-slate-300">Tract {selectedFeature.Census_Tract || selectedFeature.Tract}</h3>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                      <span className="block text-xs font-bold text-slate-500 uppercase mb-2">{metricKey.replace(/_/g, ' ')}</span>
                      <span className="text-4xl font-black text-rose-400">{String(selectedFeature[metricKey])}</span>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}