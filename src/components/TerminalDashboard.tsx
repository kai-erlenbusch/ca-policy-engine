import { vg } from '@sqlrooms/mosaic';
import { useEffect, useRef } from 'react';
import { roomStore } from '../store';

// 1. Cost of Borrowing (Scatter Plot)
function YieldScatter() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const brush = roomStore.getState().mosaic.getSelection('brush');
    const el = vg.plot(
      vg.dot(vg.from('bonds', { filterBy: brush }), {
        x: 'SaleDate',
        y: 'TICInterestRate',
        fill: 'TaxStatus',
        r: 3,
        opacity: 0.5,
        tip: true
      }),
      vg.intervalXY({ as: brush }),
      vg.xLabel('Sale Date'),
      vg.yLabel('True Interest Cost (%)'),
      vg.colorLegend({ tooltip: true }),
      vg.width(600),
      vg.height(250),
      vg.margins({ left: 40, right: 20, top: 20, bottom: 30 })
    );
    if (ref.current) ref.current.replaceChildren(el);
  }, []);
  return <div ref={ref} className="[&_svg]:text-slate-300 [&_line]:stroke-slate-700/50 [&_path.domain]:stroke-slate-700/50 text-xs" />;
}

// 2. The Maturity Cliff (Histogram)
function MaturityCliff() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const brush = roomStore.getState().mosaic.getSelection('brush');
    const el = vg.plot(
      vg.rectY(vg.from('bonds'), { x: vg.bin('FinalMaturityDate'), y: vg.sum('PrincipalAmount'), fill: '#334155', inset: 0.5 }),
      vg.rectY(vg.from('bonds', { filterBy: brush }), { x: vg.bin('FinalMaturityDate'), y: vg.sum('PrincipalAmount'), fill: '#f59e0b', inset: 0.5 }), // Amber
      vg.intervalX({ as: brush }),
      vg.xLabel('Final Maturity Date (When Debt is Due)'),
      vg.yLabel('Principal Amount ($)'),
      vg.yTickFormat('s'),
      vg.width(600),
      vg.height(250),
      vg.margins({ left: 50, right: 20, top: 20, bottom: 30 })
    );
    if (ref.current) ref.current.replaceChildren(el);
  }, []);
  return <div ref={ref} className="[&_svg]:text-slate-300 [&_line]:stroke-slate-700/50 [&_path.domain]:stroke-slate-700/50 text-xs" />;
}

// 3. League Table: Underwriters
function UnderwriterBars() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const brush = roomStore.getState().mosaic.getSelection('brush');
    const el = vg.plot(
      vg.barX(vg.from('bonds'), { x: vg.sum('PrincipalAmount'), y: 'LeadUnderwriter', fill: '#334155', sort: { y: '-x', limit: 10 } }),
      vg.barX(vg.from('bonds', { filterBy: brush }), { x: vg.sum('PrincipalAmount'), y: 'LeadUnderwriter', fill: '#8b5cf6', sort: { y: '-x', limit: 10 } }), // Purple
      vg.toggleY({ as: brush }),
      vg.xLabel('Total Underwritten ($)'),
      vg.yLabel(null),
      vg.xTickFormat('s'),
      vg.width(500),
      vg.height(250),
      vg.marginLeft(220)
    );
    if (ref.current) ref.current.replaceChildren(el);
  }, []);
  return <div ref={ref} className="[&_svg]:text-slate-300 [&_line]:stroke-slate-700/50 [&_path.domain]:stroke-slate-700/50 text-xs" />;
}

// 4. League Table: Sectors
function SectorBars() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const brush = roomStore.getState().mosaic.getSelection('brush');
    const el = vg.plot(
      vg.barX(vg.from('bonds'), { x: vg.sum('PrincipalAmount'), y: 'PrimaryPurpose', fill: '#334155', sort: { y: '-x', limit: 10 } }),
      vg.barX(vg.from('bonds', { filterBy: brush }), { x: vg.sum('PrincipalAmount'), y: 'PrimaryPurpose', fill: '#10b981', sort: { y: '-x', limit: 10 } }), // Emerald
      vg.toggleY({ as: brush }),
      vg.xLabel('Total Principal ($)'),
      vg.yLabel(null),
      vg.xTickFormat('s'),
      vg.width(500),
      vg.height(250),
      vg.marginLeft(180)
    );
    if (ref.current) ref.current.replaceChildren(el);
  }, []);
  return <div ref={ref} className="[&_svg]:text-slate-300 [&_line]:stroke-slate-700/50 [&_path.domain]:stroke-slate-700/50 text-xs" />;
}

// 5. Raw Data Feed
function TerminalTable() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const brush = roomStore.getState().mosaic.getSelection('brush');
    const el = vg.table({
      from: 'bonds',
      filterBy: brush,
      width: '100%',
      height: 300,
    });
    if (ref.current) ref.current.replaceChildren(el);
  }, []);
  return <div ref={ref} className="w-full overflow-x-auto border border-slate-700/50 rounded-lg [&_table]:min-w-full [&_th]:bg-slate-800 [&_th]:text-left [&_th]:p-2 [&_th]:text-slate-300 [&_td]:p-2 [&_td]:text-slate-400 [&_tr]:border-b [&_tr]:border-slate-800 hover:[&_tr]:bg-slate-800/50 text-xs" />;
}

// MAIN LAYOUT
export default function TerminalDashboard() {
  return (
    <div className="h-full w-full bg-slate-950 p-8 text-white overflow-y-auto pt-20 pb-32">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        
        <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-wide">Financial Analytics Terminal</h1>
          <p className="text-slate-400 mt-2">Interactive, globally cross-filtered analysis of municipal debt mechanics.</p>
        </div>

        {/* Top Row: Timelines and Scatters */}
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

        {/* Middle Row: League Tables */}
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

        {/* Bottom Row: Terminal Feed */}
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 shadow-lg">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Live Data Feed</h3>
           <TerminalTable />
        </div>

      </div>
    </div>
  );
}