import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface VisualDropZoneProps {
  visualId: string;
  isOver: boolean;
  children: React.ReactNode;
}

export function VisualDropZone({ visualId, isOver, children }: VisualDropZoneProps) {
  const { setNodeRef, isOver: droppableIsOver } = useDroppable({
    id: `visual-drop-${visualId}`,
    data: { visualId },
  });

  const showDropIndicator = isOver || droppableIsOver;

  return (
    <div ref={setNodeRef} className="relative w-full h-full">
      {children}
      {showDropIndicator && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center pointer-events-none z-10">
          <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            Drop to add field
          </div>
        </div>
      )}
    </div>
  );
}
