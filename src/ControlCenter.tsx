import { useRoomStore } from './store';
import { VgPlotChart, Spec } from '@sqlrooms/mosaic';

export default function ControlCenter() {
  const tableReady = useRoomStore((state) => state.db.findTableByName('bonds'));

  if (!tableReady) {
    return (
      <div className="p-6 h-full text-slate-400">
        <h2 className="text-xl font-bold mb-4 animate-pulse">Loading CDIAC Data...</h2>
      </div>
    );
  }

  const spec: Spec = {
    vconcat: [
      {
        input: "menu",
        label: "Filter by Primary Purpose: ",
        as: "$brush",
        from: "bonds",
        column: "PrimaryPurpose" 
      },
      { vspace: 30 },
      {
        plot: [
          {
            mark: "barX",
            data: { from: "bonds", filterBy: "$brush" },
            x: { sql: "SUM(PrincipalAmount)" },
            y: "IssuerCounty", 
            fill: "steelblue",
            sort: { y: "-x", limit: 10 } 
          }
        ],
        width: 350,
        height: 400,
        marginLeft: 150, 
        xLabel: "Total Principal Amount ($)",
        yLabel: ""
      }
    ]
  };

  return (
    <div className="p-6 h-full text-slate-700 dark:text-slate-300 overflow-y-auto">
      <h2 className="text-xl font-bold mb-6">Control Center</h2>
      <VgPlotChart spec={spec} />
    </div>
  );
}