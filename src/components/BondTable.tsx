import { vg } from '@sqlrooms/mosaic';
import { useEffect, useRef, useState } from 'react';
import { roomStore } from '../store';
import { Maximize2, Minimize2, ChevronDown, ChevronUp } from 'lucide-react'; // 👈 Import new icons!

export default function BondTable() {
  const ref = useRef<HTMLDivElement>(null);
  
  // 👈 State to manage our 3 window sizes
  const [viewState, setViewState] = useState<'default' | 'maximized' | 'collapsed'>('default');

  useEffect(() => {
    const brush = roomStore.getState().mosaic.getSelection('brush');

    // We removed the hardcoded height so our React wrapper can control it!
    const el = vg.table({
      from: 'bonds',
      filterBy: brush,
      width: '100%',
    });

    if (ref.current) ref.current.replaceChildren(el);
  }, []);

  // 👈 Dynamic styling based on the current state
  let wrapperClass = "flex flex-col border-t border-slate-700 bg-slate-900 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out";
  
  if (viewState === 'maximized') {
    // Pops out to cover the whole screen
    wrapperClass += " fixed inset-0 z-[100]";
  } else if (viewState === 'collapsed') {
    // Shrinks down to just the header bar
    wrapperClass += " relative z-50 h-[40px] overflow-hidden";
  } else {
    // Default mid-size state
    wrapperClass += " relative z-50 h-[350px]";
  }

  return (
    <div className={wrapperClass}>
      
      {/* --- The Header & Controls --- */}
      <div className="bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 shadow-md z-10 flex-shrink-0 flex justify-between items-center h-[40px]">
        <span>Raw Bond Records (Infinite Scroll)</span>
        
        {/* Our Action Buttons */}
        <div className="flex gap-4">
          {viewState === 'collapsed' && (
            <button onClick={() => setViewState('default')} className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
              <ChevronUp size={16} /> <span className="text-xs">Expand</span>
            </button>
          )}
          
          {viewState === 'default' && (
            <>
              <button onClick={() => setViewState('collapsed')} className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                <ChevronDown size={16} /> <span className="text-xs">Collapse</span>
              </button>
              <button onClick={() => setViewState('maximized')} className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                <Maximize2 size={16} /> <span className="text-xs">Maximize</span>
              </button>
            </>
          )}

          {viewState === 'maximized' && (
            <button onClick={() => setViewState('default')} className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
              <Minimize2 size={16} /> <span className="text-xs">Restore</span>
            </button>
          )}
        </div>
      </div>
      
      {/* --- The Table Container --- */}
      <div 
        ref={ref} 
        // We use !h-full and !max-h-full to FORCE the mosaic component to obey our React state sizes
        className={`w-full flex-1 overflow-x-auto overflow-y-hidden cursor-auto [&_table]:min-w-full [&_th]:bg-slate-800 [&_th]:text-left [&_th]:p-2 [&_th]:text-slate-300 [&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_td]:p-2 [&_td]:text-slate-400 [&_tr]:border-b [&_tr]:border-slate-800 hover:[&_tr]:bg-slate-800/50 [&>div]:!h-full [&>div]:!max-h-full ${viewState === 'collapsed' ? 'hidden' : 'block'}`}
      />
    </div>
  );
}