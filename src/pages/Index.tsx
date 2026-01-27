import { useState, useCallback } from "react";
import { Database, Settings, LayoutGrid, Hash, Type, Plus } from "lucide-react";
import { DndContext, DragEndEvent, DragStartEvent, useSensor, useSensors, PointerSensor, DragOverlay } from "@dnd-kit/core";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FilterBar } from "@/components/FilterBar";
import { ChannelSummaryCard, type ChannelData } from "@/components/ChannelSummaryCard";
import { SpendSummaryChart } from "@/components/SpendSummaryChart";
import { OverviewSection } from "@/components/OverviewSection";
import { VisualizationSelector, VisualizationGridSelector, type VisualizationType } from "@/components/VisualizationSelector";
import { VisualTypeSelector, type VisualType } from "@/components/VisualTypeSelector";
import { PropertyPanel, type VisualProperties } from "@/components/PropertyPanel";
import { DataEditor, type DataPoint } from "@/components/DataEditor";
import { VisualCanvas } from "@/components/VisualCanvas";
import { CodeExport } from "@/components/CodeExport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SheetTabs, type Sheet } from "@/components/SheetTabs";
import { DataFieldsPanel, metaAdsDataTables, type DataField, type DataTable } from "@/components/DataFieldsPanel";
import type { CanvasVisualData } from "@/components/CanvasVisual";
import { createMetaAdsVisuals, metaAdsRawData, metaAdsSummary } from "@/data/metaAdsData";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Dashboard tabs configuration
const dashboardTabs = [
  { id: "summary", label: "Summary" },
  { id: "paid-search", label: "Paid Search" },
  { id: "paid-social", label: "Paid Social" },
  { id: "youtube", label: "YouTube" },
  { id: "programmatic", label: "Programmatic" },
  { id: "direct-buy", label: "Direct Buy" },
  { id: "adserver", label: "Adserver" },
  { id: "pop-analysis", label: "PoP Analysis" },
  { id: "qa", label: "Q&A" },
  { id: "glossary", label: "Glossary" },
];

// Channel summary data
const channelSummaryData: ChannelData[] = [
  {
    id: "search",
    name: "Search",
    icon: "search",
    color: "pink",
    metrics: [
      { label: "Spend", value: 75328957, format: "currency" },
      { label: "Impressions", value: "83.27B" },
      { label: "Clicks", value: "2.08B" },
      { label: "CPM", value: 0.90, format: "currency" },
      { label: "CTR", value: 2.50, format: "percent" },
    ],
  },
  {
    id: "social",
    name: "Social",
    icon: "social",
    color: "orange",
    metrics: [
      { label: "Spend", value: 65254, format: "currency" },
      { label: "Impressions", value: "203.7M" },
      { label: "Clicks", value: "1.66M" },
      { label: "CPC", value: 0.04, format: "currency" },
      { label: "Conversion Rate", value: 443.39, format: "percent" },
    ],
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: "youtube",
    color: "yellow",
    metrics: [
      { label: "Spend", value: 5096242, format: "currency" },
      { label: "Video Completions", value: "3.69B" },
      { label: "CPV", value: 0.00, format: "currency" },
      { label: "CPCV", value: 0.00, format: "currency" },
      { label: "VTR", value: 55.50, format: "percent" },
    ],
  },
  {
    id: "programmatic",
    name: "Programmatic",
    icon: "programmatic",
    color: "amber",
    metrics: [
      { label: "Spend", value: 743604, format: "currency" },
      { label: "Impressions", value: "1.44B" },
      { label: "Clicks", value: "9.87M" },
      { label: "Conversions", value: "3.38M" },
      { label: "Conversion Rate", value: 34.21, format: "percent" },
    ],
  },
  {
    id: "direct-buy",
    name: "Direct Buy",
    icon: "directBuy",
    color: "yellow",
    metrics: [
      { label: "Spend", value: "--" },
      { label: "Impressions", value: "--" },
      { label: "Clicks", value: "--" },
      { label: "CPM", value: "--" },
      { label: "CTR", value: "--" },
    ],
  },
];

// Spend summary for pie chart
const spendSummaryData = [
  { name: "Paid Search", value: 75328957, color: "#8b5cf6" },
  { name: "Paid Social", value: 65254, color: "#ec4899" },
];

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

const createNewVisual = (index: number, type: VisualType = "bar"): CanvasVisualData => ({
  id: crypto.randomUUID(),
  type,
  data: createDefaultData(),
  properties: createDefaultProperties(),
  position: { x: 50 + (index % 3) * 350, y: 50 + Math.floor(index / 3) * 280 },
  size: { width: 320, height: 250 },
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
  const [activeTab, setActiveTab] = useState("summary");
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [selectedDimension, setSelectedDimension] = useState("Channel");
  const [dateRange] = useState({ start: "4/1/2025", end: "12/6/2025" });

  const [sheets, setSheets] = useState<SheetData[]>([
    createMetaSheet(),
    createDefaultSheet("GA"),
    createDefaultSheet("DV360"),
  ]);
  const [activeSheetId, setActiveSheetId] = useState(sheets[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(sheets[0].visuals[0]?.id || null);
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
  const handleAddVisual = useCallback((type?: VisualizationType) => {
    const visualType = (type || "bar") as VisualType;
    const newVisual = createNewVisual(visuals.length, visualType);
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

  const totalSpend = spendSummaryData.reduce((sum, d) => sum + d.value, 0);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-background">
        {/* Dashboard Header with Navigation Tabs */}
        <DashboardHeader
          tabs={dashboardTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        {/* Filter Bar */}
        <FilterBar
          channels={["All", "Search", "Social", "YouTube", "Programmatic", "Direct Buy"]}
          platforms={["All", "Google", "Meta", "TikTok", "LinkedIn"]}
          currencies={["USD", "EUR", "GBP", "INR"]}
          selectedChannel={selectedChannel}
          selectedPlatform={selectedPlatform}
          selectedCurrency={selectedCurrency}
          dateRange={dateRange}
          onChannelChange={setSelectedChannel}
          onPlatformChange={setSelectedPlatform}
          onCurrencyChange={setSelectedCurrency}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Main Content Area */}
          <main className="flex-1 flex flex-col overflow-auto p-4 gap-4">
            {/* Channel Summary Cards + Spend Chart */}
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                {channelSummaryData.map((channel) => (
                  <ChannelSummaryCard
                    key={channel.id}
                    channel={channel}
                    onClick={() => setActiveTab(channel.id)}
                  />
                ))}
              </div>
              <div className="w-80">
                <SpendSummaryChart
                  data={spendSummaryData}
                  totalSpend={totalSpend}
                />
              </div>
            </div>

            {/* Overview Section with Charts */}
            <OverviewSection
              title="OVERVIEW"
              dimensions={["Channel", "Campaign", "Ad Group", "Platform"]}
              selectedDimension={selectedDimension}
              onDimensionChange={setSelectedDimension}
            >
              {/* Add visualization button */}
              <div className="col-span-3 flex items-center gap-4 pb-4 border-b">
                <VisualizationSelector
                  onSelect={(type) => handleAddVisual(type)}
                  triggerLabel="Add Visualization"
                />
                <span className="text-sm text-muted-foreground">
                  Select a chart or table type to add to your dashboard
                </span>
              </div>
            </OverviewSection>

            {/* Canvas Area */}
            <div className="flex-1 bg-muted/20 rounded-lg border min-h-[400px]">
              <div className="h-12 border-b bg-card px-4 flex items-center justify-between rounded-t-lg">
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
              <div className="p-4 canvas-grid overflow-auto h-[calc(100%-3rem)]">
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

          {/* Right Sidebar - Data Fields & Config Panel */}
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
