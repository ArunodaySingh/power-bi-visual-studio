import { useState, useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Move, Maximize2, X, Type, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TextContainerData {
  id: string;
  type: "text" | "logo";
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  textAlign?: "left" | "center" | "right";
  snapToTop?: boolean;
  matchWidth?: boolean;
}

interface TextContainerProps {
  container: TextContainerData;
  isSelected: boolean;
  canvasWidth?: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextContainerData>) => void;
  onDelete: () => void;
}

export function TextContainer({
  container,
  isSelected,
  canvasWidth = 800,
  onSelect,
  onUpdate,
  onDelete,
}: TextContainerProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `text-${container.id}`,
    data: { type: "text-container", container },
  });

  const resizeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Apply snap-to-top and match-width settings
  const computedPosition = {
    x: container.matchWidth ? 0 : container.position.x,
    y: container.snapToTop ? 0 : container.position.y,
  };

  const computedWidth = container.matchWidth ? canvasWidth : container.size.width;

  const style = {
    transform: CSS.Translate.toString(transform),
    left: computedPosition.x,
    top: computedPosition.y,
    width: computedWidth,
    minHeight: container.size.height,
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (container.matchWidth) return; // Don't allow resize if matching width
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = container.size.width;
    const startHeight = container.size.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(100, startWidth + (moveEvent.clientX - startX));
      const newHeight = Math.max(40, startHeight + (moveEvent.clientY - startY));
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

  const handleDoubleClick = () => {
    if (container.type === "text") {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "absolute bg-background rounded-lg border shadow-sm transition-all",
        isDragging && "shadow-xl ring-2 ring-primary/50 z-50",
        isSelected && "ring-2 ring-primary z-40",
        isResizing && "select-none"
      )}
    >
      {/* Header with Drag Handle */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 rounded-t-lg overflow-hidden">
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
          <div
            {...listeners}
            {...attributes}
            className={cn(
              "cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded flex-shrink-0",
              (container.snapToTop || container.matchWidth) && "opacity-50"
            )}
          >
            <Move className="h-4 w-4 text-muted-foreground" />
          </div>
          {container.type === "text" ? (
            <Type className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <Image className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <span className="text-sm font-medium truncate flex-1 min-w-0">
            {container.type === "text" ? "Text Header" : "Logo"}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
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

      {/* Content */}
      <div 
        className="p-4 overflow-hidden flex items-center justify-center"
        style={{ 
          textAlign: container.textAlign || "center",
          minHeight: container.size.height - 50,
        }}
      >
        {container.type === "text" ? (
          isEditing ? (
            <Input
              value={container.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="text-center border-none bg-transparent focus-visible:ring-0"
              style={{
                fontSize: container.fontSize || 24,
                fontWeight: container.fontWeight || "bold",
              }}
            />
          ) : (
            <h1
              className="w-full cursor-text"
              style={{
                fontSize: container.fontSize || 24,
                fontWeight: container.fontWeight || "bold",
                textAlign: container.textAlign || "center",
              }}
            >
              {container.content || "Double-click to edit"}
            </h1>
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            {container.content ? (
              <img 
                src={container.content} 
                alt="Logo" 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-muted-foreground text-sm">
                Add logo URL in settings
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resize Handle */}
      {!container.matchWidth && (
        <div
          ref={resizeRef}
          onMouseDown={handleResizeStart}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Maximize2 className="h-2.5 w-2.5 rotate-90" />
        </div>
      )}
    </div>
  );
}
