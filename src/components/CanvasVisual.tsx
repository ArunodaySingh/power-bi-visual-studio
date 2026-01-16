import { useState, useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Move, Maximize2, X, Copy } from "lucide-react";
import { VisualPreview } from "./VisualPreview";
import type { VisualType } from "./VisualTypeSelector";
import type { VisualProperties } from "./PropertyPanel";
import type { DataPoint } from "./DataEditor";
import { Button } from "./ui/button";

export interface CanvasVisualData {
  id: string;
  type: VisualType;
  data: DataPoint[];
  properties: VisualProperties;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface CanvasVisualProps {
  visual: CanvasVisualData;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CanvasVisualData>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function CanvasVisual({
  visual,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
}: CanvasVisualProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: visual.id,
  });

  const resizeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const style = {
    transform: CSS.Translate.toString(transform),
    left: visual.position.x,
    top: visual.position.y,
    width: visual.size.width,
    height: visual.size.height,
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = visual.size.width;
    const startHeight = visual.size.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(300, startWidth + (moveEvent.clientX - startX));
      const newHeight = Math.max(250, startHeight + (moveEvent.clientY - startY));
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
      className={`absolute bg-card rounded-xl border shadow-panel transition-shadow ${
        isDragging ? "shadow-xl ring-2 ring-primary/50 z-50" : ""
      } ${isSelected ? "ring-2 ring-primary z-40" : ""} ${isResizing ? "select-none" : ""}`}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        {...attributes}
        className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-medium cursor-grab active:cursor-grabbing shadow-sm hover:bg-accent/90 transition-colors z-10"
      >
        <Move className="h-3 w-3" />
        <span>Drag</span>
      </div>

      {/* Action Buttons - visible when selected */}
      {isSelected && (
        <div className="absolute -top-3 right-2 flex items-center gap-1 z-10">
          <Button
            size="icon"
            variant="secondary"
            className="h-6 w-6 rounded-full shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-6 w-6 rounded-full shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Visual Content */}
      <div className="p-6 h-full">
        <VisualPreview type={visual.type} data={visual.data} properties={visual.properties} />
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Maximize2 className="h-3 w-3 rotate-90" />
      </div>

      {/* Size indicator when resizing */}
      {isResizing && (
        <div className="absolute bottom-8 right-2 px-2 py-1 bg-foreground text-background text-xs rounded font-mono">
          {Math.round(visual.size.width)} × {Math.round(visual.size.height)}
        </div>
      )}

      {/* Type indicator */}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded">
        {visual.type}
      </div>
    </div>
  );
}
