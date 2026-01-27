import { useState, useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Move, Maximize2, X, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SlicerData } from "@/types/dashboard";

interface SlicerBaseProps {
  slicer: SlicerData;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<SlicerData>) => void;
  onDelete: () => void;
  onClear: () => void;
  children: React.ReactNode;
}

export function SlicerBase({
  slicer,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onClear,
  children,
}: SlicerBaseProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `slicer-${slicer.id}`,
    data: { type: "slicer", slicer },
  });

  const resizeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const style = {
    transform: CSS.Translate.toString(transform),
    left: slicer.position.x,
    top: slicer.position.y,
    width: slicer.size.width,
    minHeight: slicer.size.height,
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = slicer.size.width;
    const startHeight = slicer.size.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(180, startWidth + (moveEvent.clientX - startX));
      const newHeight = Math.max(100, startHeight + (moveEvent.clientY - startY));
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

  const hasSelection = slicer.selectedValues.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        "absolute bg-card rounded-lg border shadow-sm transition-all",
        isDragging && "shadow-xl ring-2 ring-primary/50 z-50",
        isSelected && "ring-2 ring-primary z-40",
        isResizing && "select-none"
      )}
    >
      {/* Header with Drag Handle */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 rounded-t-lg">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded"
          >
            <Move className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium truncate">
            {slicer.title || slicer.fieldLabel}
          </span>
          {hasSelection && (
            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium flex-shrink-0">
              {slicer.selectedValues.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {hasSelection && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              title="Clear selection"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
          {isSelected && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Slicer Content */}
      <div className="p-2">{children}</div>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Maximize2 className="h-2.5 w-2.5 rotate-90" />
      </div>
    </div>
  );
}
