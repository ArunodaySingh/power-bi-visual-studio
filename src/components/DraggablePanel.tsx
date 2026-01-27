import { useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Move, X, Maximize2, Plus, GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { VisualPreview } from "./VisualPreview";
import type { LayoutType } from "./LayoutPalette";
import type { CanvasVisualData } from "./CanvasVisual";

export interface PanelData {
  id: string;
  layoutType: LayoutType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  slots: PanelSlot[];
}

export interface PanelSlot {
  id: string;
  visualId?: string; // Reference to a visual placed in this slot
}

// Generate slots based on layout type
export function generateSlots(layoutType: LayoutType): PanelSlot[] {
  const slotCounts: Record<LayoutType, number> = {
    "single": 1,
    "two-columns": 2,
    "three-columns": 3,
    "two-rows": 2,
    "three-rows": 3,
    "left-sidebar": 2,
    "right-sidebar": 2,
    "grid-2x2": 4,
    "header-content": 2,
    "content-footer": 2,
  };

  const count = slotCounts[layoutType] || 1;
  return Array.from({ length: count }, () => ({
    id: crypto.randomUUID(),
    visualId: undefined,
  }));
}

// Get grid CSS for layout type
function getGridStyle(layoutType: LayoutType): React.CSSProperties {
  const styles: Record<LayoutType, React.CSSProperties> = {
    "single": { display: "grid", gridTemplateColumns: "1fr" },
    "two-columns": { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
    "three-columns": { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" },
    "two-rows": { display: "grid", gridTemplateRows: "1fr 1fr", gap: "8px" },
    "three-rows": { display: "grid", gridTemplateRows: "1fr 1fr 1fr", gap: "8px" },
    "left-sidebar": { display: "grid", gridTemplateColumns: "100px 1fr", gap: "8px" },
    "right-sidebar": { display: "grid", gridTemplateColumns: "1fr 100px", gap: "8px" },
    "grid-2x2": { display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: "8px" },
    "header-content": { display: "grid", gridTemplateRows: "60px 1fr", gap: "8px" },
    "content-footer": { display: "grid", gridTemplateRows: "1fr 60px", gap: "8px" },
  };
  return styles[layoutType] || styles.single;
}

interface PanelSlotDropZoneProps {
  slot: PanelSlot;
  panelId: string;
  visual?: CanvasVisualData;
  onRemoveVisual?: () => void;
  onSelectVisual?: () => void;
  isSelected?: boolean;
}

function PanelSlotDropZone({ 
  slot, 
  panelId, 
  visual, 
  onRemoveVisual,
  onSelectVisual,
  isSelected 
}: PanelSlotDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${panelId}-${slot.id}`,
    data: { type: "slot", panelId, slotId: slot.id },
  });

  const hasVisual = !!visual;

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        e.stopPropagation();
        if (hasVisual && onSelectVisual) {
          onSelectVisual();
        }
      }}
      className={cn(
        "relative min-h-[100px] rounded-lg border-2 transition-all overflow-hidden flex flex-col",
        isOver 
          ? "border-primary bg-primary/10 border-solid" 
          : hasVisual 
            ? "border-border bg-card"
            : "border-dashed border-muted-foreground/30 bg-muted/20 hover:border-muted-foreground/50",
        isSelected && hasVisual && "ring-2 ring-primary"
      )}
    >
      {hasVisual && visual ? (
        <div className="w-full h-full flex-1 relative group min-h-0 overflow-hidden">
          {/* Visual Preview */}
          <div className="w-full h-full p-3 overflow-hidden">
            <VisualPreview
              type={visual.type}
              data={visual.data}
              properties={visual.properties}
            />
          </div>
          
          {/* Remove button on hover */}
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveVisual?.();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div className="w-full h-full flex-1 flex items-center justify-center p-4">
          <div className="text-sm text-muted-foreground flex flex-col items-center gap-2">
            <Plus className="h-5 w-5" />
            <span>Drop chart</span>
          </div>
        </div>
      )}

      {/* Drop indicator overlay */}
      {isOver && !hasVisual && (
        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none">
          <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium">
            Release to add
          </div>
        </div>
      )}
    </div>
  );
}

interface DraggablePanelProps {
  panel: PanelData;
  isSelected: boolean;
  slotVisuals: Map<string, CanvasVisualData>; // Map of slotId -> visual
  selectedSlotVisualId?: string | null;
  onSelect: () => void;
  onUpdate: (updates: Partial<PanelData>) => void;
  onDelete: () => void;
  onRemoveVisualFromSlot: (slotId: string) => void;
  onSelectSlotVisual: (visualId: string) => void;
}

export function DraggablePanel({
  panel,
  isSelected,
  slotVisuals,
  selectedSlotVisualId,
  onSelect,
  onUpdate,
  onDelete,
  onRemoveVisualFromSlot,
  onSelectSlotVisual,
}: DraggablePanelProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `panel-${panel.id}`,
    data: { type: "panel", panel },
  });

  const [isResizing, setIsResizing] = useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    left: panel.position.x,
    top: panel.position.y,
    width: panel.size.width,
    height: panel.size.height,
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = panel.size.width;
    const startHeight = panel.size.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(200, startWidth + (moveEvent.clientX - startX));
      const newHeight = Math.max(150, startHeight + (moveEvent.clientY - startY));
      onUpdate({ size: { width: newWidth, height: newHeight } });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        "absolute bg-card/80 backdrop-blur-sm rounded-xl border-2 shadow-sm transition-all",
        isDragging && "shadow-xl ring-2 ring-primary/50 z-50",
        isSelected ? "border-primary z-40" : "border-border/50",
        isResizing && "select-none"
      )}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        {...attributes}
        className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium cursor-grab active:cursor-grabbing shadow-sm hover:bg-secondary/90 transition-colors z-10"
      >
        <GripVertical className="h-3 w-3" />
        <span className="capitalize">{panel.layoutType.replace("-", " ")}</span>
      </div>

      {/* Delete Button */}
      {isSelected && (
        <Button
          size="icon"
          variant="destructive"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-sm z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Panel Content with Slots */}
      <div className="p-4 h-full overflow-hidden" style={getGridStyle(panel.layoutType)}>
        {panel.slots.map((slot) => {
          const visual = slotVisuals.get(slot.id);
          return (
            <PanelSlotDropZone
              key={slot.id}
              slot={slot}
              panelId={panel.id}
              visual={visual}
              isSelected={visual?.id === selectedSlotVisualId}
              onRemoveVisual={() => onRemoveVisualFromSlot(slot.id)}
              onSelectVisual={() => {
                if (visual) onSelectSlotVisual(visual.id);
              }}
            />
          );
        })}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Maximize2 className="h-3 w-3 rotate-90" />
      </div>

      {/* Size indicator when resizing */}
      {isResizing && (
        <div className="absolute bottom-8 right-2 px-2 py-1 bg-foreground text-background text-xs rounded font-mono">
          {Math.round(panel.size.width)} × {Math.round(panel.size.height)}
        </div>
      )}
    </div>
  );
}
