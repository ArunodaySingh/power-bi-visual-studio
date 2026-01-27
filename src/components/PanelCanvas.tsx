import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { DraggablePanel, type PanelData } from "./DraggablePanel";
import { CanvasVisual, type CanvasVisualData } from "./CanvasVisual";
import { cn } from "@/lib/utils";

interface PanelCanvasProps {
  panels: PanelData[];
  visuals: CanvasVisualData[];
  slotVisuals: Map<string, CanvasVisualData>;
  selectedPanelId: string | null;
  selectedVisualId: string | null;
  isLayoutDragging?: boolean;
  isFieldDragging?: boolean;
  crossFilterVisualId?: string | null;
  highlightedValue?: string | string[] | null;
  onSelectPanel: (id: string | null) => void;
  onSelectVisual: (id: string | null) => void;
  onUpdatePanel: (id: string, updates: Partial<PanelData>) => void;
  onDeletePanel: (id: string) => void;
  onUpdateVisual: (id: string, updates: Partial<CanvasVisualData>) => void;
  onDeleteVisual: (id: string) => void;
  onDuplicateVisual: (id: string) => void;
  onRemoveVisualFromSlot: (panelId: string, slotId: string) => void;
  onDataClick?: (visualId: string, dimension: string, value: string) => void;
}

export function PanelCanvas({
  panels,
  visuals,
  slotVisuals,
  selectedPanelId,
  selectedVisualId,
  isLayoutDragging,
  isFieldDragging,
  crossFilterVisualId,
  highlightedValue,
  onSelectPanel,
  onSelectVisual,
  onUpdatePanel,
  onDeletePanel,
  onUpdateVisual,
  onDeleteVisual,
  onDuplicateVisual,
  onRemoveVisualFromSlot,
  onDataClick,
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

  // Build slot visuals map for each panel
  const getPanelSlotVisuals = (panel: PanelData): Map<string, CanvasVisualData> => {
    const map = new Map<string, CanvasVisualData>();
    panel.slots.forEach((slot) => {
      const visual = slotVisuals.get(slot.id);
      if (visual) {
        map.set(slot.id, visual);
      }
    });
    return map;
  };

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
          slotVisuals={getPanelSlotVisuals(panel)}
          selectedSlotVisualId={selectedVisualId}
          onSelect={() => {
            onSelectPanel(panel.id);
            onSelectVisual(null);
          }}
          onUpdate={(updates) => onUpdatePanel(panel.id, updates)}
          onDelete={() => onDeletePanel(panel.id)}
          onRemoveVisualFromSlot={(slotId) => onRemoveVisualFromSlot(panel.id, slotId)}
          onSelectSlotVisual={(visualId) => {
            onSelectVisual(visualId);
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
          isCrossFiltered={crossFilterVisualId !== null && crossFilterVisualId !== visual.id}
          highlightedValue={crossFilterVisualId === visual.id ? null : highlightedValue}
          onSelect={() => {
            onSelectVisual(visual.id);
            onSelectPanel(null);
          }}
          onUpdate={(updates) => onUpdateVisual(visual.id, updates)}
          onDelete={() => onDeleteVisual(visual.id)}
          onDuplicate={() => onDuplicateVisual(visual.id)}
          onDataClick={onDataClick ? (dimension, value) => onDataClick(visual.id, dimension, value) : undefined}
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
