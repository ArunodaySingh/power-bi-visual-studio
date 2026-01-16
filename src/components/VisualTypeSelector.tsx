import { BarChart3, LineChart, PieChart, Gauge, TrendingUp, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type VisualType = "bar" | "line" | "pie" | "gauge" | "area" | "matrix";

interface VisualTypeSelectorProps {
  selected: VisualType;
  onSelect: (type: VisualType) => void;
}

const visualTypes: { type: VisualType; icon: React.ElementType; label: string }[] = [
  { type: "bar", icon: BarChart3, label: "Bar Chart" },
  { type: "line", icon: LineChart, label: "Line Chart" },
  { type: "pie", icon: PieChart, label: "Pie Chart" },
  { type: "gauge", icon: Gauge, label: "Gauge" },
  { type: "area", icon: TrendingUp, label: "Area Chart" },
  { type: "matrix", icon: Grid3X3, label: "Matrix" },
];

export function VisualTypeSelector({ selected, onSelect }: VisualTypeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {visualTypes.map(({ type, icon: Icon, label }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={cn(
            "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200",
            selected === type
              ? "border-primary bg-primary/10 shadow-sm"
              : "border-transparent bg-secondary/50 hover:bg-secondary hover:border-border"
          )}
        >
          <Icon
            className={cn(
              "h-6 w-6 transition-colors",
              selected === type ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "text-xs font-medium",
              selected === type ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
