import { Plus } from "lucide-react";
import { CanvasVisual, type CanvasVisualData } from "./CanvasVisual";
import { Button } from "./ui/button";

interface VisualCanvasProps {
  visuals: CanvasVisualData[];
  selectedId: string | null;
  isFieldDragging?: boolean;
  onSelectVisual: (id: string | null) => void;
  onUpdateVisual: (id: string, updates: Partial<CanvasVisualData>) => void;
  onDeleteVisual: (id: string) => void;
  onDuplicateVisual: (id: string) => void;
  onAddVisual: () => void;
}

export function VisualCanvas({
  visuals,
  selectedId,
  isFieldDragging,
  onSelectVisual,
  onUpdateVisual,
  onDeleteVisual,
  onDuplicateVisual,
  onAddVisual,
}: VisualCanvasProps) {
  return (
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
  );
}