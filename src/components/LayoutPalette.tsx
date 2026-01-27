import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { 
  LayoutGrid, 
  Square, 
  Columns2, 
  Columns3, 
  Rows2, 
  Rows3,
  LayoutTemplate,
  Grid2X2,
  PanelLeft,
  PanelRight,
  GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";

export type LayoutType = 
  | "single" 
  | "two-columns" 
  | "three-columns" 
  | "two-rows" 
  | "three-rows"
  | "left-sidebar"
  | "right-sidebar"
  | "grid-2x2"
  | "header-content"
  | "content-footer";

interface LayoutOption {
  type: LayoutType;
  icon: React.ElementType;
  label: string;
  preview: string; // CSS grid template
}

export const layoutOptions: LayoutOption[] = [
  { type: "single", icon: Square, label: "Single", preview: "1fr" },
  { type: "two-columns", icon: Columns2, label: "2 Columns", preview: "1fr 1fr" },
  { type: "three-columns", icon: Columns3, label: "3 Columns", preview: "1fr 1fr 1fr" },
  { type: "two-rows", icon: Rows2, label: "2 Rows", preview: "1fr / 1fr" },
  { type: "left-sidebar", icon: PanelLeft, label: "Left Sidebar", preview: "300px 1fr" },
  { type: "right-sidebar", icon: PanelRight, label: "Right Sidebar", preview: "1fr 300px" },
  { type: "grid-2x2", icon: Grid2X2, label: "2x2 Grid", preview: "1fr 1fr / 1fr 1fr" },
  { type: "header-content", icon: LayoutTemplate, label: "Header + Content", preview: "auto / 1fr" },
];

interface DraggableLayoutItemProps {
  layout: LayoutOption;
}

function DraggableLayoutItem({ layout }: DraggableLayoutItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `layout-${layout.type}`,
    data: { type: "layout", layout },
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
      <layout.icon className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">
        {layout.label}
      </span>
    </div>
  );
}

interface LayoutPaletteProps {
  onSelectLayout?: (type: LayoutType) => void;
}

export function LayoutPalette({ onSelectLayout }: LayoutPaletteProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
        Layouts
      </h3>
      <p className="text-xs text-muted-foreground px-1 mb-3">
        Drag to canvas to add container
      </p>
      <div className="grid grid-cols-2 gap-2">
        {layoutOptions.map((layout) => (
          <DraggableLayoutItem key={layout.type} layout={layout} />
        ))}
      </div>
    </div>
  );
}
