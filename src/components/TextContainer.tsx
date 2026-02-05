import { useState, useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Move, Maximize2, X, Type, Image, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TextContainerData {
  id: string;
  type: "header"; // Combined type - header with optional logo
  content: string; // Text content
  logoUrl?: string; // Optional logo image URL
  logoPosition?: "left" | "right"; // Logo position relative to text
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
   isPreview?: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextContainerData>) => void;
  onDelete: () => void;
}

export function TextContainer({
  container,
  isSelected,
  canvasWidth = 800,
   isPreview = false,
  onSelect,
  onUpdate,
  onDelete,
}: TextContainerProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `text-${container.id}`,
    data: { type: "text-container", container },
     disabled: isPreview || container.snapToTop || container.matchWidth,
  });

  const resizeRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if (container.matchWidth) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = container.size.width;
    const startHeight = container.size.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(200, startWidth + (moveEvent.clientX - startX));
      const newHeight = Math.max(60, startHeight + (moveEvent.clientY - startY));
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

  const handleDoubleClick = (e: React.MouseEvent) => {
    // Only enable editing when clicking on text area
    const target = e.target as HTMLElement;
    if (!target.closest('.logo-area')) {
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onUpdate({ logoUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const logoPosition = container.logoPosition || "left";

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
         if (!isPreview) onSelect();
      }}
       onDoubleClick={isPreview ? undefined : handleDoubleClick}
      className={cn(
        "absolute bg-background rounded-lg border shadow-sm transition-all",
         !isPreview && isDragging && "shadow-xl ring-2 ring-primary/50 z-50",
         !isPreview && isSelected && "ring-2 ring-primary z-40",
         !isPreview && isResizing && "select-none"
      )}
    >
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Header with Drag Handle */}
       {!isPreview && (
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
          <Type className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium truncate flex-1 min-w-0">
            Header
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
       )}

      {/* Content - Logo + Text */}
      <div 
        className={cn(
          "p-4 overflow-hidden flex items-center gap-4",
          logoPosition === "right" ? "flex-row-reverse" : "flex-row"
        )}
        style={{ 
          minHeight: container.size.height - 50,
        }}
      >
        {/* Logo Area */}
        <div 
          className="logo-area flex-shrink-0 cursor-pointer group"
          onClick={handleLogoClick}
        >
          {container.logoUrl ? (
            <div className="relative">
              <img 
                src={container.logoUrl} 
                alt="Logo" 
                className="h-12 w-auto max-w-[120px] object-contain"
              />
              {isSelected && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                  <Upload className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ) : (
            <div className={cn(
              "h-12 w-12 border-2 border-dashed border-muted-foreground/30 rounded-lg",
              "flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
            )}>
              <Image className="h-5 w-5 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Text Area */}
        <div 
          className="flex-1 min-w-0"
          style={{ textAlign: container.textAlign || "left" }}
        >
          {isEditing ? (
            <Input
              value={container.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="border-none bg-transparent focus-visible:ring-0 p-0"
              style={{
                fontSize: container.fontSize || 24,
                fontWeight: container.fontWeight || "bold",
                textAlign: container.textAlign || "left",
              }}
            />
          ) : (
            <h1
              className="w-full cursor-text truncate"
              style={{
                fontSize: container.fontSize || 24,
                fontWeight: container.fontWeight || "bold",
              }}
            >
              {container.content || "Double-click to edit"}
            </h1>
          )}
        </div>
      </div>

      {/* Resize Handle */}
       {!isPreview && !container.matchWidth && (
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
