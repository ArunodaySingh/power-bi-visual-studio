import { BarChart3, LineChart, PieChart, Table2, Gauge, TrendingUp, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export type VisualizationType = "bar" | "line" | "pie" | "gauge" | "area" | "matrix" | "table" | "card";

interface VisualizationOption {
  type: VisualizationType;
  icon: React.ElementType;
  label: string;
  description: string;
}

const visualizationOptions: VisualizationOption[] = [
  { type: "bar", icon: BarChart3, label: "Bar Chart", description: "Compare values across categories" },
  { type: "line", icon: LineChart, label: "Line Chart", description: "Show trends over time" },
  { type: "pie", icon: PieChart, label: "Pie Chart", description: "Show proportions of a whole" },
  { type: "area", icon: TrendingUp, label: "Area Chart", description: "Visualize cumulative totals" },
  { type: "gauge", icon: Gauge, label: "Gauge", description: "Display a single metric" },
  { type: "matrix", icon: LayoutGrid, label: "Matrix", description: "Show data in rows and columns" },
  { type: "table", icon: Table2, label: "Table", description: "Display data in tabular format" },
];

interface VisualizationSelectorProps {
  onSelect: (type: VisualizationType) => void;
  triggerLabel?: string;
}

export function VisualizationSelector({ onSelect, triggerLabel = "Add Visual" }: VisualizationSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LayoutGrid className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Select Visualization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {visualizationOptions.map((option) => (
          <DropdownMenuItem
            key={option.type}
            onClick={() => onSelect(option.type)}
            className="flex items-start gap-3 py-2 cursor-pointer"
          >
            <option.icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div>
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-muted-foreground">{option.description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface VisualizationGridSelectorProps {
  selected?: VisualizationType;
  onSelect: (type: VisualizationType) => void;
}

export function VisualizationGridSelector({ selected, onSelect }: VisualizationGridSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {visualizationOptions.map((option) => (
        <button
          key={option.type}
          onClick={() => onSelect(option.type)}
          className={cn(
            "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
            selected === option.type
              ? "border-primary bg-primary/10"
              : "border-transparent bg-muted/50 hover:bg-muted hover:border-border"
          )}
        >
          <option.icon
            className={cn(
              "h-5 w-5",
              selected === option.type ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "text-xs font-medium text-center",
              selected === option.type ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
}
