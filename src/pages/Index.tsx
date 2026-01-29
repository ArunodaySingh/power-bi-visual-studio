import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, LayoutGrid, Hash, Type, Filter, Loader2, Database, RefreshCw, AlertCircle, Save, ArrowLeft, LogOut } from "lucide-react";
import { DndContext, DragEndEvent, DragStartEvent, useSensor, useSensors, PointerSensor, DragOverlay } from "@dnd-kit/core";
import { VisualTypeSelector, type VisualType } from "@/components/VisualTypeSelector";
import { PropertyPanel, type VisualProperties } from "@/components/PropertyPanel";
import { DataEditor, type DataPoint } from "@/components/DataEditor";
import { PanelCanvas } from "@/components/PanelCanvas";
import { CodeExport } from "@/components/CodeExport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SheetTabs } from "@/components/SheetTabs";
import { DataFieldsPanel, metaAdsDataTables, type DataField, type DataTable } from "@/components/DataFieldsPanel";
import { ComponentPalette } from "@/components/ComponentPalette";
import { FieldWells } from "@/components/FieldWells";
import { type LayoutType } from "@/components/LayoutPalette";
import { type PanelData, generateSlots } from "@/components/DraggablePanel";
import type { CanvasVisualData } from "@/components/CanvasVisual";
import type { VisualizationType } from "@/components/VisualizationSelector";
import type { SlicerType, SlicerData, FieldMapping, TimeGranularity } from "@/types/dashboard";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { FilterProvider, useFilters } from "@/contexts/FilterContext";
import { CrossFilterProvider, useCrossFilter } from "@/contexts/CrossFilterContext";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownSlicer, ListSlicer, DateRangeSlicer, NumericRangeSlicer } from "@/components/slicers";
import { useMetaAdsData, getUniqueValues } from "@/hooks/useMetaAdsData";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, startOfMonth, startOfQuarter, startOfYear, format } from "date-fns";

type SlotVisualsMap = Map<string, CanvasVisualData>;

interface SheetData {
  id: string;
  name: string;
  panels: PanelData[];
  visuals: CanvasVisualData[];
  slotVisuals: SlotVisualsMap;
  slicers: SlicerData[];
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
  legendPosition: "bottom",
  showDataLabels: true,
  primaryColor: "#0ea5e9",
  backgroundColor: "#ffffff",
  fontSize: 14,
  borderRadius: 8,
  animationDuration: 500,
  barChartMode: "grouped",
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
  fieldMapping: {
    axis: [],
    values: [],
    tooltips: [],
  },
});

const createNewPanel = (layoutType: LayoutType, index: number): PanelData => ({
  id: crypto.randomUUID(),
  layoutType,
  position: { x: 50 + (index % 2) * 450, y: 50 + Math.floor(index / 2) * 300 },
  size: { width: 400, height: 250 },
  slots: generateSlots(layoutType),
});

const createNewSlicer = (type: SlicerType, field: string, fieldLabel: string, index: number): SlicerData => ({
  id: crypto.randomUUID(),
  type,
  field,
  fieldLabel,
  title: fieldLabel,
  selectedValues: [],
  position: { x: 50 + (index % 3) * 250, y: 50 },
  size: { 
    width: type === "date-range" ? 280 : type === "numeric-range" ? 250 : 220, 
    height: type === "list" ? 280 : type === "numeric-range" ? 180 : 120 
  },
  multiSelect: true,
  showSearch: type === "list",
});

const createEmptySheet = (name: string): SheetData => ({
  id: crypto.randomUUID(),
  name,
  panels: [],
  visuals: [],
  slotVisuals: new Map(),
  slicers: [],
});

const getDefaultSlicerField = (type: SlicerType): { field: string; label: string } => {
  switch (type) {
    case "date-range":
      return { field: "date", label: "Date" };
    case "numeric-range":
      return { field: "spend", label: "Spend" };
    default:
      return { field: "campaignName", label: "Campaign" };
  }
};

function DashboardContent() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { filters, addFilter, removeFilter, getFilteredData } = useFilters();
  const { crossFilter, setCrossFilter, clearCrossFilter } = useCrossFilter();
  const { data: metaAdsData = [], isLoading: isLoadingMetaAds, error: metaAdsError, refetch: refetchMetaAds, isFetching: isFetchingMetaAds } = useMetaAdsData();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const [sheets, setSheets] = useState<SheetData[]>([
    createEmptySheet("Meta Ads"),
    createEmptySheet("GA"),
    createEmptySheet("DV360"),
  ]);
  const [activeSheetId, setActiveSheetId] = useState(sheets[0].id);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [selectedVisualId, setSelectedVisualId] = useState<string | null>(null);
  const [selectedSlicerId, setSelectedSlicerId] = useState<string | null>(null);
  const [isLayoutDragging, setIsLayoutDragging] = useState(false);
  const [isComponentDragging, setIsComponentDragging] = useState(false);
  const [isFieldDragging, setIsFieldDragging] = useState(false);
  const [isSlicerDragging, setIsSlicerDragging] = useState(false);
  const [draggingField, setDraggingField] = useState<DataField | null>(null);
  const [draggingLayout, setDraggingLayout] = useState<LayoutType | null>(null);
  const [draggingComponent, setDraggingComponent] = useState<string | null>(null);
  const [draggingSlicerType, setDraggingSlicerType] = useState<SlicerType | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  
  const [slicerDateRanges, setSlicerDateRanges] = useState<Map<string, { start: Date | null; end: Date | null }>>(new Map());
  const [slicerNumericRanges, setSlicerNumericRanges] = useState<Map<string, { min: number; max: number }>>(new Map());

  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [dashboardName, setDashboardName] = useState("");
  const [dashboardDescription, setDashboardDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const activeSheet = sheets.find((s) => s.id === activeSheetId);
  const panels = activeSheet?.panels || [];
  const visuals = activeSheet?.visuals || [];
  const slotVisuals = activeSheet?.slotVisuals || new Map<string, CanvasVisualData>();
  const slicers = activeSheet?.slicers || [];
  const selectedVisual = visuals.find((v) => v.id === selectedVisualId) || 
    Array.from(slotVisuals.values()).find((v) => v.id === selectedVisualId);
  const selectedPanel = panels.find((p) => p.id === selectedPanelId);
  const selectedSlicer = slicers.find((s) => s.id === selectedSlicerId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Save dashboard to database
  const handleSaveDashboard = useCallback(async () => {
    if (!dashboardName.trim()) {
      toast.error("Please enter a dashboard name");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to save dashboards");
      return;
    }

    setIsSaving(true);
    try {
      // Convert slotVisuals Map to plain object for JSON storage
      const sheetsForStorage = sheets.map((sheet) => ({
        ...sheet,
        slotVisuals: Object.fromEntries(sheet.slotVisuals),
      }));

      const { error } = await supabase.from("dashboards").insert([{
        name: dashboardName.trim(),
        description: dashboardDescription.trim() || null,
        sheets_data: JSON.parse(JSON.stringify(sheetsForStorage)),
        user_id: user.id,
      }]);

      if (error) throw error;

      toast.success("Dashboard saved successfully!");
      setShowSaveDialog(false);
      setDashboardName("");
      setDashboardDescription("");
      navigate("/dashboards");
    } catch (error) {
      console.error("Error saving dashboard:", error);
      toast.error("Failed to save dashboard");
    } finally {
      setIsSaving(false);
    }
  }, [dashboardName, dashboardDescription, sheets, navigate, user]);

  // Sheet handlers
  const handleSelectSheet = useCallback((id: string) => {
    setActiveSheetId(id);
    setSelectedPanelId(null);
    setSelectedVisualId(null);
    setSelectedSlicerId(null);
  }, []);

  const handleAddSheet = useCallback(() => {
    const newSheet = createEmptySheet(`Sheet ${sheets.length + 1}`);
    setSheets((prev) => [...prev, newSheet]);
    setActiveSheetId(newSheet.id);
    setSelectedPanelId(null);
    setSelectedVisualId(null);
  }, [sheets.length]);

  const handleDeleteSheet = useCallback((id: string) => {
    if (sheets.length <= 1) return;
    setSheets((prev) => prev.filter((s) => s.id !== id));
    if (activeSheetId === id) {
      const remaining = sheets.filter((s) => s.id !== id);
      setActiveSheetId(remaining[0].id);
    }
  }, [sheets, activeSheetId]);

  const handleRenameSheet = useCallback((id: string, name: string) => {
    setSheets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    );
  }, []);

  // Panel handlers
  const handleAddPanel = useCallback((layoutType: LayoutType, position?: { x: number; y: number }) => {
    const newPanel = createNewPanel(layoutType, panels.length);
    if (position) {
      newPanel.position = position;
    }
    setSheets((prev) =>
      prev.map((s) =>
        s.id === activeSheetId ? { ...s, panels: [...s.panels, newPanel] } : s
      )
    );
    setSelectedPanelId(newPanel.id);
    setSelectedVisualId(null);
    toast.success(`Added ${layoutType.replace("-", " ")} layout`);
  }, [panels.length, activeSheetId]);

  const handleUpdatePanel = useCallback((id: string, updates: Partial<PanelData>) => {
    setSheets((prev) =>
      prev.map((s) =>
        s.id === activeSheetId
          ? { ...s, panels: s.panels.map((p) => (p.id === id ? { ...p, ...updates } : p)) }
          : s
      )
    );
  }, [activeSheetId]);

  const handleDeletePanel = useCallback((id: string) => {
    setSheets((prev) =>
      prev.map((s) =>
        s.id === activeSheetId ? { ...s, panels: s.panels.filter((p) => p.id !== id) } : s
      )
    );
    setSelectedPanelId((prev) => (prev === id ? null : prev));
  }, [activeSheetId]);

  // Slicer handlers
  const handleAddSlicer = useCallback((type: SlicerType, position?: { x: number; y: number }) => {
    const defaultField = getDefaultSlicerField(type);
    const newSlicer = createNewSlicer(type, defaultField.field, defaultField.label, slicers.length);
    if (position) {
      newSlicer.position = position;
    }
    
    setSheets((prev) =>
      prev.map((s) =>
        s.id === activeSheetId ? { ...s, slicers: [...s.slicers, newSlicer] } : s
      )
    );
    setSelectedSlicerId(newSlicer.id);
    setSelectedPanelId(null);
    setSelectedVisualId(null);
    toast.success(`Added ${type} slicer`);
  }, [slicers.length, activeSheetId]);

  const handleUpdateSlicer = useCallback((id: string, updates: Partial<SlicerData>) => {
    setSheets((prev) =>
      prev.map((s) =>
        s.id === activeSheetId
          ? { ...s, slicers: s.slicers.map((sl) => (sl.id === id ? { ...sl, ...updates } : sl)) }
          : s
      )
    );
    
    // Update filter when slicer values change
    if (updates.selectedValues !== undefined) {
      const slicer = slicers.find((s) => s.id === id);
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
  }, [activeSheetId, slicers, addFilter, removeFilter]);

  const handleDeleteSlicer = useCallback((id: string) => {
    const slicer = slicers.find((s) => s.id === id);
    if (slicer) {
      removeFilter(slicer.field);
    }
    setSheets((prev) =>
      prev.map((s) =>
        s.id === activeSheetId ? { ...s, slicers: s.slicers.filter((sl) => sl.id !== id) } : s
      )
    );
    setSelectedSlicerId((prev) => (prev === id ? null : prev));
  }, [activeSheetId, slicers, removeFilter]);

  // Visual to slot handlers
  const handleAddVisualToSlot = useCallback((panelId: string, slotId: string, type: VisualizationType) => {
    const visualType = (type || "bar") as VisualType;
    const newVisual = createNewVisual(0, visualType);
    
    setSheets((prev) =>
      prev.map((s) => {
        if (s.id !== activeSheetId) return s;
        
        const newSlotVisuals = new Map(s.slotVisuals);
        newSlotVisuals.set(slotId, newVisual);
        
        const updatedPanels = s.panels.map((p) => {
          if (p.id !== panelId) return p;
          return {
            ...p,
            slots: p.slots.map((slot) =>
              slot.id === slotId ? { ...slot, visualId: newVisual.id } : slot
            ),
          };
        });
        
        return { ...s, panels: updatedPanels, slotVisuals: newSlotVisuals };
      })
    );
    
    setSelectedVisualId(newVisual.id);
    setSelectedPanelId(null);
    toast.success(`Added ${visualType} chart to panel`);
  }, [activeSheetId]);

  const handleRemoveVisualFromSlot = useCallback((panelId: string, slotId: string) => {
    setSheets((prev) =>
      prev.map((s) => {
        if (s.id !== activeSheetId) return s;
        
        const newSlotVisuals = new Map(s.slotVisuals);
        const visual = newSlotVisuals.get(slotId);
        newSlotVisuals.delete(slotId);
        
        const updatedPanels = s.panels.map((p) => {
          if (p.id !== panelId) return p;
          return {
            ...p,
            slots: p.slots.map((slot) =>
              slot.id === slotId ? { ...slot, visualId: undefined } : slot
            ),
          };
        });
        
        if (visual && visual.id === selectedVisualId) {
          setSelectedVisualId(null);
        }
        
        return { ...s, panels: updatedPanels, slotVisuals: newSlotVisuals };
      })
    );
  }, [activeSheetId, selectedVisualId]);

  // Update visual (works for both standalone and slot visuals)
  const handleUpdateVisual = useCallback((id: string, updates: Partial<CanvasVisualData>) => {
    setSheets((prev) =>
      prev.map((s) => {
        if (s.id !== activeSheetId) return s;
        
        const standaloneIndex = s.visuals.findIndex((v) => v.id === id);
        if (standaloneIndex >= 0) {
          return {
            ...s,
            visuals: s.visuals.map((v) => (v.id === id ? { ...v, ...updates } : v)),
          };
        }
        
        const newSlotVisuals = new Map(s.slotVisuals);
        for (const [slotId, visual] of newSlotVisuals) {
          if (visual.id === id) {
            newSlotVisuals.set(slotId, { ...visual, ...updates });
            return { ...s, slotVisuals: newSlotVisuals };
          }
        }
        
        return s;
      })
    );
  }, [activeSheetId]);

  // Visual handlers for standalone visuals
  const handleAddVisual = useCallback((type?: VisualizationType, position?: { x: number; y: number }) => {
    const visualType = (type || "bar") as VisualType;
    const newVisual = createNewVisual(visuals.length, visualType);
    if (position) {
      newVisual.position = position;
    }
    setSheets((prev) =>
      prev.map((s) =>
        s.id === activeSheetId ? { ...s, visuals: [...s.visuals, newVisual] } : s
      )
    );
    setSelectedVisualId(newVisual.id);
    setSelectedPanelId(null);
    toast.success(`Added ${visualType} chart`);
  }, [visuals.length, activeSheetId]);

  const handleDeleteVisual = useCallback((id: string) => {
    setSheets((prev) =>
      prev.map((s) =>
        s.id === activeSheetId ? { ...s, visuals: s.visuals.filter((v) => v.id !== id) } : s
      )
    );
    setSelectedVisualId((prev) => (prev === id ? null : prev));
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
      setSelectedVisualId(duplicate.id);
    }
  }, [visuals, activeSheetId]);

  // Handlers for updating selected visual
  const handleTypeChange = (type: VisualType) => {
    if (selectedVisualId) handleUpdateVisual(selectedVisualId, { type });
  };

  const handleDataChange = (data: DataPoint[]) => {
    if (selectedVisualId) handleUpdateVisual(selectedVisualId, { data });
  };

  const handlePropertiesChange = (properties: VisualProperties) => {
    if (selectedVisualId) handleUpdateVisual(selectedVisualId, { properties });
  };

  // Handle field dropped onto visual - fetch from database
  const handleFieldDropped = useCallback((visualId: string, field: DataField) => {
    if (metaAdsData.length === 0) {
      toast.error("No data available. Please wait for data to load.");
      return;
    }

    // Map database field names to match field IDs
    const fieldKeyMap: Record<string, string> = {
      campaign_name: "campaign_name",
      ad_set_name: "ad_set_name",
      date: "date",
      impressions: "impressions",
      clicks: "clicks",
      spend: "spend",
      conversions: "conversions",
      ctr: "ctr",
      cpc: "cpc",
      cpm: "cpm",
      roas: "roas",
    };

    const dbFieldKey = fieldKeyMap[field.id] || field.id;
    
    // Aggregate data by campaign name
    const aggregatedData = new Map<string, number>();
    metaAdsData.forEach((campaign) => {
      const campaignName = campaign.campaign_name || "Unknown";
      const rawValue = campaign[dbFieldKey as keyof typeof campaign];
      const value = typeof rawValue === "number" ? rawValue : 0;
      
      aggregatedData.set(
        campaignName,
        (aggregatedData.get(campaignName) || 0) + value
      );
    });

    const newData: DataPoint[] = Array.from(aggregatedData.entries()).map(([category, value]) => ({
      id: crypto.randomUUID(),
      category: category.slice(0, 20),
      value: Math.round(value * 100) / 100,
    }));

    const visual = visuals.find((v) => v.id === visualId) ||
      Array.from(slotVisuals.values()).find((v) => v.id === visualId);

    handleUpdateVisual(visualId, {
      data: newData,
      properties: {
        ...visual?.properties!,
        title: field.name + " by Campaign",
      },
    });

    toast.success(`Loaded "${field.name}" from database (${metaAdsData.length} records)`);
  }, [handleUpdateVisual, visuals, slotVisuals, metaAdsData]);

  // Get data tables for current sheet
  const getCurrentDataTables = (): DataTable[] => {
    if (activeSheet?.name === "Meta Ads") {
      return metaAdsDataTables;
    }
    return [];
  };

  // Get available values for slicer field from database
  const getSlicerValues = (field: string): (string | number)[] => {
    if (metaAdsData.length === 0) return [];
    const fieldKeyMap: Record<string, keyof typeof metaAdsData[0]> = {
      campaignName: "campaign_name",
      adSetName: "ad_set_name",
      date: "date",
      impressions: "impressions",
      clicks: "clicks",
      spend: "spend",
      conversions: "conversions",
      ctr: "ctr",
      cpc: "cpc",
      cpm: "cpm",
      roas: "roas",
    };
    const dbField = fieldKeyMap[field] || field as keyof typeof metaAdsData[0];
    return getUniqueValues(metaAdsData, dbField);
  };

  // Handle cross-filter click from visual
  const handleVisualDataClick = useCallback((visualId: string, dimension: string, value: string) => {
    setCrossFilter({
      sourceVisualId: visualId,
      dimension,
      value,
    });
  }, [setCrossFilter]);

  // Helper function to get time period key based on granularity
  const getTimePeriodKey = (dateStr: string, granularity: TimeGranularity): string => {
    if (granularity === "none" || !dateStr) return dateStr;
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    switch (granularity) {
      case "day":
        return format(date, "yyyy-MM-dd");
      case "week":
        return format(startOfWeek(date, { weekStartsOn: 1 }), "'Week of' MMM d, yyyy");
      case "month":
        return format(startOfMonth(date), "MMM yyyy");
      case "quarter":
        return format(startOfQuarter(date), "'Q'Q yyyy");
      case "year":
        return format(startOfYear(date), "yyyy");
      default:
        return dateStr;
    }
  };

  // Transform data based on field mapping - supports multiple value fields and time granularity
  const transformDataFromFieldMapping = useCallback((visualId: string, mapping: FieldMapping) => {
    if (metaAdsData.length === 0) return;

    const axisField = mapping.axis?.[0];
    const valueFields = mapping.values || [];
    
    if (!axisField || valueFields.length === 0) return;

    // Map field IDs to database column names
    const fieldKeyMap: Record<string, string> = {
      campaign_name: "campaign_name",
      ad_set_name: "ad_set_name",
      date: "date",
      impressions: "impressions",
      clicks: "clicks",
      spend: "spend",
      conversions: "conversions",
      ctr: "ctr",
      cpc: "cpc",
      cpm: "cpm",
      roas: "roas",
    };

    const axisKey = fieldKeyMap[axisField.id] || axisField.id;
    
    // Get the time granularity from the first value field (or use none)
    const timeGranularity = valueFields[0]?.timeGranularity || "none";

    // Aggregate data by axis field (with time period if applicable) for all value fields
    const aggregatedData = new Map<string, Record<string, { sum: number; count: number }>>();
    
    metaAdsData.forEach((campaign) => {
      let axisValue = String(campaign[axisKey as keyof typeof campaign] || "Unknown");
      
      // If axis is date and we have time granularity, group by time period
      if (axisKey === "date" && timeGranularity !== "none") {
        axisValue = getTimePeriodKey(axisValue, timeGranularity);
      }
      
      if (!aggregatedData.has(axisValue)) {
        aggregatedData.set(axisValue, {});
      }
      
      const record = aggregatedData.get(axisValue)!;
      
      valueFields.forEach((field, index) => {
        const valueKey = fieldKeyMap[field.id] || field.id;
        const rawValue = campaign[valueKey as keyof typeof campaign];
        const value = typeof rawValue === "number" ? rawValue : 0;
        const fieldName = index === 0 ? "value" : `value${index + 1}`;
        
        if (!record[fieldName]) {
          record[fieldName] = { sum: 0, count: 0 };
        }
        record[fieldName].sum += value;
        record[fieldName].count += 1;
      });
    });

    // Create data points with multiple value fields, applying aggregation
    const newData: DataPoint[] = Array.from(aggregatedData.entries()).map(([category, values]) => {
      const dataPoint: DataPoint = {
        id: crypto.randomUUID(),
        category: category.slice(0, 25),
        value: 0,
      };
      
      // Apply aggregation for each value field
      Object.keys(values).forEach((key, index) => {
        const field = valueFields[index];
        const aggregation = field?.aggregation || "sum";
        const { sum, count } = values[key];
        
        let finalValue: number;
        switch (aggregation) {
          case "avg":
            finalValue = count > 0 ? sum / count : 0;
            break;
          case "count":
            finalValue = count;
            break;
          case "min":
          case "max":
            // For min/max, we'd need to track differently, but sum is reasonable default
            finalValue = sum;
            break;
          default:
            finalValue = sum;
        }
        
        if (key === "value") {
          dataPoint.value = Math.round(finalValue * 100) / 100;
        } else {
          dataPoint[key] = Math.round(finalValue * 100) / 100;
        }
      });
      
      return dataPoint;
    });
    
    // Sort by category (especially useful for time-based data)
    newData.sort((a, b) => String(a.category).localeCompare(String(b.category)));

    const visual = visuals.find((v) => v.id === visualId) ||
      Array.from(slotVisuals.values()).find((v) => v.id === visualId);

    // Build title from all value field names with time granularity
    const valueNames = valueFields.map(f => f.name).join(", ");
    const timeLabel = timeGranularity !== "none" ? ` (${timeGranularity}ly)` : "";

    handleUpdateVisual(visualId, {
      data: newData,
      fieldMapping: mapping,
      properties: {
        ...visual?.properties!,
        title: `${valueNames} by ${axisField.name}${timeLabel}`,
      },
    });
    
    toast.success(`Loaded ${valueFields.length} metric(s) from ${metaAdsData.length} records${timeGranularity !== "none" ? ` grouped by ${timeGranularity}` : ""}`);
  }, [metaAdsData, visuals, slotVisuals, handleUpdateVisual]);

  // Handle field mapping change for selected visual
  const handleFieldMappingChange = useCallback((mapping: FieldMapping) => {
    if (selectedVisualId) {
      handleUpdateVisual(selectedVisualId, { fieldMapping: mapping });
      // Also transform data if we have axis and values
      if (mapping.axis?.length && mapping.values?.length) {
        transformDataFromFieldMapping(selectedVisualId, mapping);
      }
    }
  }, [selectedVisualId, handleUpdateVisual, transformDataFromFieldMapping]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;
    const data = active.data.current;

    if (id.startsWith("layout-")) {
      setIsLayoutDragging(true);
      setDraggingLayout(data?.layout?.type || null);
    } else if (id.startsWith("component-")) {
      setIsComponentDragging(true);
      setDraggingComponent(data?.componentType || null);
    } else if (id.startsWith("field-")) {
      setIsFieldDragging(true);
      setDraggingField(data?.field || null);
    } else if (id.startsWith("slicer-type-")) {
      setIsSlicerDragging(true);
      setDraggingSlicerType(data?.slicerType || null);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    const activeId = active.id as string;
    const activeData = active.data.current;

    // Reset all dragging states
    setIsLayoutDragging(false);
    setIsComponentDragging(false);
    setIsFieldDragging(false);
    setIsSlicerDragging(false);
    setDraggingLayout(null);
    setDraggingComponent(null);
    setDraggingField(null);
    setDraggingSlicerType(null);

    // Handle layout drop on canvas
    if (activeId.startsWith("layout-") && over) {
      const overId = over.id as string;
      if (overId === "canvas-drop") {
        const layoutType = activeData?.layout?.type as LayoutType;
        if (layoutType) {
          handleAddPanel(layoutType, { x: 100, y: 100 });
        }
      }
      return;
    }

    // Handle slicer type drop on canvas
    if (activeId.startsWith("slicer-type-") && over) {
      const overId = over.id as string;
      // Accept drops on canvas-drop or any canvas-like area (not on specific slots/visuals)
      if (overId === "canvas-drop" || !overId.startsWith("slot-") && !overId.startsWith("drop-") && !overId.startsWith("visual-")) {
        const slicerType = activeData?.slicerType as SlicerType;
        if (slicerType) {
          handleAddSlicer(slicerType, { x: 100, y: 50 });
        }
      }
      return;
    }

    // Handle component drop on canvas or slot
    if (activeId.startsWith("component-") && over) {
      const overId = over.id as string;
      const componentType = activeData?.componentType as VisualizationType;
      
      if (overId === "canvas-drop" && componentType) {
        handleAddVisual(componentType, { x: 100, y: 100 });
      } else if (overId.startsWith("slot-") && componentType) {
        const overData = over.data.current;
        if (overData?.type === "slot" && overData.panelId && overData.slotId) {
          handleAddVisualToSlot(overData.panelId, overData.slotId, componentType);
        }
      }
      return;
    }

    // Handle field drop onto visual
    if (activeId.startsWith("field-") && over) {
      const overId = over.id as string;
      const fieldData = activeData?.field as DataField | undefined;
      
      if (fieldData) {
        // Handle drop on Field Well
        if (overId.startsWith("well-")) {
          const wellType = overId.replace("well-", "") as keyof FieldMapping;
          if (selectedVisual) {
            const currentMapping = selectedVisual.fieldMapping || { axis: [], values: [], tooltips: [] };
            const newMapping = { ...currentMapping };
            
            if (wellType === "legend") {
              newMapping.legend = fieldData;
            } else {
              const existingFields = (newMapping[wellType] as DataField[]) || [];
              if (!existingFields.some(f => f.id === fieldData.id)) {
                newMapping[wellType] = [...existingFields, fieldData] as never;
              }
            }
            
            handleFieldMappingChange(newMapping);
            toast.success(`Added ${fieldData.name} to ${wellType}`);
          } else {
            toast.error("Select a visual first to add fields");
          }
          return;
        }
        
        // Handle drop on standalone visual
        if (overId.startsWith("drop-")) {
          const visualId = overId.replace("drop-", "");
          handleFieldDropped(visualId, fieldData);
          return;
        }
        
        // Handle drop on visual-drop zone (from VisualDropZone)
        if (overId.startsWith("visual-drop-")) {
          const visualId = overId.replace("visual-drop-", "");
          handleFieldDropped(visualId, fieldData);
          return;
        }
        
        // Handle drop on slot that has a visual
        if (overId.startsWith("slot-")) {
          const overData = over.data.current;
          if (overData?.slotId) {
            const visual = slotVisuals.get(overData.slotId);
            if (visual) {
              handleFieldDropped(visual.id, fieldData);
              return;
            }
          }
        }
      }
      return;
    }

    // Handle slicer drag
    if (activeId.startsWith("slicer-") && !activeId.startsWith("slicer-type-")) {
      const slicerId = activeId.replace("slicer-", "");
      const slicer = slicers.find((s) => s.id === slicerId);
      if (slicer) {
        handleUpdateSlicer(slicerId, {
          position: {
            x: slicer.position.x + delta.x,
            y: slicer.position.y + delta.y,
          },
        });
      }
      return;
    }

    // Handle panel drag
    if (activeId.startsWith("panel-")) {
      const panelId = activeId.replace("panel-", "");
      const panel = panels.find((p) => p.id === panelId);
      if (panel) {
        handleUpdatePanel(panelId, {
          position: {
            x: panel.position.x + delta.x,
            y: panel.position.y + delta.y,
          },
        });
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
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Component & Layout Palette */}
          {showLeftPanel && (
            <aside className="w-64 border-r bg-card flex flex-col overflow-hidden">
              <ComponentPalette 
                onAddVisual={handleAddVisual} 
                onAddLayout={handleAddPanel}
                onAddSlicer={handleAddSlicer}
              />
            </aside>
          )}

          {/* Main Canvas Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Canvas Toolbar */}
            <div className="h-12 border-b bg-card px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <span className="text-sm font-medium">Canvas</span>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">
                  {panels.length} panel{panels.length !== 1 ? "s" : ""}
                </span>
                <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded font-medium">
                  {visuals.length} visual{visuals.length !== 1 ? "s" : ""}
                </span>
                {slicers.length > 0 && (
                  <span className="px-2 py-0.5 bg-accent text-accent-foreground text-xs rounded font-medium flex items-center gap-1">
                    <Filter className="h-3 w-3" />
                    {slicers.length} filter{slicers.length !== 1 ? "s" : ""}
                  </span>
                )}
                {filters.length > 0 && (
                  <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs rounded font-medium">
                    {filters.length} active
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
                    Failed to load - Retry
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
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLeftPanel(!showLeftPanel)}
                >
                  {showLeftPanel ? "Hide Left" : "Show Left"}
                </Button>
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
                  {showConfigPanel ? "Hide Right" : "Show Right"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Dashboard
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
            </div>

            {/* Canvas with Slicers */}
            <div className="flex-1 p-4 bg-muted/30 canvas-grid overflow-auto relative">
              {/* Render Slicers */}
              {slicers.map((slicer) => {
                const slicerProps = {
                  slicer,
                  isSelected: selectedSlicerId === slicer.id,
                  onSelect: () => {
                    setSelectedSlicerId(slicer.id);
                    setSelectedPanelId(null);
                    setSelectedVisualId(null);
                  },
                  onUpdate: (updates: Partial<SlicerData>) => handleUpdateSlicer(slicer.id, updates),
                  onDelete: () => handleDeleteSlicer(slicer.id),
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

              {/* Panel Canvas */}
              <PanelCanvas
                panels={panels}
                visuals={visuals}
                slotVisuals={slotVisuals}
                selectedPanelId={selectedPanelId}
                selectedVisualId={selectedVisualId}
                isLayoutDragging={isLayoutDragging || isSlicerDragging}
                isFieldDragging={isFieldDragging}
                isComponentDragging={isComponentDragging}
                crossFilterVisualId={crossFilter?.sourceVisualId || null}
                highlightedValue={crossFilter?.value || null}
                onSelectPanel={setSelectedPanelId}
                onSelectVisual={setSelectedVisualId}
                onUpdatePanel={handleUpdatePanel}
                onDeletePanel={handleDeletePanel}
                onUpdateVisual={handleUpdateVisual}
                onDeleteVisual={handleDeleteVisual}
                onDuplicateVisual={handleDuplicateVisual}
                onRemoveVisualFromSlot={handleRemoveVisualFromSlot}
                onDataClick={handleVisualDataClick}
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
            <aside className="w-80 border-l bg-card flex flex-col overflow-hidden">
              {/* Data Fields - Always visible at top */}
              <div className="h-64 border-b flex-shrink-0 overflow-hidden">
                <DataFieldsPanel tables={getCurrentDataTables()} />
              </div>
              
              {/* Tabs for Visual/Format */}
              <Tabs defaultValue="visual" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="mx-4 mt-3 grid grid-cols-2">
                  <TabsTrigger value="visual" className="gap-1.5 text-xs">
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Visual
                  </TabsTrigger>
                  <TabsTrigger value="format" className="gap-1.5 text-xs">
                    <Settings className="h-3.5 w-3.5" />
                    Format
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="visual" className="flex-1 p-4 overflow-y-auto m-0">
                  <div className="space-y-4">
                    {selectedVisual ? (
                      <>
                        <FieldWells
                          fieldMapping={selectedVisual.fieldMapping || { axis: [], values: [], tooltips: [] }}
                          onFieldMappingChange={handleFieldMappingChange}
                        />
                        <div className="border-t pt-4">
                          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                            Data
                          </h3>
                          <DataEditor data={selectedVisual.data} onChange={handleDataChange} />
                        </div>
                      </>
                    ) : selectedPanel ? (
                      <div className="space-y-3">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Panel Settings
                        </h3>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Layout: </span>
                          <span className="capitalize">{selectedPanel.layoutType.replace("-", " ")}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Slots: </span>
                          <span>{selectedPanel.slots.length}</span>
                        </div>
                      </div>
                    ) : selectedSlicer ? (
                      <div className="space-y-3">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Slicer Settings
                        </h3>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Type: </span>
                          <span className="capitalize">{selectedSlicer.type.replace("-", " ")}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Field: </span>
                          <span>{selectedSlicer.fieldLabel}</span>
                        </div>
                        {selectedSlicer.selectedValues.length > 0 && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Selected: </span>
                            <span>{selectedSlicer.selectedValues.length} value(s)</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-8">
                        Select a visual, panel, or slicer to edit
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="format" className="flex-1 overflow-hidden m-0">
                  {selectedVisual ? (
                    <PropertyPanel properties={selectedVisual.properties} onChange={handlePropertiesChange} />
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-8 px-4">
                      Select a visual to format
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
        {draggingLayout && (
          <div className="flex items-center gap-2 px-4 py-3 bg-card border rounded-lg shadow-lg text-sm font-medium">
            <LayoutGrid className="h-4 w-4 text-primary" />
            <span className="capitalize">{draggingLayout.replace("-", " ")}</span>
          </div>
        )}
        {draggingComponent && (
          <div className="flex items-center gap-2 px-4 py-3 bg-card border rounded-lg shadow-lg text-sm font-medium">
            <LayoutGrid className="h-4 w-4 text-primary" />
            <span className="capitalize">{draggingComponent}</span>
          </div>
        )}
        {draggingSlicerType && (
          <div className="flex items-center gap-2 px-4 py-3 bg-card border rounded-lg shadow-lg text-sm font-medium">
            <Filter className="h-4 w-4 text-primary" />
            <span className="capitalize">{draggingSlicerType.replace("-", " ")} Slicer</span>
          </div>
        )}
        {draggingField && (
          <div className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg shadow-lg text-sm font-medium">
            {draggingField.type === "metric" ? (
              <Hash className="h-4 w-4 text-primary" />
            ) : (
              <Type className="h-4 w-4 text-muted-foreground" />
            )}
            {draggingField.name}
          </div>
        )}
      </DragOverlay>

      {/* Save Dashboard Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Dashboard</DialogTitle>
            <DialogDescription>
              Give your dashboard a name and optional description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dashboard Name</label>
              <Input
                placeholder="My Dashboard"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                placeholder="Describe your dashboard..."
                value={dashboardDescription}
                onChange={(e) => setDashboardDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDashboard} disabled={isSaving || !dashboardName.trim()}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}

export default function Index() {
  return (
    <FilterProvider>
      <CrossFilterProvider>
        <DashboardContent />
      </CrossFilterProvider>
    </FilterProvider>
  );
}
