import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { DraggablePanel, type PanelData } from "./DraggablePanel";
import { CanvasVisual, type CanvasVisualData } from "./CanvasVisual";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface PanelCanvasProps {
  panels: PanelData[];
  visuals: CanvasVisualData[];
  selectedPanelId: string | null;
  selectedVisualId: string | null;
  isLayoutDragging?: boolean;
  isFieldDragging?: boolean;
  onSelectPanel: (id: string | null) => void;
  onSelectVisual: (id: string | null) => void;
  onUpdatePanel: (id: string, updates: Partial<PanelData>) => void;
  onDeletePanel: (id: string) => void;
  onUpdateVisual: (id: string, updates: Partial<CanvasVisualData>) => void;
  onDeleteVisual: (id: string) => void;
  onDuplicateVisual: (id: string) => void;
  onAddPanel?: () => void;
}

export function PanelCanvas({
  panels,
  visuals,
  selectedPanelId,
  selectedVisualId,
  isLayoutDragging,
  isFieldDragging,
  onSelectPanel,
  onSelectVisual,
  onUpdatePanel,
  onDeletePanel,
  onUpdateVisual,
  onDeleteVisual,
  onDuplicateVisual,
  onAddPanel,
}: PanelCanvasProps) {
  // Main canvas drop zone for new panels
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-drop",
    data: { type: "canvas" },
  });

  const handleCanvasClick = () => {
    onSelectPanel(null);
    onSelectVisual(null);
  };

  // Get visual by ID for rendering in slots
  const getVisualById = (id: string) => visuals.find((v) => v.id === id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative w-full h-full min-h-[600px] min-w-[800px] transition-colors",
        isLayoutDragging && "bg-primary/5",
        isOver && isLayoutDragging && "bg-primary/10 ring-2 ring-inset ring-primary/30 ring-dashed"
      )}
      onClick={handleCanvasClick}
    >
      {/* Render Panels */}
      {panels.map((panel) => (
        <DraggablePanel
          key={panel.id}
          panel={panel}
          isSelected={selectedPanelId === panel.id}
          onSelect={() => {
            onSelectPanel(panel.id);
            onSelectVisual(null);
          }}
          onUpdate={(updates) => onUpdatePanel(panel.id, updates)}
          onDelete={() => onDeletePanel(panel.id)}
          renderSlotContent={(slot) => {
            if (slot.visualId) {
              const visual = getVisualById(slot.visualId);
              if (visual) {
                // Render a mini preview of the visual
                return (
                  <div className="w-full h-full p-2 text-xs text-center flex items-center justify-center">
                    <span className="text-muted-foreground">{visual.properties.title}</span>
                  </div>
                );
              }
            }
            return null;
          }}
        />
      ))}

      {/* Render standalone visuals (not in panels) */}
      {visuals.map((visual) => (
        <CanvasVisual
          key={visual.id}
          visual={visual}
          isSelected={selectedVisualId === visual.id}
          isFieldDragging={isFieldDragging}
          onSelect={() => {
            onSelectVisual(visual.id);
            onSelectPanel(null);
          }}
          onUpdate={(updates) => onUpdateVisual(visual.id, updates)}
          onDelete={() => onDeleteVisual(visual.id)}
          onDuplicate={() => onDuplicateVisual(visual.id)}
        />
      ))}

      {/* Drop indicator when dragging layout */}
      {isLayoutDragging && (
        <div className="absolute inset-4 border-2 border-dashed border-primary/40 rounded-xl flex items-center justify-center pointer-events-none">
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium">
            Drop layout here to add container
          </div>
        </div>
      )}

      {/* Empty state */}
      {panels.length === 0 && visuals.length === 0 && !isLayoutDragging && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Start Building</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Drag a layout from the left panel to create your dashboard structure, 
                then add charts and data.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
