import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  Grid3X3,
  GitBranch,
  Triangle,
  CircleDot,
  Layers,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";

export type VisualType = 
  | "bar" 
  | "line" 
  | "multiline"
  | "pie" 
  | "area" 
  | "matrix"
  | "waterfall"
  | "treemap"
  | "funnel"
  | "scatter"
  | "combo"
  | "card";

interface VisualTypeSelectorProps {
  selected: VisualType;
  onSelect: (type: VisualType) => void;
}

const visualTypes: { type: VisualType; icon: React.ElementType; label: string; disabled?: boolean }[] = [
  { type: "bar", icon: BarChart3, label: "Bar Chart" },
  { type: "line", icon: LineChart, label: "Single Line Chart" },
  { type: "multiline", icon: LineChart, label: "Multi Line Chart" },
  { type: "pie", icon: PieChart, label: "Pie Chart" },
  { type: "area", icon: TrendingUp, label: "Area Chart" },
  { type: "matrix", icon: Grid3X3, label: "Matrix", disabled: true },
  { type: "waterfall", icon: GitBranch, label: "Waterfall" },
  { type: "treemap", icon: Layers, label: "Treemap" },
  { type: "funnel", icon: Triangle, label: "Funnel" },
  { type: "scatter", icon: CircleDot, label: "Scatter" },
  { type: "combo", icon: TrendingUp, label: "Combo" },
  { type: "card", icon: CreditCard, label: "Card" },
];

export function VisualTypeSelector({ selected, onSelect }: VisualTypeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {visualTypes.map(({ type, icon: Icon, label, disabled }) => (
        <button
          key={type}
          onClick={() => !disabled && onSelect(type)}
          disabled={disabled}
          className={cn(
            "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200",
            disabled 
              ? "opacity-50 cursor-not-allowed border-transparent bg-muted/30"
              : selected === type
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-transparent bg-secondary/50 hover:bg-secondary hover:border-border"
          )}
        >
          <Icon
            className={cn(
              "h-6 w-6 transition-colors",
              disabled 
                ? "text-muted-foreground/50" 
                : selected === type ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "text-xs font-medium",
              disabled 
                ? "text-muted-foreground/50" 
                : selected === type ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}