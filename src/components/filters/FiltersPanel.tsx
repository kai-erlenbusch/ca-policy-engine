import { vg } from '@sqlrooms/mosaic';
import { cn } from '@sqlrooms/ui';
import { useEffect, useRef } from 'react';
import { useRoomStore } from '../../store';

// 1. React Wrapper for Mosaic Menu
function MosaicMenu({ table, column }: { table: string; column: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const brush = useRoomStore((state) => state.mosaic.getSelection('brush'));

  useEffect(() => {
    if (!ref.current || !brush) return;
    const el = vg.menu({ from: table, column, as: brush });
    // 👇 FIX: Use replaceChildren to prevent duplicate menus during hot reloads!
    ref.current.replaceChildren(el); 
  }, [table, column, brush]);

  return <div ref={ref} className="[&>select]:w-full [&>select]:rounded-md [&>select]:bg-slate-800 [&>select]:text-white [&>select]:p-2" />;
}

// 2. React Wrapper for Mosaic Search Box
function MosaicSearch({ table, column }: { table: string; column: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const brush = useRoomStore((state) => state.mosaic.getSelection('brush'));

  useEffect(() => {
    if (!ref.current || !brush) return;
    const el = vg.search({ from: table, column, as: brush });
    // 👇 FIX: Prevent duplicate search bars
    ref.current.replaceChildren(el); 
  }, [table, column, brush]);

  return <div ref={ref} className="[&>input]:w-full [&>input]:rounded-md [&>input]:bg-slate-800 [&>input]:text-white [&>input]:p-2" />;
}

// 3. The Main Panel UI
export default function FiltersPanel({className}: {className?: string}) {
  return (
    <div className={cn('flex flex-col gap-6 p-4 border-l border-slate-800 bg-slate-900/50 overflow-y-auto', className)}>
      <h2 className="text-xl font-semibold text-white">Bond Filters</h2>
      <p className="text-sm text-slate-400">
        Select criteria below to instantly update the map.
      </p>
      
      {/* Search Bar for specific issuers */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-300">Search Issuer</label>
        <MosaicSearch table="bonds" column="Issuer" />
      </div>

      <hr className="border-slate-800" />

      {/* Interactive Category List for Bond Purpose */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-300">Primary Purpose</label>
        <MosaicMenu table="bonds" column="PrimaryPurpose" />
      </div>

      {/* Interactive Category List for Tax Status */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-300">Tax Status</label>
        <MosaicMenu table="bonds" column="TaxStatus" />
      </div>
    </div>
  );
}