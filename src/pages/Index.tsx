import { useState } from "react";
import { Database, Settings, LayoutGrid } from "lucide-react";
import { Header } from "@/components/Header";
import { VisualTypeSelector, type VisualType } from "@/components/VisualTypeSelector";
import { PropertyPanel, type VisualProperties } from "@/components/PropertyPanel";
import { DataEditor, type DataPoint } from "@/components/DataEditor";
import { VisualPreview } from "@/components/VisualPreview";
import { CodeExport } from "@/components/CodeExport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const initialData: DataPoint[] = [
  { id: "1", category: "Q1 Sales", value: 85 },
  { id: "2", category: "Q2 Sales", value: 120 },
  { id: "3", category: "Q3 Sales", value: 95 },
  { id: "4", category: "Q4 Sales", value: 145 },
  { id: "5", category: "Q5 Projection", value: 110 },
];

const initialProperties: VisualProperties = {
  title: "Sales Performance",
  showTitle: true,
  showLegend: false,
  showDataLabels: true,
  primaryColor: "#0ea5e9",
  backgroundColor: "#ffffff",
  fontSize: 14,
  borderRadius: 8,
  animationDuration: 500,
};

export default function Index() {
  const [visualType, setVisualType] = useState<VisualType>("bar");
  const [data, setData] = useState<DataPoint[]>(initialData);
  const [properties, setProperties] = useState<VisualProperties>(initialProperties);

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
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                    Chart Type
                  </h3>
                  <VisualTypeSelector selected={visualType} onSelect={setVisualType} />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="data" className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Sample Data
                </h3>
                <DataEditor data={data} onChange={setData} />
              </div>
            </TabsContent>
            
            <TabsContent value="format" className="flex-1 overflow-hidden m-0">
              <PropertyPanel properties={properties} onChange={setProperties} />
            </TabsContent>
          </Tabs>
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="h-12 border-b bg-card px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Preview</span>
              <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded font-medium">
                {visualType.charAt(0).toUpperCase() + visualType.slice(1)} Chart
              </span>
            </div>
            <CodeExport type={visualType} data={data} properties={properties} />
          </div>

          {/* Canvas Area */}
          <div className="flex-1 p-8 bg-canvas canvas-grid overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div className="bg-card rounded-xl border shadow-panel p-6 min-h-[400px]">
                <VisualPreview type={visualType} data={data} properties={properties} />
              </div>
              
              {/* Quick Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-card rounded-lg border p-4 shadow-sm">
                  <div className="text-2xl font-bold text-accent">
                    {data.reduce((acc, d) => acc + d.value, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Value</div>
                </div>
                <div className="bg-card rounded-lg border p-4 shadow-sm">
                  <div className="text-2xl font-bold text-primary">
                    {data.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Data Points</div>
                </div>
                <div className="bg-card rounded-lg border p-4 shadow-sm">
                  <div className="text-2xl font-bold text-success">
                    {data.length ? Math.round(data.reduce((acc, d) => acc + d.value, 0) / data.length) : 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Average</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
