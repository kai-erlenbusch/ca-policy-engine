import { vg } from '@sqlrooms/mosaic';
import { cn } from '@sqlrooms/ui';
import { useEffect, useRef, useState } from 'react';
import { roomStore } from '../../store';
import { ChevronRight, LayoutDashboard } from 'lucide-react'; 

function VolumeTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const brush = roomStore.getState().mosaic.getSelection('brush');
    const el = vg.plot(
      // 👈 FIXED: Changed barY to rectY, added inset for styling!
      vg.rectY(vg.from('bonds'), { x: vg.bin('SaleDate'), y: vg.sum('PrincipalAmount'), fill: '#334155', inset: 0.5 }),
      vg.rectY(vg.from('bonds', { filterBy: brush }), { x: vg.bin('SaleDate'), y: vg.sum('PrincipalAmount'), fill: '#34d399', inset: 0.5 }),
      vg.intervalX({ as: brush }),
      vg.yAxis(null),
      vg.xLabel(null),
      vg.width(320),
      vg.height(150),
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
      vg.xAxis(null),
      vg.yLabel(null),
      vg.width(320),
      vg.height(200),
      vg.marginLeft(160) 
    );
    if (ref.current) ref.current.replaceChildren(el);
  }, []);

  return <div ref={ref} className="text-slate-400 [&_svg]:text-slate-400 [&_line]:stroke-slate-700/50 [&_path.domain]:stroke-transparent text-xs" />;
}

export default function FiltersPanel({className}: {className?: string}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
            <h2 className="text-lg font-bold tracking-wide">Analysis</h2>
            <button onClick={() => setIsCollapsed(true)} className="text-slate-400 hover:text-white transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold tracking-widest text-slate-500 uppercase">Issue Volume Over Time</label>
              <VolumeTimeline />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold tracking-widest text-slate-500 uppercase">Top Sectors by Principal</label>
              <PurposeBarChart />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}