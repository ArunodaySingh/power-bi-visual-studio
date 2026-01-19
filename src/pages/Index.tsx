import { useState, useCallback } from "react";
import { Database, Settings, LayoutGrid, Hash, Type } from "lucide-react";
import { DndContext, DragEndEvent, DragStartEvent, useSensor, useSensors, PointerSensor, DragOverlay } from "@dnd-kit/core";
import { Header } from "@/components/Header";
import { VisualTypeSelector, type VisualType } from "@/components/VisualTypeSelector";
import { PropertyPanel, type VisualProperties } from "@/components/PropertyPanel";
import { DataEditor, type DataPoint } from "@/components/DataEditor";
import { VisualCanvas } from "@/components/VisualCanvas";
import { CodeExport } from "@/components/CodeExport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SheetTabs, type Sheet } from "@/components/SheetTabs";
import { DataFieldsPanel, metaAdsDataTables, type DataField, type DataTable } from "@/components/DataFieldsPanel";
import type { CanvasVisualData } from "@/components/CanvasVisual";
import { createMetaAdsVisuals, metaAdsRawData } from "@/data/metaAdsData";
import { toast } from "sonner";

interface SheetData {
  id: string;
  name: string;
  visuals: CanvasVisualData[];
}

const createDefaultData = (): DataPoint[] => [
  { id: crypto.randomUUID(), category: "Q1 Sales", value: 85 },
  { id: crypto.randomUUID(), category: "Q2 Sales", value: 120 },
  { id: crypto.randomUUID(), category: "Q3 Sales", value: 95 },
  { id: crypto.randomUUID(), category: "Q4 Sales", value: 145 },
];

const createDefaultProperties = (): VisualProperties => ({
  title: "Sales Performance",
  showTitle: true,
  showLegend: false,
  showDataLabels: true,
  primaryColor: "#0ea5e9",
  backgroundColor: "#ffffff",
  fontSize: 14,
  borderRadius: 8,
  animationDuration: 500,
});

const createNewVisual = (index: number): CanvasVisualData => ({
  id: crypto.randomUUID(),
  type: "bar",
  data: createDefaultData(),
  properties: createDefaultProperties(),
  position: { x: 50 + (index % 3) * 50, y: 50 + Math.floor(index / 3) * 50 },
  size: { width: 500, height: 350 },
});

const createDefaultSheet = (name: string): SheetData => {
  const visual = createNewVisual(0);
  return {
    id: crypto.randomUUID(),
    name,
    visuals: [visual],
  };
};

const createMetaSheet = (): SheetData => ({
  id: crypto.randomUUID(),
  name: "Meta Ads",
  visuals: createMetaAdsVisuals(),
});

export default function Index() {
  const [sheets, setSheets] = useState<SheetData[]>([
    createMetaSheet(),
    createDefaultSheet("GA"),
    createDefaultSheet("DV360"),
  ]);
  const [activeSheetId, setActiveSheetId] = useState(sheets[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(sheets[0].visuals[0]?.id || null);
  const [isFieldDragging, setIsFieldDragging] = useState(false);
  const [draggingField, setDraggingField] = useState<DataField | null>(null);

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
    const newSheet = createDefaultSheet(`Sheet ${sheets.length + 1}`);
    setSheets((prev) => [...prev, newSheet]);
    setActiveSheetId(newSheet.id);
    setSelectedId(newSheet.visuals[0]?.id || null);
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

  // Visual handlers (scoped to active sheet)
  const handleAddVisual = useCallback(() => {
    const newVisual = createNewVisual(visuals.length);
    setSheets((prev) =>
      prev.map((s) =>
        s.id === activeSheetId ? { ...s, visuals: [...s.visuals, newVisual] } : s
      )
    );
    setSelectedId(newVisual.id);
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
    // Generate new data from the Meta Ads raw data based on the field
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

    // Update the visual with new data and title
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
    // Return empty for other sheets - will add GA and DV360 tables later
    return [];
  };

  // Handle drag start for DnD context
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

  // Handle drag end for DnD context
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
        if (fieldData) {
          handleFieldDropped(visualId, fieldData);
        }
      }
      return;
    }

    // Handle visual drag
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
        <Header />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Configuration */}
          <aside className="w-72 border-r bg-card flex flex-col overflow-hidden">
            <Tabs defaultValue="visual" className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-4 grid grid-cols-3">
                <TabsTrigger value="visual" className="gap-1.5 text-xs">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Visual
                </TabsTrigger>
                <TabsTrigger value="data" className="gap-1.5 text-xs">
                  <Database className="h-3.5 w-3.5" />
                  Data
                </TabsTrigger>
                <TabsTrigger value="format" className="gap-1.5 text-xs">
                  <Settings className="h-3.5 w-3.5" />
                  Format
                </TabsTrigger>
              </TabsList>
              
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
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      Select a visual on the canvas to edit
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="data" className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {selectedVisual ? (
                    <>
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Sample Data
                      </h3>
                      <DataEditor data={selectedVisual.data} onChange={handleDataChange} />
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

          {/* Main Canvas */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="h-12 border-b bg-card px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Canvas</span>
                <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded font-medium">
                  {visuals.length} visual{visuals.length !== 1 ? "s" : ""}
                </span>
                {selectedVisual && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">
                    {selectedVisual.type.charAt(0).toUpperCase() + selectedVisual.type.slice(1)} selected
                  </span>
                )}
              </div>
              {selectedVisual && (
                <CodeExport
                  type={selectedVisual.type}
                  data={selectedVisual.data}
                  properties={selectedVisual.properties}
                />
              )}
            </div>

            {/* Canvas Area */}
            <div className="flex-1 p-4 bg-canvas canvas-grid overflow-auto">
              <VisualCanvas
                visuals={visuals}
                selectedId={selectedId}
                isFieldDragging={isFieldDragging}
                onSelectVisual={setSelectedId}
                onUpdateVisual={handleUpdateVisual}
                onDeleteVisual={handleDeleteVisual}
                onDuplicateVisual={handleDuplicateVisual}
                onAddVisual={handleAddVisual}
              />
            </div>

            {/* Sheet Tabs at Bottom */}
            <SheetTabs
              sheets={sheets.map((s) => ({ id: s.id, name: s.name }))}
              activeSheetId={activeSheetId}
              onSelectSheet={handleSelectSheet}
              onAddSheet={handleAddSheet}
              onDeleteSheet={handleDeleteSheet}
              onRenameSheet={handleRenameSheet}
            />
          </main>

          {/* Right Sidebar - Data Fields */}
          <aside className="w-64 border-l bg-card flex flex-col overflow-hidden">
            <DataFieldsPanel tables={getCurrentDataTables()} />
          </aside>
        </div>
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
