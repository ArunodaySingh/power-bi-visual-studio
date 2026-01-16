import { useState, useRef } from "react";
import {
  DndContext,
  useDraggable,
  DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Move, Maximize2 } from "lucide-react";
import { VisualPreview } from "./VisualPreview";
import type { VisualType } from "./VisualTypeSelector";
import type { VisualProperties } from "./PropertyPanel";
import type { DataPoint } from "./DataEditor";

interface DraggableVisualProps {
  type: VisualType;
  data: DataPoint[];
  properties: VisualProperties;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

function DraggableVisualInner({
  type,
  data,
  properties,
  size,
  onResize,
}: DraggableVisualProps & { size: Size; onResize: (size: Size) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: "visual-preview",
  });

  const resizeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const style = {
    transform: CSS.Translate.toString(transform),
    width: size.width,
    height: size.height,
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(300, startWidth + (moveEvent.clientX - startX));
      const newHeight = Math.max(250, startHeight + (moveEvent.clientY - startY));
      onResize({ width: newWidth, height: newHeight });
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
      className={`relative bg-card rounded-xl border shadow-panel transition-shadow ${
        isDragging ? "shadow-xl ring-2 ring-primary/50 z-50" : ""
      } ${isResizing ? "select-none" : ""}`}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        {...attributes}
        className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-medium cursor-grab active:cursor-grabbing shadow-sm hover:bg-accent/90 transition-colors z-10"
      >
        <Move className="h-3 w-3" />
        <span>Drag to move</span>
      </div>

      {/* Visual Content */}
      <div className="p-6 h-full">
        <VisualPreview type={type} data={data} properties={properties} />
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
          {Math.round(size.width)} × {Math.round(size.height)}
        </div>
      )}
    </div>
  );
}

export function DraggableVisual({ type, data, properties }: DraggableVisualProps) {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [size, setSize] = useState<Size>({ width: 600, height: 400 });

  const handleDragEnd = (event: DragEndEvent) => {
    const { delta } = event;
    setPosition((prev) => ({
      x: prev.x + delta.x,
      y: prev.y + delta.y,
    }));
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div
        className="inline-block"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      >
        <DraggableVisualInner
          type={type}
          data={data}
          properties={properties}
          size={size}
          onResize={setSize}
        />
      </div>
    </DndContext>
  );
}
