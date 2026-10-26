"use client";

interface TrendDataPoint {
  date: string;
  label: string;
  count: number;
  revenue: number;
}

interface BookingTrendChartProps {
  data: TrendDataPoint[];
}

/**
 * BookingTrendChart — Zero-dependency pure SVG responsive bar/area chart.
 * Uses CSS variables and brand palette (#16624B, #E7F3EE).
 * Immune to React 19 / Turbopack chart library incompatibilities.
 */
export function BookingTrendChart({ data }: BookingTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-gray-400">
        Belum ada data tren pesanan untuk periode ini.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 5);
  const chartHeight = 160;
  const chartWidth = 500;
  const barWidth = 32;
  const paddingX = 40;
  const availableWidth = chartWidth - paddingX * 2;
  const stepX = data.length > 1 ? availableWidth / (data.length - 1) : availableWidth / 2;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3 px-1">
        <span className="font-semibold text-gray-700">Aktivitas Booking 7 Hari Terakhir</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#16624B]" />
            <span>Jumlah Pesanan</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
          className="w-full h-auto min-w-[320px] max-h-[220px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Horizontal gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = chartHeight - ratio * (chartHeight - 30);
            const val = Math.round(ratio * maxCount);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-gray-400 tabular-nums font-mono"
                  fontSize="10"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((d, idx) => {
            const x = paddingX + idx * stepX - barWidth / 2;
            const barHeight = (d.count / maxCount) * (chartHeight - 30);
            const y = chartHeight - barHeight;

            return (
              <g key={d.date} className="group">
                {/* Background hover bar */}
                <rect
                  x={x - 4}
                  y={20}
                  width={barWidth + 8}
                  height={chartHeight - 10}
                  fill="transparent"
                  className="hover:fill-gray-100/60 transition-colors cursor-pointer"
                  rx="6"
                >
                  <title>{`${d.label}: ${d.count} pesanan (Rp ${d.revenue.toLocaleString("id-ID")})`}</title>
                </rect>

                {/* Primary colored bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 4)}
                  fill={d.count > 0 ? "#16624B" : "#E5E7EB"}
                  rx="4"
                  className="transition-all duration-300 hover:brightness-110"
                />

                {/* Top value badge if > 0 */}
                {d.count > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-[#16624B] tabular-nums"
                    fontSize="10"
                  >
                    {d.count}
                  </text>
                )}

                {/* Date label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  className="text-[11px] font-medium fill-gray-500 tabular-nums"
                  fontSize="11"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
