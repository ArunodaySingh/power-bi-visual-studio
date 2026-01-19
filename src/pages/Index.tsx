import { useState, useCallback } from "react";
import { Database, Settings, LayoutGrid } from "lucide-react";
import { Header } from "@/components/Header";
import { VisualTypeSelector, type VisualType } from "@/components/VisualTypeSelector";
import { PropertyPanel, type VisualProperties } from "@/components/PropertyPanel";
import { DataEditor, type DataPoint } from "@/components/DataEditor";
import { VisualCanvas } from "@/components/VisualCanvas";
import { CodeExport } from "@/components/CodeExport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SheetTabs, type Sheet } from "@/components/SheetTabs";
import type { CanvasVisualData } from "@/components/CanvasVisual";

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

export default function Index() {
  const [sheets, setSheets] = useState<SheetData[]>([
    createDefaultSheet("Meta"),
    createDefaultSheet("GA"),
    createDefaultSheet("DV360"),
  ]);
  const [activeSheetId, setActiveSheetId] = useState(sheets[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(sheets[0].visuals[0]?.id || null);

  const activeSheet = sheets.find((s) => s.id === activeSheetId);
  const visuals = activeSheet?.visuals || [];
  const selectedVisual = visuals.find((v) => v.id === selectedId);

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
      </div>
    </div>
  );
}
