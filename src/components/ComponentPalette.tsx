import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Table2, 
  Gauge, 
  TrendingUp, 
  LayoutGrid, 
  CreditCard, 
  Grid3X3, 
  Filter, 
  ListFilter, 
  Calendar, 
  SlidersHorizontal,
  GitBranch,
  Triangle,
  CircleDot,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { LayoutPalette } from "./LayoutPalette";
import type { VisualizationType } from "./VisualizationSelector";
import type { LayoutType } from "./LayoutPalette";
import type { SlicerType } from "@/types/dashboard";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface ComponentOption {
  type: VisualizationType;
  icon: React.ElementType;
  label: string;
  category: "charts" | "tables" | "cards" | "advanced";
}

interface SlicerOption {
  type: SlicerType;
  icon: React.ElementType;
  label: string;
}

const componentOptions: ComponentOption[] = [
  { type: "bar", icon: BarChart3, label: "Bar Chart", category: "charts" },
  { type: "line", icon: LineChart, label: "Line Chart", category: "charts" },
  { type: "pie", icon: PieChart, label: "Pie Chart", category: "charts" },
  { type: "area", icon: TrendingUp, label: "Area Chart", category: "charts" },
  { type: "gauge", icon: Gauge, label: "Gauge", category: "charts" },
  { type: "combo" as VisualizationType, icon: TrendingUp, label: "Combo", category: "charts" },
  { type: "matrix", icon: Grid3X3, label: "Matrix", category: "tables" },
  { type: "table", icon: Table2, label: "Table", category: "tables" },
  { type: "card" as VisualizationType, icon: CreditCard, label: "KPI Card", category: "cards" },
  { type: "waterfall" as VisualizationType, icon: GitBranch, label: "Waterfall", category: "advanced" },
  { type: "treemap" as VisualizationType, icon: Layers, label: "Treemap", category: "advanced" },
  { type: "funnel" as VisualizationType, icon: Triangle, label: "Funnel", category: "advanced" },
  { type: "scatter" as VisualizationType, icon: CircleDot, label: "Scatter", category: "advanced" },
];

const slicerOptions: SlicerOption[] = [
  { type: "dropdown", icon: Filter, label: "Dropdown" },
  { type: "list", icon: ListFilter, label: "List" },
  { type: "date-range", icon: Calendar, label: "Date Range" },
  { type: "numeric-range", icon: SlidersHorizontal, label: "Numeric Range" },
];

interface DraggableComponentItemProps {
  component: ComponentOption;
}

function DraggableComponentItem({ component }: DraggableComponentItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `component-${component.type}`,
    data: { type: "component", componentType: component.type },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-transparent",
        "bg-muted/50 hover:bg-muted hover:border-border transition-all",
        "cursor-grab active:cursor-grabbing group",
        isDragging && "opacity-50 ring-2 ring-primary"
      )}
    >
      <component.icon className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">
        {component.label}
      </span>
    </div>
  );
}

interface DraggableSlicerItemProps {
  slicer: SlicerOption;
}

function DraggableSlicerItem({ slicer }: DraggableSlicerItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `slicer-type-${slicer.type}`,
    data: { type: "slicer-type", slicerType: slicer.type },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-transparent",
        "bg-accent/30 hover:bg-accent/50 hover:border-accent transition-all",
        "cursor-grab active:cursor-grabbing group",
        isDragging && "opacity-50 ring-2 ring-accent"
      )}
    >
      <slicer.icon className="h-5 w-5 text-accent-foreground/70 group-hover:text-accent-foreground transition-colors" />
      <span className="text-xs font-medium text-accent-foreground/70 group-hover:text-accent-foreground transition-colors text-center">
        {slicer.label}
      </span>
    </div>
  );
}

interface ComponentPaletteProps {
  onAddVisual: (type: VisualizationType) => void;
  onAddLayout?: (type: LayoutType) => void;
  onAddSlicer?: (type: SlicerType) => void;
}

export function ComponentPalette({ onAddVisual, onAddLayout, onAddSlicer }: ComponentPaletteProps) {
  const charts = componentOptions.filter((c) => c.category === "charts");
  const tables = componentOptions.filter((c) => c.category === "tables");
  const cards = componentOptions.filter((c) => c.category === "cards");
  const advanced = componentOptions.filter((c) => c.category === "advanced");

  const renderSection = (title: string, items: ComponentOption[], description?: string) => (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-muted-foreground px-1 mb-2">{description}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <DraggableComponentItem key={item.type} component={item} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          Build Dashboard
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Drag items to canvas
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Layout Section */}
          <LayoutPalette onSelectLayout={onAddLayout} />
          
          {/* Slicers Section */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                Filters / Slicers
              </h3>
              <p className="text-xs text-muted-foreground px-1 mb-2">
                Interactive filters for data
              </p>
              <div className="grid grid-cols-2 gap-2">
                {slicerOptions.map((slicer) => (
                  <DraggableSlicerItem key={slicer.type} slicer={slicer} />
                ))}
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            {renderSection("Charts", charts, "Drag to panel or canvas")}
          </div>
          {renderSection("Tables", tables)}
          {renderSection("Cards", cards)}
          {renderSection("Advanced Charts", advanced)}
        </div>
      </ScrollArea>
    </div>
  );
}
