import { useState, useCallback } from "react";
import { Database, Settings, LayoutGrid } from "lucide-react";
import { Header } from "@/components/Header";
import { VisualTypeSelector, type VisualType } from "@/components/VisualTypeSelector";
import { PropertyPanel, type VisualProperties } from "@/components/PropertyPanel";
import { DataEditor, type DataPoint } from "@/components/DataEditor";
import { VisualCanvas } from "@/components/VisualCanvas";
import { CodeExport } from "@/components/CodeExport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CanvasVisualData } from "@/components/CanvasVisual";

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

export default function Index() {
  const [visuals, setVisuals] = useState<CanvasVisualData[]>([createNewVisual(0)]);
  const [selectedId, setSelectedId] = useState<string | null>(visuals[0]?.id || null);

  const selectedVisual = visuals.find((v) => v.id === selectedId);

  const handleAddVisual = useCallback(() => {
    const newVisual = createNewVisual(visuals.length);
    setVisuals((prev) => [...prev, newVisual]);
    setSelectedId(newVisual.id);
  }, [visuals.length]);

  const handleUpdateVisual = useCallback((id: string, updates: Partial<CanvasVisualData>) => {
    setVisuals((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
  }, []);

  const handleDeleteVisual = useCallback((id: string) => {
    setVisuals((prev) => prev.filter((v) => v.id !== id));
    setSelectedId((prevId) => (prevId === id ? null : prevId));
  }, []);

  const handleDuplicateVisual = useCallback((id: string) => {
    const visual = visuals.find((v) => v.id === id);
    if (visual) {
      const duplicate: CanvasVisualData = {
        ...visual,
        id: crypto.randomUUID(),
        position: { x: visual.position.x + 30, y: visual.position.y + 30 },
        data: visual.data.map((d) => ({ ...d, id: crypto.randomUUID() })),
      };
      setVisuals((prev) => [...prev, duplicate]);
      setSelectedId(duplicate.id);
    }
  }, [visuals]);

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

  return (
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
              onSelectVisual={setSelectedId}
              onUpdateVisual={handleUpdateVisual}
              onDeleteVisual={handleDeleteVisual}
              onDuplicateVisual={handleDuplicateVisual}
              onAddVisual={handleAddVisual}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
