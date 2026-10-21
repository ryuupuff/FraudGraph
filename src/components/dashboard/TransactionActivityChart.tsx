import React, { useState, useMemo, useRef, useCallback } from 'react';
import type { TimestepActivity } from '../../types/api';
import {
  LineChart,
  Info,
  Calendar,
} from 'lucide-react';

interface TransactionActivityChartProps {
  timesteps?: TimestepActivity[];
  loading?: boolean;
}

export const TransactionActivityChart: React.FC<TransactionActivityChartProps> = ({
  timesteps = [],
  loading = false,
}) => {
  const [hoveredTimestep, setHoveredTimestep] = useState<number | null>(null);
  const [visibleSeries, setVisibleSeries] = useState<{
    total: boolean;
    unknown: boolean;
    licit: boolean;
    illicit: boolean;
  }>({
    total: true,
    unknown: true,
    licit: true,
    illicit: true,
  });

  const svgRef = useRef<SVGSVGElement>(null);

  // Chart Dimensions & Padding
  const width = 800;
  const height = 280;
  const padding = { top: 25, right: 30, bottom: 45, left: 60 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Determine active yMax based on visible series
  const { yMax, yTicks } = useMemo(() => {
    if (!timesteps || timesteps.length === 0) {
      return { yMax: 1000, yTicks: [0, 250, 500, 750, 1000] };
    }

    let maxVal = 0;
    timesteps.forEach((d) => {
      if (visibleSeries.total && d.total > maxVal) maxVal = d.total;
      if (visibleSeries.unknown && d.unknown > maxVal) maxVal = d.unknown;
      if (visibleSeries.licit && d.licit > maxVal) maxVal = d.licit;
      if (visibleSeries.illicit && d.illicit > maxVal) maxVal = d.illicit;
    });

    if (maxVal === 0) maxVal = 100;

    // Generate clean round tick interval
    let roughInterval = maxVal / 4;
    let magnitude = Math.pow(10, Math.floor(Math.log10(roughInterval)));
    let factor = roughInterval / magnitude;

    let cleanInterval: number;
    if (factor <= 1.5) cleanInterval = 1 * magnitude;
    else if (factor <= 3.5) cleanInterval = 2 * magnitude;
    else if (factor <= 7.5) cleanInterval = 5 * magnitude;
    else cleanInterval = 10 * magnitude;

    if (cleanInterval === 0) cleanInterval = 100;

    const calculatedMax = Math.ceil(maxVal / cleanInterval) * cleanInterval;
    const ticks: number[] = [];
    for (let v = 0; v <= calculatedMax; v += cleanInterval) {
      ticks.push(v);
    }

    return { yMax: calculatedMax, yTicks: ticks };
  }, [timesteps, visibleSeries]);

  // Coordinate scales
  const minTs = 1;
  const maxTs = 49;

  const getX = useCallback(
    (ts: number) => padding.left + ((ts - minTs) / (maxTs - minTs)) * innerWidth,
    [innerWidth, padding.left]
  );

  const getY = useCallback(
    (val: number) => padding.top + innerHeight - (val / yMax) * innerHeight,
    [innerHeight, padding.top, yMax]
  );

  // Generate SVG path strings
  const paths = useMemo(() => {
    if (!timesteps || timesteps.length === 0) {
      return {
        total: '',
        totalArea: '',
        unknown: '',
        unknownArea: '',
        licit: '',
        licitArea: '',
        illicit: '',
        illicitArea: '',
      };
    }

    const buildPath = (key: 'total' | 'unknown' | 'licit' | 'illicit') => {
      if (!visibleSeries[key]) return { line: '', area: '' };

      const points = timesteps.map((d) => ({
        x: getX(d.timestep),
        y: getY(d[key]),
      }));

      if (points.length === 0) return { line: '', area: '' };

      const lineD = points.reduce(
        (acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
        ''
      );

      const bottomY = padding.top + innerHeight;
      const areaD = `${lineD} L ${points[points.length - 1].x.toFixed(1)} ${bottomY} L ${points[0].x.toFixed(1)} ${bottomY} Z`;

      return { line: lineD, area: areaD };
    };

    return {
      total: buildPath('total').line,
      totalArea: buildPath('total').area,
      unknown: buildPath('unknown').line,
      unknownArea: buildPath('unknown').area,
      licit: buildPath('licit').line,
      licitArea: buildPath('licit').area,
      illicit: buildPath('illicit').line,
      illicitArea: buildPath('illicit').area,
    };
  }, [timesteps, visibleSeries, getX, getY, innerHeight, padding.top]);

  // Hover detection
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || timesteps.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const svgX = ((clientX - rect.left) / rect.width) * width;

    if (svgX < padding.left - 10 || svgX > width - padding.right + 10) {
      setHoveredTimestep(null);
      return;
    }

    const fraction = Math.max(0, Math.min(1, (svgX - padding.left) / innerWidth));
    const nearestTs = Math.round(minTs + fraction * (maxTs - minTs));
    const clampedTs = Math.max(minTs, Math.min(maxTs, nearestTs));
    setHoveredTimestep(clampedTs);
  };

  const handleMouseLeave = () => {
    setHoveredTimestep(null);
  };

  const activeRecord = useMemo(() => {
    if (!hoveredTimestep) return null;
    return timesteps.find((t) => t.timestep === hoveredTimestep) || null;
  }, [hoveredTimestep, timesteps]);

  const toggleSeries = (key: 'total' | 'unknown' | 'licit' | 'illicit') => {
    setVisibleSeries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (loading) {
    return (
      <div className="p-5 rounded-xl border border-[#262626] bg-[#141414] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
          <div className="w-48 h-4 bg-[#222222] rounded animate-pulse" />
          <div className="w-32 h-4 bg-[#222222] rounded animate-pulse" />
        </div>
        <div className="h-64 bg-[#181818] rounded-lg border border-[#262626] animate-pulse" />
      </div>
    );
  }

  if (!timesteps || timesteps.length === 0) {
    return (
      <div className="p-5 rounded-xl border border-[#262626] bg-[#141414] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
          <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <LineChart className="w-4 h-4 text-violet-400" />
            <span>Transaction Activity Over Time</span>
          </h3>
        </div>
        <div className="p-8 text-center text-neutral-400 text-xs flex flex-col items-center justify-center">
          <Info className="w-5 h-5 text-neutral-500 mb-2" />
          <p className="font-medium text-neutral-300">No Timestep Data Available</p>
          <p className="text-[11px] text-neutral-500 mt-1">
            Activity timeline records could not be loaded from the dataset summary.
          </p>
        </div>
      </div>
    );
  }

  // Key x ticks: 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 49
  const xTicks = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 49];

  return (
    <div className="p-5 rounded-xl border border-[#262626] bg-[#141414] space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#262626]">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <LineChart className="w-4 h-4 text-violet-400" />
            <span>Transaction Activity Over Time</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Temporal trajectory across 49 discrete bi-weekly observation timesteps (Elliptic++ ground truth)
          </p>
        </div>

        {/* Series Visibility Toggles & Legend */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => toggleSeries('total')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border cursor-pointer ${
              visibleSeries.total
                ? 'bg-violet-950/30 text-violet-300 border-violet-500/40 shadow-sm'
                : 'bg-[#181818] text-neutral-500 border-[#262626] opacity-60 hover:opacity-100'
            }`}
            title="Toggle Total Transactions series"
          >
            <span className="w-2 h-2 rounded-full bg-violet-400" />
            <span>Total Volume</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSeries('unknown')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border cursor-pointer ${
              visibleSeries.unknown
                ? 'bg-neutral-800/40 text-neutral-300 border-neutral-600/50 shadow-sm'
                : 'bg-[#181818] text-neutral-500 border-[#262626] opacity-60 hover:opacity-100'
            }`}
            title="Toggle Unknown / Unlabelled series"
          >
            <span className="w-2 h-2 rounded-full bg-neutral-400" />
            <span>Unknown (Class 3)</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSeries('licit')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border cursor-pointer ${
              visibleSeries.licit
                ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-[#181818] text-neutral-500 border-[#262626] opacity-60 hover:opacity-100'
            }`}
            title="Toggle Licit series"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Licit (Class 2)</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSeries('illicit')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border cursor-pointer ${
              visibleSeries.illicit
                ? 'bg-rose-950/30 text-rose-300 border-rose-500/40 shadow-sm'
                : 'bg-[#181818] text-neutral-500 border-[#262626] opacity-60 hover:opacity-100'
            }`}
            title="Toggle Illicit series"
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Illicit (Class 1)</span>
          </button>
        </div>
      </div>

      {/* Dynamic Hover Metrics Banner */}
      <div className="p-2.5 rounded-lg bg-[#181818] border border-[#262626] flex flex-wrap items-center justify-between gap-3 text-xs">
        {activeRecord ? (
          <>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/25 font-mono font-semibold text-[11px]">
                Timestep {activeRecord.timestep} of 49
              </span>
              <span className="text-neutral-400 text-[11px] hidden sm:inline">
                Observation window
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <span className="text-neutral-300">
                Total: <strong className="text-white">{activeRecord.total.toLocaleString()}</strong>
              </span>

              <span className="text-rose-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Illicit: <strong>{activeRecord.illicit.toLocaleString()}</strong>{' '}
                <span className="text-[10px] text-rose-300/80">
                  ({((activeRecord.illicit / activeRecord.total) * 100).toFixed(1)}%)
                </span>
              </span>

              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Licit: <strong>{activeRecord.licit.toLocaleString()}</strong>{' '}
                <span className="text-[10px] text-emerald-300/80">
                  ({((activeRecord.licit / activeRecord.total) * 100).toFixed(1)}%)
                </span>
              </span>

              <span className="text-neutral-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                Unknown: <strong>{activeRecord.unknown.toLocaleString()}</strong>{' '}
                <span className="text-[10px] text-neutral-500">
                  ({((activeRecord.unknown / activeRecord.total) * 100).toFixed(1)}%)
                </span>
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full text-neutral-400 text-xs">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span>Hover anywhere across the chart timeline to inspect timestep-level forensic counts.</span>
            </span>
            <span className="text-[11px] text-neutral-500 font-mono hidden md:inline">
              Span: 49 Timesteps (203,769 Vertices)
            </span>
          </div>
        )}
      </div>

      {/* SVG Line Chart Viewport */}
      <div className="relative w-full overflow-hidden bg-[#101010] rounded-xl border border-[#222222] p-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Total Gradient */}
            <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>

            {/* Unknown Gradient */}
            <linearGradient id="unknownGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#71717a" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#71717a" stopOpacity="0.0" />
            </linearGradient>

            {/* Licit Gradient */}
            <linearGradient id="licitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Illicit Gradient */}
            <linearGradient id="illicitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {yTicks.map((tickVal) => {
            const y = getY(tickVal);
            return (
              <g key={`y-${tickVal}`} className="text-neutral-500">
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#222222"
                  strokeWidth="1"
                  strokeDasharray={tickVal === 0 ? undefined : '3 3'}
                />
                <text
                  x={padding.left - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fill="#737373"
                  className="font-mono"
                >
                  {tickVal.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Vertical Gridlines & X-Axis Labels */}
          {xTicks.map((ts) => {
            const x = getX(ts);
            return (
              <g key={`x-${ts}`} className="text-neutral-500">
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + innerHeight}
                  stroke="#1c1c1c"
                  strokeWidth="1"
                />
                <line
                  x1={x}
                  y1={padding.top + innerHeight}
                  x2={x}
                  y2={padding.top + innerHeight + 4}
                  stroke="#333333"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padding.top + innerHeight + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#737373"
                  className="font-mono"
                >
                  {ts}
                </text>
              </g>
            );
          })}

          {/* X-Axis Title */}
          <text
            x={padding.left + innerWidth / 2}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#a3a3a3"
            className="font-medium"
          >
            Observation Timestep (1–49)
          </text>

          {/* Y-Axis Title (rotated) */}
          <text
            transform={`rotate(-90) translate(-${padding.top + innerHeight / 2}, 16)`}
            textAnchor="middle"
            fontSize="10"
            fill="#a3a3a3"
            className="font-medium"
          >
            Transaction Count
          </text>

          {/* Series Area Fills */}
          {visibleSeries.total && paths.totalArea && (
            <path d={paths.totalArea} fill="url(#totalGrad)" />
          )}
          {visibleSeries.unknown && paths.unknownArea && (
            <path d={paths.unknownArea} fill="url(#unknownGrad)" />
          )}
          {visibleSeries.licit && paths.licitArea && (
            <path d={paths.licitArea} fill="url(#licitGrad)" />
          )}
          {visibleSeries.illicit && paths.illicitArea && (
            <path d={paths.illicitArea} fill="url(#illicitGrad)" />
          )}

          {/* Series Lines */}
          {visibleSeries.unknown && paths.unknown && (
            <path
              d={paths.unknown}
              fill="none"
              stroke="#71717a"
              strokeWidth="1.75"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {visibleSeries.total && paths.total && (
            <path
              d={paths.total}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {visibleSeries.licit && paths.licit && (
            <path
              d={paths.licit}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {visibleSeries.illicit && paths.illicit && (
            <path
              d={paths.illicit}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.25"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* Hover Crosshair & Data Points */}
          {hoveredTimestep && activeRecord && (
            <g>
              {/* Vertical Guide Line */}
              <line
                x1={getX(hoveredTimestep)}
                y1={padding.top}
                x2={getX(hoveredTimestep)}
                y2={padding.top + innerHeight}
                stroke="#8b5cf6"
                strokeWidth="1.25"
                strokeDasharray="4 3"
                opacity="0.8"
              />

              {/* Point Markers */}
              {visibleSeries.total && (
                <circle
                  cx={getX(hoveredTimestep)}
                  cy={getY(activeRecord.total)}
                  r="4"
                  fill="#8b5cf6"
                  stroke="#101010"
                  strokeWidth="2"
                />
              )}

              {visibleSeries.unknown && (
                <circle
                  cx={getX(hoveredTimestep)}
                  cy={getY(activeRecord.unknown)}
                  r="4"
                  fill="#71717a"
                  stroke="#101010"
                  strokeWidth="2"
                />
              )}

              {visibleSeries.licit && (
                <circle
                  cx={getX(hoveredTimestep)}
                  cy={getY(activeRecord.licit)}
                  r="4"
                  fill="#10b981"
                  stroke="#101010"
                  strokeWidth="2"
                />
              )}

              {visibleSeries.illicit && (
                <circle
                  cx={getX(hoveredTimestep)}
                  cy={getY(activeRecord.illicit)}
                  r="4.5"
                  fill="#f43f5e"
                  stroke="#101010"
                  strokeWidth="2"
                />
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Epistemic note & Footprint info */}
      <div className="p-3 rounded-lg bg-[#181818] border border-[#262626] text-xs text-neutral-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong className="text-neutral-300">Temporal Continuity:</strong> Each timestep represents Bitcoin transactions occurring within a discrete 2-week window. Illicit activity peaks in early-to-mid timesteps (notably timestep 9 with 248 illicit transactions and timestep 34 with 342 illicit transactions). Unlabelled transactions consistently constitute the majority across all 49 windows.
        </span>
      </div>
    </div>
  );
};
