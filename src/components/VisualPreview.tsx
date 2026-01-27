import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { VisualType } from "./VisualTypeSelector";
import type { VisualProperties } from "./PropertyPanel";
import type { DataPoint } from "./DataEditor";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface VisualPreviewProps {
  type: VisualType;
  data: DataPoint[];
  properties: VisualProperties;
  onDataClick?: (dimension: string, value: string) => void;
  highlightedValue?: string | string[] | null;
}

const CHART_COLORS = [
  "hsl(195, 85%, 45%)",
  "hsl(45, 100%, 51%)",
  "hsl(280, 65%, 55%)",
  "hsl(150, 60%, 45%)",
  "hsl(15, 80%, 55%)",
  "hsl(220, 70%, 50%)",
  "hsl(340, 75%, 55%)",
  "hsl(90, 60%, 45%)",
];

export function VisualPreview({ 
  type, 
  data, 
  properties, 
  onDataClick,
  highlightedValue 
}: VisualPreviewProps) {
  const chartData = data.map((d) => ({
    name: d.category,
    value: d.value,
  }));

  const handleBarClick = (data: unknown) => {
    if (onDataClick && data && typeof data === "object" && "name" in data) {
      onDataClick("category", (data as { name: string }).name);
    }
  };

  const isHighlighted = (name: string) => {
    if (!highlightedValue) return true;
    if (Array.isArray(highlightedValue)) {
      return highlightedValue.includes(name);
    }
    return highlightedValue === name;
  };

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: properties.fontSize - 2 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: properties.fontSize - 2 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: properties.borderRadius,
                  fontSize: properties.fontSize - 2,
                }}
              />
              {properties.showLegend && <Legend />}
              <Bar
                dataKey="value"
                fill={properties.primaryColor}
                radius={[properties.borderRadius / 2, properties.borderRadius / 2, 0, 0]}
                animationDuration={properties.animationDuration}
                label={properties.showDataLabels ? { position: "top", fontSize: properties.fontSize - 2 } : false}
                onClick={handleBarClick}
                cursor={onDataClick ? "pointer" : undefined}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={properties.primaryColor}
                    opacity={isHighlighted(entry.name) ? 1 : 0.3}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: properties.fontSize - 2 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: properties.fontSize - 2 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: properties.borderRadius,
                  fontSize: properties.fontSize - 2,
                }}
              />
              {properties.showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey="value"
                stroke={properties.primaryColor}
                strokeWidth={2}
                dot={{ fill: properties.primaryColor, strokeWidth: 2 }}
                animationDuration={properties.animationDuration}
                label={properties.showDataLabels ? { position: "top", fontSize: properties.fontSize - 2 } : undefined}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                animationDuration={properties.animationDuration}
                label={properties.showDataLabels ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : false}
                labelLine={properties.showDataLabels}
                onClick={handleBarClick}
                cursor={onDataClick ? "pointer" : undefined}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    opacity={isHighlighted(entry.name) ? 1 : 0.3}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: properties.borderRadius,
                  fontSize: properties.fontSize - 2,
                }}
              />
              {properties.showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: properties.fontSize - 2 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: properties.fontSize - 2 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: properties.borderRadius,
                  fontSize: properties.fontSize - 2,
                }}
              />
              {properties.showLegend && <Legend />}
              <Area
                type="monotone"
                dataKey="value"
                stroke={properties.primaryColor}
                fill={properties.primaryColor}
                fillOpacity={0.3}
                animationDuration={properties.animationDuration}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "gauge":
        const total = chartData.reduce((acc, d) => acc + d.value, 0);
        const avg = chartData.length ? total / chartData.length : 0;
        const percentage = Math.min(avg, 100);
        
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-48 h-24 overflow-hidden">
              <div
                className="absolute inset-0 border-[12px] border-secondary rounded-t-full"
                style={{ borderBottomWidth: 0 }}
              />
              <div
                className="absolute inset-0 border-[12px] rounded-t-full transition-all duration-500"
                style={{
                  borderColor: properties.primaryColor,
                  borderBottomWidth: 0,
                  clipPath: `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`,
                }}
              />
            </div>
            <div className="text-center mt-2">
              <div className="text-3xl font-bold" style={{ color: properties.primaryColor }}>
                {avg.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Average Value</div>
            </div>
          </div>
        );

      case "matrix":
        return (
          <div className="h-full overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Category</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Value</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">%</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, i) => {
                  const total = chartData.reduce((acc, d) => acc + d.value, 0);
                  const pct = total ? ((row.value / total) * 100).toFixed(1) : "0";
                  return (
                    <tr 
                      key={i} 
                      className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer"
                      onClick={() => onDataClick?.("category", row.name)}
                      style={{ opacity: isHighlighted(row.name) ? 1 : 0.3 }}
                    >
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2 text-right font-mono">{row.value}</td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: `${properties.primaryColor}20`, color: properties.primaryColor }}
                        >
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );

      case "waterfall":
        // Calculate cumulative values for waterfall
        let cumulative = 0;
        const waterfallData = chartData.map((d, i) => {
          const start = cumulative;
          cumulative += d.value;
          return {
            name: d.name,
            value: d.value,
            start,
            end: cumulative,
            fill: d.value >= 0 ? "#22c55e" : "#ef4444",
          };
        });

        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: properties.fontSize - 2 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: properties.fontSize - 2 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: properties.borderRadius,
                }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Bar dataKey="start" stackId="stack" fill="transparent" />
              <Bar
                dataKey="value"
                stackId="stack"
                animationDuration={properties.animationDuration}
              >
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case "treemap":
        const treemapData = chartData.map((d, index) => ({
          name: d.name,
          size: Math.abs(d.value),
          fill: CHART_COLORS[index % CHART_COLORS.length],
        }));

        return (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="hsl(var(--background))"
              animationDuration={properties.animationDuration}
            >
              {treemapData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill}
                  opacity={isHighlighted(entry.name) ? 1 : 0.3}
                />
              ))}
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: properties.borderRadius,
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        );

      case "funnel":
        const funnelData = [...chartData]
          .sort((a, b) => b.value - a.value)
          .map((d, index) => ({
            name: d.name,
            value: d.value,
            fill: CHART_COLORS[index % CHART_COLORS.length],
          }));

        return (
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: properties.borderRadius,
                }}
              />
              <Funnel
                dataKey="value"
                data={funnelData}
                isAnimationActive
                animationDuration={properties.animationDuration}
              >
                {funnelData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill}
                    opacity={isHighlighted(entry.name) ? 1 : 0.3}
                  />
                ))}
                <LabelList
                  position="right"
                  fill="hsl(var(--foreground))"
                  stroke="none"
                  dataKey="name"
                  fontSize={properties.fontSize - 2}
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        );

      case "scatter":
        const scatterData = chartData.map((d, index) => ({
          x: index,
          y: d.value,
          name: d.name,
        }));

        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                dataKey="x"
                tick={{ fontSize: properties.fontSize - 2 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                type="number"
                dataKey="y"
                tick={{ fontSize: properties.fontSize - 2 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: properties.borderRadius,
                }}
              />
              {properties.showLegend && <Legend />}
              <Scatter
                name="Values"
                data={scatterData}
                fill={properties.primaryColor}
                animationDuration={properties.animationDuration}
              >
                {scatterData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={properties.primaryColor}
                    opacity={isHighlighted(entry.name) ? 1 : 0.3}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        );

      case "combo":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: properties.fontSize - 2 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: properties.fontSize - 2 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: properties.borderRadius,
                }}
              />
              {properties.showLegend && <Legend />}
              <Bar
                dataKey="value"
                fill={properties.primaryColor}
                radius={[properties.borderRadius / 2, properties.borderRadius / 2, 0, 0]}
                animationDuration={properties.animationDuration}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={properties.primaryColor}
                    opacity={isHighlighted(entry.name) ? 1 : 0.3}
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="value"
                stroke={CHART_COLORS[1]}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS[1], strokeWidth: 2 }}
                animationDuration={properties.animationDuration}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case "card":
        const cardTotal = chartData.reduce((acc, d) => acc + d.value, 0);
        const cardChange = chartData.length >= 2 
          ? ((chartData[chartData.length - 1].value - chartData[0].value) / Math.max(chartData[0].value, 1)) * 100
          : 0;

        return (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="text-sm text-muted-foreground mb-2">{properties.title}</div>
            <div 
              className="text-4xl font-bold mb-2"
              style={{ color: properties.primaryColor }}
            >
              {cardTotal.toLocaleString()}
            </div>
            <div className={`flex items-center gap-1 text-sm ${cardChange >= 0 ? "text-green-500" : "text-red-500"}`}>
              {cardChange > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : cardChange < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              <span>{Math.abs(cardChange).toFixed(1)}%</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="w-full h-full p-4 rounded-lg shadow-visual animate-scale-in"
      style={{
        backgroundColor: properties.backgroundColor,
        borderRadius: properties.borderRadius,
      }}
    >
      {properties.showTitle && type !== "card" && (
        <h3
          className="font-semibold mb-4 text-center"
          style={{ fontSize: properties.fontSize }}
        >
          {properties.title}
        </h3>
      )}
      <div className="h-[calc(100%-2rem)]">{renderChart()}</div>
    </div>
  );
}
