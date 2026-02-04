import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Table2, 
  TrendingUp, 
  CreditCard, 
  Grid3X3, 
  Filter, 
  ListFilter, 
  Calendar, 
  SlidersHorizontal,
  GitBranch,
  Triangle,
  CircleDot,
  Layers,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import type { VisualizationType } from "./VisualizationSelector";
import type { SlicerType } from "@/types/dashboard";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface ComponentOption {
  type: VisualizationType;
  icon: React.ElementType;
  label: string;
  category: "charts" | "tables" | "cards";
  disabled?: boolean;
}

interface SlicerOption {
  type: SlicerType;
  icon: React.ElementType;
  label: string;
}

const componentOptions: ComponentOption[] = [
  // Charts
  { type: "bar", icon: BarChart3, label: "Bar Chart", category: "charts" },
  { type: "line", icon: LineChart, label: "Single Line Chart", category: "charts" },
  { type: "multiline" as VisualizationType, icon: LineChart, label: "Multi Line Chart", category: "charts" },
  { type: "pie", icon: PieChart, label: "Pie Chart", category: "charts" },
  { type: "area", icon: TrendingUp, label: "Area Chart", category: "charts" },
  { type: "combo" as VisualizationType, icon: TrendingUp, label: "Combo", category: "charts" },
  { type: "waterfall" as VisualizationType, icon: GitBranch, label: "Waterfall", category: "charts" },
  { type: "treemap" as VisualizationType, icon: Layers, label: "Treemap", category: "charts" },
  { type: "funnel" as VisualizationType, icon: Triangle, label: "Funnel", category: "charts" },
  { type: "scatter" as VisualizationType, icon: CircleDot, label: "Scatter", category: "charts" },
  // Tables
  { type: "matrix", icon: Grid3X3, label: "Matrix", category: "tables", disabled: true },
  { type: "table", icon: Table2, label: "Table", category: "tables" },
  // Cards (renamed from KPI Card)
  { type: "card" as VisualizationType, icon: CreditCard, label: "Card", category: "cards" },
];

const slicerOptions: SlicerOption[] = [
  { type: "dropdown", icon: Filter, label: "Dropdown" },
  { type: "list", icon: ListFilter, label: "List" },
  { type: "date-range", icon: Calendar, label: "Date Range" },
  { type: "numeric-range", icon: SlidersHorizontal, label: "Numeric Range" },
];

interface DraggableComponentItemProps {
  component: ComponentOption;
  isSelected?: boolean;
  onClick?: () => void;
}

function DraggableComponentItem({ component, isSelected, onClick }: DraggableComponentItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `component-${component.type}`,
    data: { type: "component", componentType: component.type },
    disabled: component.disabled,
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
      onClick={(e) => {
        e.stopPropagation();
        if (!component.disabled && onClick) onClick();
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 min-h-[72px]",
        "transition-all overflow-hidden",
        component.disabled 
          ? "opacity-50 cursor-not-allowed border-transparent bg-muted/30"
          : cn(
              "bg-muted/50 hover:bg-muted cursor-grab active:cursor-grabbing group",
              isSelected 
                ? "border-primary bg-primary/10" 
                : "border-transparent hover:border-border"
            ),
        isDragging && "opacity-50 ring-2 ring-primary"
      )}
    >
      <component.icon className={cn(
        "h-6 w-6 transition-colors flex-shrink-0",
        component.disabled 
          ? "text-muted-foreground/50" 
          : isSelected 
            ? "text-primary" 
            : "text-muted-foreground group-hover:text-foreground"
      )} />
      <span className={cn(
        "text-sm font-medium transition-colors text-center truncate w-full",
        component.disabled 
          ? "text-muted-foreground/50" 
          : isSelected 
            ? "text-primary" 
            : "text-muted-foreground group-hover:text-foreground"
      )}>
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
        "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 border-transparent min-h-[72px]",
        "bg-accent/30 hover:bg-accent/50 hover:border-accent transition-all",
        "cursor-grab active:cursor-grabbing group overflow-hidden",
        isDragging && "opacity-50 ring-2 ring-accent"
      )}
    >
      <slicer.icon className="h-5 w-5 text-accent-foreground/70 group-hover:text-accent-foreground transition-colors flex-shrink-0" />
      <span className="text-sm font-medium text-accent-foreground/70 group-hover:text-accent-foreground transition-colors text-center truncate w-full">
        {slicer.label}
      </span>
    </div>
  );
}

interface ComponentPaletteProps {
  onAddVisual: (type: VisualizationType) => void;
  onChangeVisualType?: (type: VisualizationType) => void;
  selectedVisualType?: VisualizationType | null;
  onAddSlicer?: (type: SlicerType) => void;
}

export function ComponentPalette({ 
  onAddVisual, 
  onChangeVisualType, 
  selectedVisualType,
  onAddSlicer 
}: ComponentPaletteProps) {
  const charts = componentOptions.filter((c) => c.category === "charts");
  const tables = componentOptions.filter((c) => c.category === "tables");
  const cards = componentOptions.filter((c) => c.category === "cards");

  const handleComponentClick = (type: VisualizationType) => {
    // If a visual is selected and we have a change handler, change the type
    if (selectedVisualType && onChangeVisualType) {
      onChangeVisualType(type);
    }
  };

  const renderSection = (title: string, items: ComponentOption[], description?: string) => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground px-1 mb-2">{description}</p>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        {items.map((item) => (
          <DraggableComponentItem 
            key={item.type} 
            component={item} 
            isSelected={selectedVisualType === item.type}
            onClick={() => handleComponentClick(item.type)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b flex-shrink-0">
        <h2 className="font-semibold text-base flex items-center gap-2">
          <LayoutGrid className="h-5 w-5" />
          Build Dashboard
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Drag items to canvas
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Filters Section - First */}
          <div className="space-y-3 bg-background p-3 rounded-lg border">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
              Filters / Slicers
            </h3>
            <p className="text-sm text-muted-foreground px-1 mb-2">
              Interactive filters for data
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {slicerOptions.map((slicer) => (
                <DraggableSlicerItem key={slicer.type} slicer={slicer} />
              ))}
            </div>
          </div>
          
          {/* KPI Cards Section - Second (renamed from "Cards") */}
          <div className="border-t pt-4">
            {renderSection("KPI Cards", cards)}
          </div>
          
          {/* Tables Section - Third */}
          <div className="border-t pt-4">
            {renderSection("Tables", tables)}
          </div>
          
          {/* Charts Section - Fourth */}
          <div className="border-t pt-4">
            {renderSection("Charts", charts, "Drag to panel or canvas")}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}