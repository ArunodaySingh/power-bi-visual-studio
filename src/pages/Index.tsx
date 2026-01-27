import { useState, useCallback } from "react";
import { Database, Settings, LayoutGrid, Hash, Type } from "lucide-react";
import { DndContext, DragEndEvent, DragStartEvent, useSensor, useSensors, PointerSensor, DragOverlay } from "@dnd-kit/core";
import { VisualizationSelector, type VisualizationType } from "@/components/VisualizationSelector";
import { VisualTypeSelector, type VisualType } from "@/components/VisualTypeSelector";
import { PropertyPanel, type VisualProperties } from "@/components/PropertyPanel";
import { DataEditor, type DataPoint } from "@/components/DataEditor";
import { VisualCanvas } from "@/components/VisualCanvas";
import { CodeExport } from "@/components/CodeExport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SheetTabs } from "@/components/SheetTabs";
import { DataFieldsPanel, metaAdsDataTables, type DataField, type DataTable } from "@/components/DataFieldsPanel";
import { ComponentPalette } from "@/components/ComponentPalette";
import type { CanvasVisualData } from "@/components/CanvasVisual";
import { metaAdsRawData } from "@/data/metaAdsData";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface SheetData {
  id: string;
  name: string;
  visuals: CanvasVisualData[];
}

const createDefaultData = (): DataPoint[] => [
  { id: crypto.randomUUID(), category: "Category 1", value: 0 },
  { id: crypto.randomUUID(), category: "Category 2", value: 0 },
  { id: crypto.randomUUID(), category: "Category 3", value: 0 },
];

const createDefaultProperties = (): VisualProperties => ({
  title: "New Visual",
  showTitle: true,
  showLegend: false,
  showDataLabels: true,
  primaryColor: "#0ea5e9",
  backgroundColor: "#ffffff",
  fontSize: 14,
  borderRadius: 8,
  animationDuration: 500,
});

const createNewVisual = (index: number, type: VisualType = "bar"): CanvasVisualData => ({
  id: crypto.randomUUID(),
  type,
  data: createDefaultData(),
  properties: {
    ...createDefaultProperties(),
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
  },
  position: { x: 50 + (index % 3) * 350, y: 50 + Math.floor(index / 3) * 280 },
  size: { width: 400, height: 300 },
});

const createEmptySheet = (name: string): SheetData => ({
  id: crypto.randomUUID(),
  name,
  visuals: [],
});

export default function Index() {
  const [sheets, setSheets] = useState<SheetData[]>([
    createEmptySheet("Meta Ads"),
    createEmptySheet("GA"),
    createEmptySheet("DV360"),
  ]);
  const [activeSheetId, setActiveSheetId] = useState(sheets[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFieldDragging, setIsFieldDragging] = useState(false);
  const [draggingField, setDraggingField] = useState<DataField | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(true);

  const activeSheet = sheets.find((s) => s.id === activeSheetId);
  const visuals = activeSheet?.visuals || [];
  const selectedVisual = visuals.find((v) => v.id === selectedId);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Sheet handlers
  const handleSelectSheet = useCallback((id: string) => {
    setActiveSheetId(id);
    const sheet = sheets.find((s) => s.id === id);
    setSelectedId(sheet?.visuals[0]?.id || null);
  }, [sheets]);

  const handleAddSheet = useCallback(() => {
    const newSheet = createEmptySheet(`Sheet ${sheets.length + 1}`);
    setSheets((prev) => [...prev, newSheet]);
    setActiveSheetId(newSheet.id);
    setSelectedId(null);
  }, [sheets.length]);

  const handleDeleteSheet = useCallback((id: string) => {
    if (sheets.length <= 1) return;
    setSheets((prev) => prev.filter((s) => s.id !== id));
    if (activeSheetId === id) {
      const remaining = sheets.filter((s) => s.id !== id);
      setActiveSheetId(remaining[0].id);
      setSelectedId(remaining[0].visuals[0]?.id || null);
    }
  }, [sheets, activeSheetId]);

  const handleRenameSheet = useCallback((id: string, name: string) => {
    setSheets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    );
  }, []);

  // Visual handlers
  const handleAddVisual = useCallback((type?: VisualizationType) => {
    const visualType = (type || "bar") as VisualType;
    const newVisual = createNewVisual(visuals.length, visualType);
    setSheets((prev) =>
      prev.map((s) =>
        s.id === activeSheetId ? { ...s, visuals: [...s.visuals, newVisual] } : s
      )
    );
    setSelectedId(newVisual.id);
    toast.success(`Added ${visualType} chart to canvas`);
  }, [visuals.length, activeSheetId]);

  const handleUpdateVisual = useCallback((id: string, updates: Partial<CanvasVisualData>) => {
    setSheets((prev) =>
      prev.map((s) =>
        s.id === activeSheetId
          ? { ...s, visuals: s.visuals.map((v) => (v.id === id ? { ...v, ...updates } : v)) }
          : s
      )
    );
  }, [activeSheetId]);

  const handleDeleteVisual = useCallback((id: string) => {
    setSheets((prev) =>
      prev.map((s) =>
        s.id === activeSheetId ? { ...s, visuals: s.visuals.filter((v) => v.id !== id) } : s
      )
    );
    setSelectedId((prevId) => (prevId === id ? null : prevId));
  }, [activeSheetId]);

  const handleDuplicateVisual = useCallback((id: string) => {
    const visual = visuals.find((v) => v.id === id);
    if (visual) {
      const duplicate: CanvasVisualData = {
        ...visual,
        id: crypto.randomUUID(),
        position: { x: visual.position.x + 30, y: visual.position.y + 30 },
        data: visual.data.map((d) => ({ ...d, id: crypto.randomUUID() })),
      };
      setSheets((prev) =>
        prev.map((s) =>
          s.id === activeSheetId ? { ...s, visuals: [...s.visuals, duplicate] } : s
        )
      );
      setSelectedId(duplicate.id);
    }
  }, [visuals, activeSheetId]);

  // Handlers for updating selected visual
  const handleTypeChange = (type: VisualType) => {
    if (selectedId) handleUpdateVisual(selectedId, { type });
  };

  const handleDataChange = (data: DataPoint[]) => {
    if (selectedId) handleUpdateVisual(selectedId, { data });
  };

  const handlePropertiesChange = (properties: VisualProperties) => {
    if (selectedId) handleUpdateVisual(selectedId, { properties });
  };

  // Handle field dropped onto visual
  const handleFieldDropped = useCallback((visualId: string, field: DataField) => {
    const newData: DataPoint[] = metaAdsRawData.map((campaign) => {
      let value = 0;
      const fieldKey = field.id as keyof typeof campaign;
      
      if (fieldKey in campaign) {
        const rawValue = campaign[fieldKey];
        value = typeof rawValue === "number" ? rawValue : 0;
      }

      return {
        id: crypto.randomUUID(),
        category: campaign.campaignName.slice(0, 20),
        value: Math.round(value * 100) / 100,
      };
    });

    handleUpdateVisual(visualId, {
      data: newData,
      properties: {
        ...visuals.find((v) => v.id === visualId)?.properties!,
        title: field.name + " by Campaign",
      },
    });

    toast.success(`Added "${field.name}" to visual`);
  }, [handleUpdateVisual, visuals]);

  // Get data tables for current sheet
  const getCurrentDataTables = (): DataTable[] => {
    if (activeSheet?.name === "Meta Ads") {
      return metaAdsDataTables;
    }
    return [];
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;
    
    if (id.startsWith("field-")) {
      setIsFieldDragging(true);
      const fieldData = active.data.current?.field as DataField | undefined;
      if (fieldData) {
        setDraggingField(fieldData);
      }
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    const activeId = active.id as string;
    
    setIsFieldDragging(false);
    setDraggingField(null);

    if (activeId.startsWith("field-") && over) {
      const overId = over.id as string;
      if (overId.startsWith("drop-")) {
        const visualId = overId.replace("drop-", "");
        const fieldData = active.data.current?.field as DataField | undefined;
        if (fieldData) {
          handleFieldDropped(visualId, fieldData);
        }
      }
      return;
    }

    const visual = visuals.find((v) => v.id === activeId);
    if (visual) {
      handleUpdateVisual(activeId, {
        position: {
          x: visual.position.x + delta.x,
          y: visual.position.y + delta.y,
        },
      });
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-background">
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Component Palette */}
          <aside className="w-64 border-r bg-card flex flex-col overflow-hidden">
            <ComponentPalette onAddVisual={handleAddVisual} />
          </aside>

          {/* Main Canvas Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Canvas Toolbar */}
            <div className="h-12 border-b bg-card px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Canvas</span>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">
                  {visuals.length} visual{visuals.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedVisual && (
                  <CodeExport
                    type={selectedVisual.type}
                    data={selectedVisual.data}
                    properties={selectedVisual.properties}
                  />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfigPanel(!showConfigPanel)}
                >
                  {showConfigPanel ? "Hide Panel" : "Show Panel"}
                </Button>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 p-4 bg-muted/30 canvas-grid overflow-auto">
              <VisualCanvas
                visuals={visuals}
                selectedId={selectedId}
                isFieldDragging={isFieldDragging}
                onSelectVisual={setSelectedId}
                onUpdateVisual={handleUpdateVisual}
                onDeleteVisual={handleDeleteVisual}
                onDuplicateVisual={handleDuplicateVisual}
                onAddVisual={() => handleAddVisual()}
              />
            </div>

            {/* Sheet Tabs */}
            <SheetTabs
              sheets={sheets.map((s) => ({ id: s.id, name: s.name }))}
              activeSheetId={activeSheetId}
              onSelectSheet={handleSelectSheet}
              onAddSheet={handleAddSheet}
              onDeleteSheet={handleDeleteSheet}
              onRenameSheet={handleRenameSheet}
            />
          </main>

          {/* Right Sidebar - Data Fields & Config */}
          {showConfigPanel && (
            <aside className="w-72 border-l bg-card flex flex-col overflow-hidden">
              <Tabs defaultValue="fields" className="flex-1 flex flex-col">
                <TabsList className="mx-4 mt-4 grid grid-cols-3">
                  <TabsTrigger value="fields" className="gap-1.5 text-xs">
                    <Database className="h-3.5 w-3.5" />
                    Fields
                  </TabsTrigger>
                  <TabsTrigger value="visual" className="gap-1.5 text-xs">
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Visual
                  </TabsTrigger>
                  <TabsTrigger value="format" className="gap-1.5 text-xs">
                    <Settings className="h-3.5 w-3.5" />
                    Format
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="fields" className="flex-1 overflow-hidden m-0">
                  <DataFieldsPanel tables={getCurrentDataTables()} />
                </TabsContent>

                <TabsContent value="visual" className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {selectedVisual ? (
                      <>
                        <div>
                          <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                            Chart Type
                          </h3>
                          <VisualTypeSelector selected={selectedVisual.type} onSelect={handleTypeChange} />
                        </div>
                        <div>
                          <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                            Data
                          </h3>
                          <DataEditor data={selectedVisual.data} onChange={handleDataChange} />
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-8">
                        Select a visual on the canvas to edit
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="format" className="flex-1 overflow-hidden m-0">
                  {selectedVisual ? (
                    <PropertyPanel properties={selectedVisual.properties} onChange={handlePropertiesChange} />
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-8 px-4">
                      Select a visual on the canvas to edit
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </aside>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggingField && (
          <div className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg shadow-lg text-sm font-medium">
            {draggingField.type === "metric" ? (
              <Hash className="h-4 w-4 text-primary" />
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
