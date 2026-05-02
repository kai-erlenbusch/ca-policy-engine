import { vg } from '@sqlrooms/mosaic';
import { cn } from '@sqlrooms/ui';
import { useEffect, useRef, useState } from 'react';
import { roomStore } from '../../store';
import { ChevronRight, Filter } from 'lucide-react'; // 👈 Import our new icons!

// --- 1. React Wrapper for Mosaic Menu ---
function MosaicMenu({ table, column }: { table: string; column: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const brush = roomStore.getState().mosaic.getSelection('brush');
    const el = vg.menu({ from: table, column, as: brush });
    if (ref.current) ref.current.replaceChildren(el); 
  }, [table, column]);

  return <div ref={ref} className="[&>select]:w-full [&>select]:rounded-md [&>select]:bg-slate-800 [&>select]:text-white [&>select]:p-2" />;
}

// --- 2. React Wrapper for Mosaic Search Box ---
function MosaicSearch({ table, column }: { table: string; column: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const brush = roomStore.getState().mosaic.getSelection('brush');
    const el = vg.search({ from: table, column, as: brush });
    if (ref.current) ref.current.replaceChildren(el); 
  }, [table, column]);

  return <div ref={ref} className="[&>input]:w-full [&>input]:rounded-md [&>input]:bg-slate-800 [&>input]:text-white [&>input]:p-2" />;
}

// --- 3. The Interactive Cross-Filter Timeline ---
function TimelinePlot() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const brush = roomStore.getState().mosaic.getSelection('brush');

    const el = vg.plot(
      vg.rectY(vg.from('bonds'), {
        x: vg.bin('SaleDate'),
        y: vg.sum('PrincipalAmount'),
        fill: '#334155', 
        inset: 0.5
      }),
      vg.rectY(vg.from('bonds', { filterBy: brush }), {
        x: vg.bin('SaleDate'),
        y: vg.sum('PrincipalAmount'),
        fill: '#3b82f6', 
        inset: 0.5
      }),
      vg.intervalX({ as: brush }),
      vg.xLabel('Sale Date'),
      vg.yLabel('Total Principal ($)'),
      vg.width(350),
      vg.height(200),
      vg.margins({left: 60, right: 10, top: 10, bottom: 40})
    );

    if (ref.current) ref.current.replaceChildren(el);
  }, []);

  return <div ref={ref} className="text-slate-300 [&_svg]:text-slate-300 [&_line]:stroke-slate-700 [&_path.domain]:stroke-slate-700" />;
}

// --- 4. The Main Panel UI ---
export default function FiltersPanel({className}: {className?: string}) {
  // 👈 State to manage our collapsed window size
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      'flex flex-col border-l border-slate-800 bg-slate-900/50 transition-all duration-300 ease-in-out overflow-hidden',
      isCollapsed ? '!w-12 !min-w-[3rem] p-2 items-center' : 'p-4', // 👈 Shrinks the width when collapsed
      className
    )}>
      
      {isCollapsed ? (
        // --- Collapsed State: Just a small button ---
        <button 
          onClick={() => setIsCollapsed(false)} 
          className="text-slate-400 hover:text-white mt-2 p-2 rounded hover:bg-slate-800 transition-colors" 
          title="Expand Filters"
        >
          <Filter size={20} />
        </button>
      ) : (
        // --- Expanded State: Full Filters ---
        <div className="w-full min-w-[280px] flex flex-col gap-6">
          <div className="flex justify-between items-center text-white">
            <h2 className="text-xl font-semibold">Bond Filters</h2>
            <button 
              onClick={() => setIsCollapsed(true)} 
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors" 
              title="Hide Filters"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <p className="text-sm text-slate-400">
            Use the dropdowns or <strong>drag on the timeline</strong> to filter the map.
          </p>

          <hr className="border-slate-800" />

          {/* Interactive Dropdowns */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300">Search Issuer</label>
              <MosaicSearch table="bonds" column="Issuer" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300">Primary Purpose</label>
              <MosaicMenu table="bonds" column="PrimaryPurpose" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300">Tax Status</label>
              <MosaicMenu table="bonds" column="TaxStatus" />
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* The Interactive Timeline */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300">Funding over Time</label>
            <div className="rounded-md bg-slate-800 p-2 overflow-hidden">
               <TimelinePlot />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}