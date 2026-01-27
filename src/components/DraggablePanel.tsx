import { useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Move, X, Maximize2, Plus, GripVertical, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import type { LayoutType } from "./LayoutPalette";

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
    "left-sidebar": { display: "grid", gridTemplateColumns: "120px 1fr", gap: "8px" },
    "right-sidebar": { display: "grid", gridTemplateColumns: "1fr 120px", gap: "8px" },
    "grid-2x2": { display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: "8px" },
    "header-content": { display: "grid", gridTemplateRows: "80px 1fr", gap: "8px" },
    "content-footer": { display: "grid", gridTemplateRows: "1fr 80px", gap: "8px" },
  };
  return styles[layoutType] || styles.single;
}

interface PanelSlotDropZoneProps {
  slot: PanelSlot;
  panelId: string;
  index: number;
  children?: React.ReactNode;
}

function PanelSlotDropZone({ slot, panelId, index, children }: PanelSlotDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${panelId}-${slot.id}`,
    data: { type: "slot", panelId, slotId: slot.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[60px] rounded-md border-2 border-dashed transition-all flex items-center justify-center",
        isOver 
          ? "border-primary bg-primary/10" 
          : "border-muted-foreground/20 bg-muted/30 hover:border-muted-foreground/40",
        slot.visualId && "border-solid border-border bg-card"
      )}
    >
      {children || (
        <div className="text-xs text-muted-foreground flex flex-col items-center gap-1">
          <Plus className="h-4 w-4" />
          <span>Drop chart here</span>
        </div>
      )}
    </div>
  );
}

interface DraggablePanelProps {
  panel: PanelData;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<PanelData>) => void;
  onDelete: () => void;
  renderSlotContent?: (slot: PanelSlot) => React.ReactNode;
}

export function DraggablePanel({
  panel,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  renderSlotContent,
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
        "absolute bg-card/50 backdrop-blur-sm rounded-xl border-2 shadow-sm transition-all",
        isDragging && "shadow-xl ring-2 ring-primary/50 z-50",
        isSelected ? "border-primary ring-1 ring-primary/20 z-40" : "border-border/50",
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
      <div className="p-3 h-full" style={getGridStyle(panel.layoutType)}>
        {panel.slots.map((slot, index) => (
          <PanelSlotDropZone
            key={slot.id}
            slot={slot}
            panelId={panel.id}
            index={index}
          >
            {renderSlotContent?.(slot)}
          </PanelSlotDropZone>
        ))}
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
