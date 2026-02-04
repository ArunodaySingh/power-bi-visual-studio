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
  valueFieldNames?: string[]; // Names of value fields for legend
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

interface ChartDataPoint {
  name: string;
  value: number;
  value2?: number;
  value3?: number;
  value4?: number;
  value5?: number;
  [key: string]: string | number | undefined;
}

export function VisualPreview({ 
  type, 
  data, 
  properties, 
  onDataClick,
  highlightedValue,
  valueFieldNames = ["Value"],
}: VisualPreviewProps) {
  // Detect additional value fields in data
  const valueKeys = data.length > 0 
    ? Object.keys(data[0]).filter(k => k === "value" || k.match(/^value\d+$/)).sort()
    : ["value"];
  
  const hasMultipleValues = valueKeys.length > 1;

  const chartData: ChartDataPoint[] = data.map((d) => {
    const point: ChartDataPoint = {
      name: d.category,
      value: d.value,
    };
    // Add additional value fields
    valueKeys.forEach((key) => {
      if (key in d && key !== "value") {
        point[key] = d[key] as number;
      }
    });
    return point;
  });

  const handleBarClick = (clickData: unknown) => {
    if (onDataClick && clickData && typeof clickData === "object" && "name" in clickData) {
      onDataClick("category", (clickData as { name: string }).name);
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
        const isStacked = properties.barChartMode === "stacked" && hasMultipleValues;
        const legendPosition = properties.legendPosition || "bottom";
        const legendLayout = legendPosition === "left" || legendPosition === "right" ? "vertical" : "horizontal";
        const legendAlign = legendPosition === "left" ? "left" : legendPosition === "right" ? "right" : "center";
        const legendVerticalAlign = legendPosition === "top" ? "top" : legendPosition === "bottom" ? "bottom" : "middle";
        
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
              {(properties.showLegend || hasMultipleValues) && (
                <Legend 
                  layout={legendLayout}
                  align={legendAlign}
                  verticalAlign={legendVerticalAlign}
                  wrapperStyle={legendPosition === "left" || legendPosition === "right" ? { paddingLeft: 10, paddingRight: 10 } : {}}
                />
              )}
              {/* Render multiple bars for multiple values */}
              {valueKeys.map((key, idx) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={valueFieldNames[idx] || key}
                  fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  stackId={isStacked ? "stack" : undefined}
                  radius={isStacked ? (idx === valueKeys.length - 1 ? [properties.borderRadius / 2, properties.borderRadius / 2, 0, 0] : 0) : [properties.borderRadius / 2, properties.borderRadius / 2, 0, 0]}
                  animationDuration={properties.animationDuration}
                  label={!hasMultipleValues && properties.showDataLabels ? { position: "top", fontSize: properties.fontSize - 2 } : false}
                  onClick={handleBarClick}
                  cursor={onDataClick ? "pointer" : undefined}
                >
                  {!hasMultipleValues && chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={properties.primaryColor}
                      opacity={isHighlighted(entry.name) ? 1 : 0.3}
                    />
                  ))}
                </Bar>
              ))}
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

      case "multiline":
        const multiLineLegendPosition = properties.legendPosition || "bottom";
        const multiLineLegendLayout = multiLineLegendPosition === "left" || multiLineLegendPosition === "right" ? "vertical" : "horizontal";
        const multiLineLegendAlign = multiLineLegendPosition === "left" ? "left" : multiLineLegendPosition === "right" ? "right" : "center";
        const multiLineLegendVerticalAlign = multiLineLegendPosition === "top" ? "top" : multiLineLegendPosition === "bottom" ? "bottom" : "middle";
        
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
              <Legend 
                layout={multiLineLegendLayout}
                align={multiLineLegendAlign}
                verticalAlign={multiLineLegendVerticalAlign}
                wrapperStyle={multiLineLegendPosition === "left" || multiLineLegendPosition === "right" ? { paddingLeft: 10, paddingRight: 10 } : {}}
              />
              {valueKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={valueFieldNames[idx] || key}
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS[idx % CHART_COLORS.length], strokeWidth: 2 }}
                  animationDuration={properties.animationDuration}
                  label={properties.showDataLabels ? { position: "top", fontSize: properties.fontSize - 2 } : undefined}
                />
              ))}
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

      // Gauge removed - no longer supported

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

      case "table":
        // Get all unique keys from the data for dynamic columns
        const allKeys = data.length > 0 
          ? Object.keys(data[0]).filter(k => k !== 'id')
          : ['category', 'value'];
        
        return (
          <div className="h-full overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b">
                  {allKeys.map((key) => (
                    <th 
                      key={key} 
                      className="px-3 py-2 text-left font-medium text-muted-foreground capitalize"
                    >
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr 
                    key={i} 
                    className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer"
                    onClick={() => onDataClick?.("category", row.category)}
                    style={{ opacity: isHighlighted(row.category) ? 1 : 0.3 }}
                  >
                    {allKeys.map((key) => (
                      <td key={key} className="px-3 py-2">
                        {typeof row[key] === 'number' 
                          ? row[key].toLocaleString() 
                          : String(row[key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

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
          <div className="flex flex-col items-center justify-center h-full w-full p-2 overflow-hidden">
            {properties.showTitle && (
              <div 
                className="text-muted-foreground mb-1 text-center truncate w-full"
                style={{ fontSize: Math.max(12, properties.fontSize) }}
              >
                {properties.title}
              </div>
            )}
            <div 
              className="font-bold text-center leading-tight truncate w-full"
              style={{ 
                color: properties.primaryColor,
                fontSize: Math.min(Math.max(24, properties.fontSize * 2.5), 48),
              }}
            >
              {cardTotal.toLocaleString()}
            </div>
            <div 
              className={`flex items-center justify-center gap-1 mt-1 ${cardChange >= 0 ? "text-green-600" : "text-red-600"}`}
              style={{ fontSize: Math.max(12, properties.fontSize) }}
            >
              {cardChange > 0 ? (
                <TrendingUp className="h-4 w-4 flex-shrink-0" />
              ) : cardChange < 0 ? (
                <TrendingDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Minus className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="truncate">{Math.abs(cardChange).toFixed(1)}%</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="w-full h-full p-3 rounded-lg shadow-visual animate-scale-in overflow-hidden flex flex-col"
      style={{
        backgroundColor: properties.backgroundColor,
        borderRadius: properties.borderRadius,
      }}
    >
      {properties.showTitle && type !== "card" && (
        <h3
          className="font-semibold mb-3 text-center truncate flex-shrink-0"
          style={{ fontSize: Math.max(14, properties.fontSize) }}
        >
          {properties.title}
        </h3>
      )}
      <div className="flex-1 min-h-0 overflow-hidden">{renderChart()}</div>
    </div>
  );
}
