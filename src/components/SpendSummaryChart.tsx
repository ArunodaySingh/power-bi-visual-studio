import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface SpendData {
  name: string;
  value: number;
  color: string;
}

interface SpendSummaryChartProps {
  data: SpendData[];
  totalSpend: number;
  title?: string;
}

export function SpendSummaryChart({ data, totalSpend, title = "SPEND SUMMARY" }: SpendSummaryChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="bg-card rounded-lg border p-4 h-full">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">{title}</h3>
      
      <div className="relative h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-2xl font-bold">{formatCurrency(totalSpend)}</div>
          <div className="text-sm text-muted-foreground">Spend</div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <span>
              {((item.value / totalSpend) * 100).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
