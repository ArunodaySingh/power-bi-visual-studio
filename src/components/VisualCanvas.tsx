import { DndContext, DragEndEvent, DragStartEvent, useSensor, useSensors, PointerSensor, DragOverlay } from "@dnd-kit/core";
import { Plus, Hash, Type } from "lucide-react";
import { useState } from "react";
import { CanvasVisual, type CanvasVisualData } from "./CanvasVisual";
import { Button } from "./ui/button";
import type { DataField } from "./DataFieldsPanel";

interface VisualCanvasProps {
  visuals: CanvasVisualData[];
  selectedId: string | null;
  onSelectVisual: (id: string | null) => void;
  onUpdateVisual: (id: string, updates: Partial<CanvasVisualData>) => void;
  onDeleteVisual: (id: string) => void;
  onDuplicateVisual: (id: string) => void;
  onAddVisual: () => void;
  onFieldDropped?: (visualId: string, field: DataField) => void;
}

export function VisualCanvas({
  visuals,
  selectedId,
  onSelectVisual,
  onUpdateVisual,
  onDeleteVisual,
  onDuplicateVisual,
  onAddVisual,
  onFieldDropped,
}: VisualCanvasProps) {
  const [isFieldDragging, setIsFieldDragging] = useState(false);
  const [draggingField, setDraggingField] = useState<DataField | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;
    
    // Check if this is a field being dragged
    if (id.startsWith("field-")) {
      setIsFieldDragging(true);
      const fieldData = active.data.current?.field as DataField | undefined;
      if (fieldData) {
        setDraggingField(fieldData);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    const activeId = active.id as string;
    
    // Reset field dragging state
    setIsFieldDragging(false);
    setDraggingField(null);

    // Handle field drop onto visual
    if (activeId.startsWith("field-") && over) {
      const overId = over.id as string;
      if (overId.startsWith("drop-")) {
        const visualId = overId.replace("drop-", "");
        const fieldData = active.data.current?.field as DataField | undefined;
        if (fieldData && onFieldDropped) {
          onFieldDropped(visualId, fieldData);
        }
      }
      return;
    }

    // Handle visual drag
    const visual = visuals.find((v) => v.id === activeId);
    if (visual) {
      onUpdateVisual(activeId, {
        position: {
          x: visual.position.x + delta.x,
          y: visual.position.y + delta.y,
        },
      });
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        className="relative w-full h-full min-h-[600px] min-w-[800px]"
        onClick={() => onSelectVisual(null)}
      >
        {visuals.map((visual) => (
          <CanvasVisual
            key={visual.id}
            visual={visual}
            isSelected={selectedId === visual.id}
            isFieldDragging={isFieldDragging}
            onSelect={() => onSelectVisual(visual.id)}
            onUpdate={(updates) => onUpdateVisual(visual.id, updates)}
            onDelete={() => onDeleteVisual(visual.id)}
            onDuplicate={() => onDuplicateVisual(visual.id)}
          />
        ))}

        {/* Add Visual Button */}
        <Button
          variant="outline"
          size="lg"
          className="absolute bottom-4 right-4 gap-2 shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            onAddVisual();
          }}
        >
          <Plus className="h-4 w-4" />
          Add Visual
        </Button>

        {/* Empty state */}
        {visuals.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-muted-foreground text-lg">No visuals on canvas</div>
              <Button onClick={onAddVisual} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Visual
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Drag Overlay for fields */}
      <DragOverlay>
        {draggingField && (
          <div className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg shadow-lg text-sm font-medium">
            {draggingField.type === "metric" ? (
              <Hash className="h-4 w-4 text-blue-500" />
            ) : (
              <Type className="h-4 w-4 text-amber-500" />
            )}
            {draggingField.name}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}