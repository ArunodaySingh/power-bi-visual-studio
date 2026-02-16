import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, LayoutDashboard, Loader2, Filter, Database, RefreshCw, AlertCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SheetTabs } from "@/components/SheetTabs";
import { VisualPreview } from "@/components/VisualPreview";
import { FilterProvider, useFilters } from "@/contexts/FilterContext";
import { CrossFilterProvider, useCrossFilter } from "@/contexts/CrossFilterContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMetaAdsData, getUniqueValues } from "@/hooks/useMetaAdsData";
import { DropdownSlicer, ListSlicer, DateRangeSlicer, NumericRangeSlicer } from "@/components/slicers";
import { TextContainer, type TextContainerData } from "@/components/TextContainer";
import { getGridStyle } from "@/utils/layoutStyles";
import { aggregateVisualData } from "@/utils/aggregateVisualData";
import { getColumnDisplayName } from "@/hooks/useMetaAdsSchema";
import type { ChartConfig } from "@/components/ChartConfigDropdowns";
import type { SlicerData } from "@/types/dashboard";
import type { DataPoint } from "@/components/DataEditor";
import type { VisualProperties } from "@/components/PropertyPanel";
import type { VisualType } from "@/components/VisualTypeSelector";

interface SlotData {
  id: string;
  position: { row: number; col: number };
  visualId?: string;
}

interface PanelData {
  id: string;
  layoutType: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  slots: SlotData[];
}

interface VisualData {
  id: string;
  type: VisualType;
  data: DataPoint[];
  properties: VisualProperties;
  position: { x: number; y: number };
  size: { width: number; height: number };
  fieldMapping?: {
    axis?: Array<{ id: string; name: string; type: string }>;
    values?: Array<{ id: string; name: string; type: string }>;
    legend?: { id: string; name: string; type: string };
    tooltips?: Array<{ id: string; name: string; type: string }>;
  };
}

interface SheetData {
  id: string;
  name: string;
  panels: PanelData[];
  visuals: VisualData[];
  slotVisuals: Record<string, VisualData>;
  slicers: SlicerData[];
  textContainers?: TextContainerData[];
  visualConfigs?: Record<string, ChartConfig>;
}

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  sheets_data: SheetData[];
}

function ViewDashboardContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { filters, addFilter, removeFilter, getFilteredData } = useFilters();
  const { crossFilter, setCrossFilter } = useCrossFilter();
  const { data: metaAdsData = [], isLoading: isLoadingMetaAds, error: metaAdsError, refetch: refetchMetaAds, isFetching: isFetchingMetaAds } = useMetaAdsData();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const [slicerDateRanges, setSlicerDateRanges] = useState<Map<string, { start: Date | null; end: Date | null }>>(new Map());
  const [slicerNumericRanges, setSlicerNumericRanges] = useState<Map<string, { min: number; max: number }>>(new Map());
  // Local slicer state so selections are reflected in the UI
  const [slicerSelections, setSlicerSelections] = useState<Map<string, (string | number)[]>>(new Map());

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ["dashboard", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboards")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      
      const sheetsData = data.sheets_data as unknown as SheetData[];
      return {
        ...data,
        sheets_data: sheetsData,
      } as Dashboard;
    },
    enabled: !!id,
  });

  const sheets = useMemo(() => dashboard?.sheets_data || [], [dashboard]);
  const [activeSheetId, setActiveSheetId] = useState<string>("");

  const activeSheet = useMemo(() => {
    if (sheets.length === 0) return null;
    const sheetId = activeSheetId || sheets[0]?.id;
    return sheets.find((s) => s.id === sheetId) || sheets[0];
  }, [sheets, activeSheetId]);

  // Apply filters to meta ads data
  // Slicer fields are stored as DB column names (e.g. "campaign_name", "spend")
  // which match the MetaAdsCampaign keys directly — no aliasing needed.
  const filteredMetaAdsData = useMemo(() => {
    if (metaAdsData.length === 0) return [];
    const asRecords = metaAdsData as unknown as Record<string, unknown>[];
    const filtered = getFilteredData(asRecords);
    return filtered as unknown as typeof metaAdsData;
  }, [metaAdsData, getFilteredData, filters]);

  // Dynamically compute visual data using saved configs + filtered data
  const computedVisualData = useMemo(() => {
    const configs = activeSheet?.visualConfigs || {};
    const result = new Map<string, DataPoint[]>();
    
    // Compute for standalone visuals
    activeSheet?.visuals.forEach((visual) => {
      const config = configs[visual.id];
      if (config && filteredMetaAdsData.length > 0) {
        result.set(visual.id, aggregateVisualData(filteredMetaAdsData, config, visual.type));
      } else {
        // Fallback to saved static data
        result.set(visual.id, visual.data);
      }
    });

    // Compute for slot visuals
    if (activeSheet?.slotVisuals) {
      Object.entries(activeSheet.slotVisuals).forEach(([slotId, visual]) => {
        const config = configs[visual.id];
        if (config && filteredMetaAdsData.length > 0) {
          result.set(visual.id, aggregateVisualData(filteredMetaAdsData, config, visual.type));
        } else {
          result.set(visual.id, visual.data);
        }
      });
    }

    return result;
  }, [activeSheet, filteredMetaAdsData]);

  // Get slicer values from database (unfiltered for full range)
  // Field names are DB column names directly (e.g. "campaign_name", "spend")
  const getSlicerValues = useCallback((field: string): (string | number)[] => {
    if (metaAdsData.length === 0) return [];
    const dbField = field as keyof typeof metaAdsData[0];
    return getUniqueValues(metaAdsData, dbField);
  }, [metaAdsData]);

  // Handle slicer updates (only filters, no structural changes)
  const handleUpdateSlicer = useCallback((id: string, updates: Partial<SlicerData>) => {
    if (updates.selectedValues !== undefined) {
      // Update local UI state
      setSlicerSelections((prev) => new Map(prev).set(id, updates.selectedValues!));
      
      const slicer = activeSheet?.slicers.find((s) => s.id === id);
      if (slicer) {
        if (updates.selectedValues.length > 0) {
          addFilter({
            field: slicer.field,
            values: updates.selectedValues,
            operator: "equals",
          });
        } else {
          removeFilter(slicer.field);
        }
      }
    }
  }, [activeSheet, addFilter, removeFilter]);

  // Handle cross-filter click from visual
  const handleVisualDataClick = useCallback((visualId: string, dimension: string, value: string) => {
    setCrossFilter({
      sourceVisualId: visualId,
      dimension,
      value,
    });
  }, [setCrossFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Dashboard not found</p>
          <Button onClick={() => navigate("/dashboards")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboards
          </Button>
        </div>
      </div>
    );
  }

  const slotVisuals = activeSheet?.slotVisuals ? new Map(Object.entries(activeSheet.slotVisuals)) : new Map<string, VisualData>();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b bg-card px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboards")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <h1 className="text-sm font-semibold">{dashboard.name}</h1>
          </div>
          <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded font-medium">
            View Only
          </span>
        </div>
        <div className="flex items-center gap-3">
          {filters.length > 0 && (
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium flex items-center gap-1">
              <Filter className="h-3 w-3" />
              {filters.length} filter(s) active
            </span>
          )}
          {isLoadingMetaAds ? (
            <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded font-medium flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading data...
            </span>
          ) : metaAdsError ? (
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => refetchMetaAds()}
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              Failed - Retry
            </Button>
          ) : (
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium flex items-center gap-1">
              <Database className="h-3 w-3" />
              {metaAdsData.length} records
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => refetchMetaAds()}
            disabled={isFetchingMetaAds}
            title="Refresh data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetchingMetaAds ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-4 bg-muted/30 canvas-grid overflow-auto relative">
          {/* Fixed-width A4-like canvas container - matches editor */}
          <div 
            className="relative mx-auto bg-card shadow-lg rounded-lg border"
            style={{ width: 1240, minHeight: 1754 }}
          >
          {/* Render Text Containers (Headers) */}
          {activeSheet?.textContainers?.map((container) => (
            <TextContainer
              key={container.id}
              container={container}
              isSelected={false}
              canvasWidth={1240}
              onSelect={() => {}}
              onUpdate={() => {}}
              onDelete={() => {}}
              isPreview={true}
            />
          ))}
          
          {/* Render Slicers */}
          {activeSheet?.slicers.map((slicer) => {
            // Use local selection state, falling back to saved state
            const localSlicer = {
              ...slicer,
              selectedValues: slicerSelections.get(slicer.id) ?? slicer.selectedValues,
            };
            const slicerProps = {
              slicer: localSlicer,
              isSelected: false,
              onSelect: () => {},
              onUpdate: (updates: Partial<SlicerData>) => handleUpdateSlicer(slicer.id, updates),
              onDelete: () => {},
            };

            if (slicer.type === "dropdown") {
              return (
                <DropdownSlicer
                  key={slicer.id}
                  {...slicerProps}
                  availableValues={getSlicerValues(slicer.field)}
                />
              );
            }
            if (slicer.type === "list") {
              return (
                <ListSlicer
                  key={slicer.id}
                  {...slicerProps}
                  availableValues={getSlicerValues(slicer.field)}
                />
              );
            }
            if (slicer.type === "date-range") {
              return (
                <DateRangeSlicer
                  key={slicer.id}
                  {...slicerProps}
                  dateRange={slicerDateRanges.get(slicer.id) || { start: null, end: null }}
                  onDateRangeChange={(range) => {
                    setSlicerDateRanges((prev) => new Map(prev).set(slicer.id, range));
                    // Apply date filter dynamically
                    if (range.start || range.end) {
                      addFilter({
                        field: slicer.field,
                        values: [],
                        operator: "between",
                        dateRange: range,
                      });
                    } else {
                      removeFilter(slicer.field);
                    }
                  }}
                />
              );
            }
            if (slicer.type === "numeric-range") {
              const values = getSlicerValues(slicer.field).filter((v) => typeof v === "number") as number[];
              const defaultMin = values.length ? Math.min(...values) : 0;
              const defaultMax = values.length ? Math.max(...values) : 100;
              return (
                <NumericRangeSlicer
                  key={slicer.id}
                  {...slicerProps}
                  availableValues={values}
                  range={slicerNumericRanges.get(slicer.id) || { min: defaultMin, max: defaultMax }}
                  onRangeChange={(range) => {
                    setSlicerNumericRanges((prev) => new Map(prev).set(slicer.id, range));
                    addFilter({
                      field: slicer.field,
                      values: [],
                      operator: "between",
                      numericRange: range,
                    });
                  }}
                />
              );
            }
            return null;
          })}

          {/* Render Standalone Visuals */}
          {activeSheet?.visuals.map((visual) => {
            const dynamicData = computedVisualData.get(visual.id) || visual.data;
            return (
              <div
                key={visual.id}
                className="absolute bg-card rounded-lg border shadow-sm overflow-hidden"
                style={{
                  left: visual.position.x,
                  top: visual.position.y,
                  width: visual.size.width,
                  height: visual.size.height,
                }}
              >
                <VisualPreview
                  type={visual.type}
                  data={dynamicData}
                  properties={visual.properties}
                  highlightedValue={crossFilter?.value || null}
                  onDataClick={(dimension, value) => handleVisualDataClick(visual.id, dimension, value)}
                  valueFieldNames={visual.fieldMapping?.values?.map(v => v.name)}
                />
              </div>
            );
          })}

          {/* Render Panel Slot Visuals */}
          {activeSheet?.panels.map((panel) => (
            <div
              key={panel.id}
              className="absolute bg-card/80 backdrop-blur-sm rounded-xl border-2 border-border/50 shadow-sm overflow-hidden"
              style={{
                left: panel.position.x,
                top: panel.position.y,
                width: panel.size.width,
                height: panel.size.height,
              }}
            >
              <div className="p-4 h-full" style={getGridStyle(panel.layoutType)}>
                {panel.slots.map((slot) => {
                  const visual = slotVisuals.get(slot.id);
                  if (!visual) {
                    return (
                      <div 
                        key={slot.id} 
                        className="min-h-[100px] rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20" 
                      />
                    );
                  }
                  const dynamicData = computedVisualData.get(visual.id) || visual.data;
                  return (
                    <div 
                      key={slot.id} 
                      className="min-h-[100px] rounded-lg border-2 border-border bg-card overflow-hidden"
                    >
                      <div className="w-full h-full p-3">
                        <VisualPreview
                          type={visual.type}
                          data={dynamicData}
                          properties={visual.properties}
                          highlightedValue={crossFilter?.value || null}
                          onDataClick={(dimension, value) => handleVisualDataClick(visual.id, dimension, value)}
                          valueFieldNames={visual.fieldMapping?.values?.map(v => v.name)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Empty state */}
          {!activeSheet?.visuals.length && !activeSheet?.panels.length && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">This sheet has no visuals</p>
            </div>
          )}
          </div>
        </div>

        {/* Sheet Tabs */}
        {sheets.length > 0 && (
          <SheetTabs
            sheets={sheets.map((s) => ({ id: s.id, name: s.name }))}
            activeSheetId={activeSheet?.id || ""}
            onSelectSheet={setActiveSheetId}
            onAddSheet={() => {}}
            onDeleteSheet={() => {}}
            onRenameSheet={() => {}}
          />
        )}
      </main>
    </div>
  );
}

export default function ViewDashboard() {
  return (
    <FilterProvider>
      <CrossFilterProvider>
        <ViewDashboardContent />
      </CrossFilterProvider>
    </FilterProvider>
  );
}
