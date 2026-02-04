/**
 * Index.tsx - Main Dashboard Builder Page
 * 
 * This is the core dashboard creation interface where users can:
 * - Drag and drop panel layouts onto the canvas
 * - Add chart visuals to panel slots
 * - Configure chart data using Measure/GroupBy/Date dropdowns
 * - Add filter slicers for data filtering
 * - Save dashboards to the database
 * 
 * Architecture:
 * - Uses DndContext from @dnd-kit for drag-and-drop functionality
 * - Manages state for sheets, panels, visuals, and slicers
 * - Integrates with Supabase for data fetching and persistence
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// UI Icons - Only import what's needed for the current UI
import { Settings, LayoutGrid, Loader2, Database, RefreshCw, AlertCircle, Save, ArrowLeft, LogOut, Filter, Type } from "lucide-react";

// Drag and drop functionality
import { DndContext, DragEndEvent, DragStartEvent, useSensor, useSensors, PointerSensor, DragOverlay } from "@dnd-kit/core";

// Dashboard components
import { type VisualType } from "@/components/VisualTypeSelector";
import { PropertyPanel, type VisualProperties } from "@/components/PropertyPanel";
import type { DataPoint } from "@/components/DataEditor";
import { PanelCanvas } from "@/components/PanelCanvas";
import { CodeExport } from "@/components/CodeExport";
import { SheetTabs } from "@/components/SheetTabs";
// DataFieldsPanel removed - using dropdown configuration instead
import { ComponentPalette } from "@/components/ComponentPalette";
import { ChartConfigDropdowns, type ChartConfig } from "@/components/ChartConfigDropdowns";
import { type LayoutType } from "@/components/LayoutPalette";
import { type PanelData, generateSlots } from "@/components/DraggablePanel";
import type { CanvasVisualData } from "@/components/CanvasVisual";
import type { VisualizationType } from "@/components/VisualizationSelector";
import { TextContainer, type TextContainerData } from "@/components/TextContainer";

// UI components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

// Contexts and hooks
import { FilterProvider, useFilters } from "@/contexts/FilterContext";
import { CrossFilterProvider, useCrossFilter } from "@/contexts/CrossFilterContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMetaAdsData, getUniqueValues } from "@/hooks/useMetaAdsData";

// Slicer components
import { DropdownSlicer, ListSlicer, DateRangeSlicer, NumericRangeSlicer } from "@/components/slicers";
import { SlicerSettingsPanel } from "@/components/SlicerSettingsPanel";

// Types
import type { SlicerType, SlicerData, TimeGranularity } from "@/types/dashboard";

// Utilities
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, startOfMonth, startOfQuarter, startOfYear, format } from "date-fns";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Map to store visuals placed in panel slots (slotId -> VisualData) */
type SlotVisualsMap = Map<string, CanvasVisualData>;

/**
 * SheetData - Represents a single sheet/tab in the dashboard
 * Each dashboard can have multiple sheets (e.g., Meta Ads, GA, DV360)
 */
interface SheetData {
  id: string;                        // Unique identifier for the sheet
  name: string;                      // Display name shown in tab
  panels: PanelData[];               // Layout panels on this sheet
  visuals: CanvasVisualData[];       // Standalone visuals (not in panels)
  slotVisuals: SlotVisualsMap;       // Visuals placed inside panel slots
  slicers: SlicerData[];             // Filter slicers on this sheet
  textContainers: TextContainerData[]; // Text headers and logos
}

// ============================================================================
// FACTORY FUNCTIONS - Create new elements with default values
// ============================================================================

/**
 * Creates default placeholder data for new charts
 * Returns 3 empty data points to show chart structure
 */
const createDefaultData = (): DataPoint[] => [
  { id: crypto.randomUUID(), category: "Category 1", value: 0 },
  { id: crypto.randomUUID(), category: "Category 2", value: 0 },
  { id: crypto.randomUUID(), category: "Category 3", value: 0 },
];

/**
 * Creates default visual properties for new charts
 * Includes styling, colors, and display options
 */
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

/**
 * Creates a new visual (chart) with default settings
 * @param index - Position index for auto-layout
 * @param type - Chart type (bar, line, pie, etc.)
 */
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
  fieldMapping: { axis: [], values: [], tooltips: [] },
});

/**
 * Creates a new panel with specified layout
 * @param layoutType - Type of layout (single, 2-column, 2-row, etc.)
 * @param index - Position index for auto-layout
 */
const createNewPanel = (layoutType: LayoutType, index: number): PanelData => ({
  id: crypto.randomUUID(),
  layoutType,
  position: { x: 50 + (index % 2) * 450, y: 50 + Math.floor(index / 2) * 300 },
  size: { width: 400, height: 250 },
  slots: generateSlots(layoutType),
});

/**
 * Creates a new slicer (filter component) with default settings
 * @param type - Slicer type (dropdown, list, date-range, numeric-range)
 * @param field - Data field to filter on
 * @param fieldLabel - Display label for the field
 * @param index - Position index for auto-layout
 */
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

/**
 * Creates an empty sheet with no elements
 * @param name - Display name for the sheet tab
 */
const createEmptySheet = (name: string): SheetData => ({
  id: crypto.randomUUID(),
  name,
  panels: [],
  visuals: [],
  slotVisuals: new Map(),
  slicers: [],
  textContainers: [],
});

/**
 * Creates a new text container (header with optional logo)
 */
const createNewTextContainer = (): TextContainerData => ({
  id: crypto.randomUUID(),
  type: "header",
  content: "Dashboard Title",
  logoUrl: undefined,
  logoPosition: "left",
  position: { x: 0, y: 0 },
  size: { width: 500, height: 80 },
  fontSize: 24,
  fontWeight: "bold",
  textAlign: "left",
  snapToTop: true,
  matchWidth: true,
});

/**
 * Gets the default field for a slicer based on its type
 * @param type - Slicer type
 * @returns Object with field key and label
 */
const getDefaultSlicerField = (type: SlicerType): { field: string; label: string } => {
  switch (type) {
    case "date-range":
      return { field: "date", label: "Date" };
    case "numeric-range":
      return { field: "Spend", label: "Spend" };
    case "dropdown":
    case "list":
    default:
      return { field: "Campaign Name", label: "Campaign Name" };
  }
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

/**
 * DashboardContent - The main dashboard builder interface
 * 
 * This component manages:
 * - Multiple sheets with panels, visuals, and slicers
 * - Drag and drop for adding elements
 * - Chart configuration via dropdowns
 * - Data fetching from Supabase
 * - Dashboard saving functionality
 */
function DashboardContent() {
  // ========== HOOKS & CONTEXTS ==========
  const navigate = useNavigate();
  const { user, signOut } = useAuth();                                      // Authentication
  const { filters, addFilter, removeFilter, getFilteredData } = useFilters();  // Global filters
  const { crossFilter, setCrossFilter, clearCrossFilter } = useCrossFilter();  // Cross-filtering between charts
  
  // Fetch Meta Ads data from Supabase
  const { 
    data: metaAdsData = [], 
    isLoading: isLoadingMetaAds, 
    error: metaAdsError, 
    refetch: refetchMetaAds, 
    isFetching: isFetchingMetaAds 
  } = useMetaAdsData();

  // Sign out handler
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // ========== STATE MANAGEMENT ==========
  
  // Sheet state - each sheet contains panels, visuals, and slicers
  const [sheets, setSheets] = useState<SheetData[]>([
    createEmptySheet("Meta Ads"),
    createEmptySheet("GA"),
    createEmptySheet("DV360"),
  ]);
  const [activeSheetId, setActiveSheetId] = useState(sheets[0].id);
  
  // Selection state - tracks which element is currently selected
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [selectedVisualId, setSelectedVisualId] = useState<string | null>(null);
  const [selectedSlicerId, setSelectedSlicerId] = useState<string | null>(null);
  const [selectedTextContainerId, setSelectedTextContainerId] = useState<string | null>(null);
  
  // Drag state - tracks what type of element is being dragged
  const [isLayoutDragging, setIsLayoutDragging] = useState(false);
  const [isComponentDragging, setIsComponentDragging] = useState(false);
  const [isSlicerDragging, setIsSlicerDragging] = useState(false);
  const [isTextDragging, setIsTextDragging] = useState(false);
  const [draggingLayout, setDraggingLayout] = useState<LayoutType | null>(null);
  const [draggingComponent, setDraggingComponent] = useState<string | null>(null);
  const [draggingSlicerType, setDraggingSlicerType] = useState<SlicerType | null>(null);
  const [draggingTextType, setDraggingTextType] = useState<"text" | "logo" | null>(null);
  
  // Panel visibility state
  const [showConfigPanel, setShowConfigPanel] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  
  // Slicer state - stores ranges for date and numeric slicers
  const [slicerDateRanges, setSlicerDateRanges] = useState<Map<string, { start: Date | null; end: Date | null }>>(new Map());
  const [slicerNumericRanges, setSlicerNumericRanges] = useState<Map<string, { min: number; max: number }>>(new Map());

  // Chart configuration state - stores measure/groupBy/date for each visual
  const [visualConfigs, setVisualConfigs] = useState<Map<string, ChartConfig>>(new Map());

  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [dashboardName, setDashboardName] = useState("");
  const [dashboardDescription, setDashboardDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ========== DERIVED STATE ==========
  // Get current sheet's data for easy access
  const activeSheet = sheets.find((s) => s.id === activeSheetId);
  const panels = activeSheet?.panels || [];
  const visuals = activeSheet?.visuals || [];
  const slotVisuals = activeSheet?.slotVisuals || new Map<string, CanvasVisualData>();
  const slicers = activeSheet?.slicers || [];
  const textContainers = activeSheet?.textContainers || [];
  
  // Find selected elements
  const selectedVisual = visuals.find((v) => v.id === selectedVisualId) || 
    Array.from(slotVisuals.values()).find((v) => v.id === selectedVisualId);
  const selectedPanel = panels.find((p) => p.id === selectedPanelId);
  const selectedSlicer = slicers.find((s) => s.id === selectedSlicerId);
  const selectedTextContainer = textContainers.find((t) => t.id === selectedTextContainerId);

  // Configure drag sensors - requires 5px movement to start drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // ========== SAVE DASHBOARD HANDLER ==========
  /**
   * Saves the current dashboard to Supabase
   * Converts Map structures to plain objects for JSON serialization
   */
  const handleSaveDashboard = useCallback(async () => {
    // Validate required fields
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

      // Insert dashboard into Supabase
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

  // ========== SHEET HANDLERS ==========
  
  /** Selects a sheet and clears any selections */
  const handleSelectSheet = useCallback((id: string) => {
    setActiveSheetId(id);
    setSelectedPanelId(null);
    setSelectedVisualId(null);
    setSelectedSlicerId(null);
  }, []);

  /** Adds a new empty sheet to the dashboard */
  const handleAddSheet = useCallback(() => {
    const newSheet = createEmptySheet(`Sheet ${sheets.length + 1}`);
    setSheets((prev) => [...prev, newSheet]);
    setActiveSheetId(newSheet.id);
    setSelectedPanelId(null);
    setSelectedVisualId(null);
  }, [sheets.length]);

  /** Deletes a sheet (prevents deleting last sheet) */
  const handleDeleteSheet = useCallback((id: string) => {
    if (sheets.length <= 1) return;
    setSheets((prev) => prev.filter((s) => s.id !== id));
    if (activeSheetId === id) {
      const remaining = sheets.filter((s) => s.id !== id);
      setActiveSheetId(remaining[0].id);
    }
  }, [sheets, activeSheetId]);

  /** Renames a sheet */
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

  // Text container handlers
  const handleAddTextContainer = useCallback((position?: { x: number; y: number }) => {
    const newContainer = createNewTextContainer();
    if (position) {
      newContainer.position = position;
    }
    setSheets((prev) =>
      prev.map((s) =>
        s.id === activeSheetId ? { ...s, textContainers: [...s.textContainers, newContainer] } : s
      )
    );
    setSelectedTextContainerId(newContainer.id);
    setSelectedPanelId(null);
    setSelectedVisualId(null);
    setSelectedSlicerId(null);
    toast.success("Added header");
  }, [activeSheetId]);

  const handleUpdateTextContainer = useCallback((id: string, updates: Partial<TextContainerData>) => {
    setSheets((prev) =>
      prev.map((s) =>
        s.id === activeSheetId
          ? { ...s, textContainers: s.textContainers.map((t) => (t.id === id ? { ...t, ...updates } : t)) }
          : s
      )
    );
  }, [activeSheetId]);

  const handleDeleteTextContainer = useCallback((id: string) => {
    setSheets((prev) =>
      prev.map((s) =>
        s.id === activeSheetId ? { ...s, textContainers: s.textContainers.filter((t) => t.id !== id) } : s
      )
    );
    setSelectedTextContainerId((prev) => (prev === id ? null : prev));
  }, [activeSheetId]);

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

  // ========== VISUAL UPDATE HANDLERS ==========
  
  /** Updates the visual type (bar, line, pie, etc.) */
  const handleTypeChange = (type: VisualType) => {
    if (selectedVisualId) handleUpdateVisual(selectedVisualId, { type });
  };

  /** Updates the visual properties (colors, labels, etc.) */
  const handlePropertiesChange = (properties: VisualProperties) => {
    if (selectedVisualId) handleUpdateVisual(selectedVisualId, { properties });
  };

  // Field-drop handler removed - using dropdown configuration instead

  // Get available values for slicer field from database
  const getSlicerValues = (field: string): (string | number)[] => {
    if (metaAdsData.length === 0) return [];
    
    // Map slicer field names to database column names
    const fieldKeyMap: Record<string, keyof typeof metaAdsData[0]> = {
      // Legacy field names
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
      // Group By dimensions
      "Campaign Name": "campaign_name",
      "Ad Set Name": "ad_set_name",
      "Platform": "campaign_name", // Placeholder - using campaign_name as proxy
      "Campaign Category": "campaign_name",
      "Ad Category": "campaign_name",
      "Ad Format": "campaign_name",
      "Ad Name": "campaign_name",
      "Ad Set Label": "ad_set_name",
      "Ad Set Type": "ad_set_name",
      "Ad Type": "campaign_name",
      "Age": "campaign_name",
      "Campaign Label": "campaign_name",
      "Campaign Type": "campaign_name",
      "Device": "campaign_name",
      "Gender": "campaign_name",
      // Measures (for numeric range)
      "Clicks": "clicks",
      "Spend": "spend",
      "Impressions": "impressions",
      "CTR": "ctr",
      "CPC": "cpc",
      "CPM": "cpm",
      "Conversions": "conversions",
      "ROAS": "roas",
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
  const getTimePeriodKey = useCallback((dateStr: string, granularity: TimeGranularity): string => {
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
  }, []);

  // Field mapping handlers removed - using dropdown configuration instead

  // ========== CHART CONFIG HANDLER ==========
  /**
   * Handles chart configuration changes from the 3-dropdown interface
   * Transforms raw database data into chart-ready format based on:
   * - measure: Which metric to aggregate (Clicks, Spend, etc.)
   * - groupBy: Which dimension to group by (Campaign, Ad Set, etc.)
   * - dateGranularity: Time period grouping (Day, Week, Month, etc.)
   */
  const handleChartConfigChange = useCallback((visualId: string, config: ChartConfig) => {
    // Save config state for persistence
    setVisualConfigs(prev => new Map(prev).set(visualId, config));
    
    const visual = visuals.find((v) => v.id === visualId) ||
      Array.from(slotVisuals.values()).find((v) => v.id === visualId);

    // Handle table type - uses selectedColumns instead of measure/groupBy
    if (visual?.type === "table") {
      const selectedColumns = config.selectedColumns || [];
      if (selectedColumns.length === 0 || metaAdsData.length === 0) {
        handleUpdateVisual(visualId, { data: [] });
        return;
      }

      // Map UI column names to database field names
      const columnToDbField: Record<string, string> = {
        // Measures
        "Clicks": "clicks",
        "Spend": "spend",
        "Impressions": "impressions",
        "Impression": "impressions",
        "CTR": "ctr",
        "CPC": "cpc",
        "CPM": "cpm",
        "Conversions": "conversions",
        "ROAS": "roas",
        "Leads": "conversions",
        // Dimensions
        "Campaign Name": "campaign_name",
        "Ad Set Name": "ad_set_name",
        "Ad Name": "ad_set_name",
        "Platform": "campaign_name",
        "Device": "campaign_name",
        "Age": "campaign_name",
        "Gender": "campaign_name",
      };

      // Build table data with selected columns only
      const tableData = metaAdsData.slice(0, 50).map((record) => {
        const row: Record<string, string | number> = { id: crypto.randomUUID() };
        selectedColumns.forEach((col) => {
          const dbField = columnToDbField[col] || col.toLowerCase().replace(/ /g, '_');
          const value = record[dbField as keyof typeof record];
          row[col] = value !== undefined ? value : '';
        });
        // Add category and value for compatibility with DataPoint
        const firstDim = selectedColumns.find(c => columnToDbField[c] && ["campaign_name", "ad_set_name"].includes(columnToDbField[c]));
        const firstMeasure = selectedColumns.find(c => columnToDbField[c] && ["clicks", "spend", "impressions", "ctr", "cpc", "cpm", "conversions", "roas"].includes(columnToDbField[c]));
        row.category = firstDim ? String(row[firstDim]) : String(record.campaign_name);
        row.value = firstMeasure ? Number(row[firstMeasure]) : 0;
        return row as DataPoint;
      });

      handleUpdateVisual(visualId, {
        data: tableData,
        properties: {
          ...visual?.properties!,
          title: `Data Table (${selectedColumns.length} columns)`,
        },
      });

      toast.success(`Loaded ${selectedColumns.length} columns`);
      return;
    }

    // For other chart types, require measure and groupBy
    if (!config.measure || !config.groupBy || metaAdsData.length === 0) return;

    // Map UI dropdown values to database column names
    const measureToDbField: Record<string, string> = {
      "Clicks": "clicks",
      "Spend": "spend",
      "Impression": "impressions",
      "Impressions": "impressions",
      "CTR": "ctr",
      "CPC": "cpc",
      "CPM": "cpm",
      "Leads": "conversions",
      "Conversions": "conversions",
      "ROAS": "roas",
    };

    const groupByToDbField: Record<string, string> = {
      "Campaign Name": "campaign_name",
      "Ad Set Name": "ad_set_name",
      "Ad Name": "ad_set_name",
      "Platform": "campaign_name",
      "Device": "campaign_name",
      "Age": "campaign_name",
      "Gender": "campaign_name",
    };

    // Get database field keys
    const measureKey = measureToDbField[config.measure] || "clicks";
    // For measure2, use fallback to "spend" if not mapped (so multiline still works)
    const measure2Key = config.measure2 ? (measureToDbField[config.measure2] || "spend") : null;
    const groupByKey = groupByToDbField[config.groupBy] || "campaign_name";
    const timeGranularity = config.dateGranularity as TimeGranularity;
    const isMultiLine = visual?.type === "multiline" && config.measure2;

    // Aggregate data based on groupBy and date granularity
    // For multiline, we need to aggregate both measures
    const aggregatedData = new Map<string, { sum: number; count: number; sum2: number; count2: number }>();

    metaAdsData.forEach((record) => {
      let groupValue = String(record[groupByKey as keyof typeof record] || "Unknown");
      
      // If date granularity is set, append time period
      if (timeGranularity !== "none" && record.date) {
        const timePeriod = getTimePeriodKey(record.date, timeGranularity);
        groupValue = `${groupValue} - ${timePeriod}`;
      }

      const rawValue = record[measureKey as keyof typeof record];
      const value = typeof rawValue === "number" ? rawValue : 0;

      // Get second measure value if multiline
      const rawValue2 = measure2Key ? record[measure2Key as keyof typeof record] : 0;
      const value2 = typeof rawValue2 === "number" ? rawValue2 : 0;

      if (!aggregatedData.has(groupValue)) {
        aggregatedData.set(groupValue, { sum: 0, count: 0, sum2: 0, count2: 0 });
      }
      const entry = aggregatedData.get(groupValue)!;
      entry.sum += value;
      entry.count += 1;
      entry.sum2 += value2;
      entry.count2 += 1;
    });

    // Helper to determine if measure is a rate/average field
    const isRateField = (key: string) => ["ctr", "cpc", "cpm", "roas"].includes(key);

    // Create chart data points
    const newData: DataPoint[] = Array.from(aggregatedData.entries())
      .map(([category, { sum, count, sum2, count2 }]) => {
        const dataPoint: DataPoint = {
          id: crypto.randomUUID(),
          category: category.slice(0, 30),
          value: Math.round((isRateField(measureKey) ? sum / count : sum) * 100) / 100,
        };
        
        // Add value2 for multiline charts
        if (isMultiLine && measure2Key) {
          dataPoint.value2 = Math.round((isRateField(measure2Key) ? sum2 / count2 : sum2) * 100) / 100;
        }
        
        return dataPoint;
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 15); // Limit to top 15 for readability

    // Build title
    const timeLabel = config.dateGranularity !== "none" ? ` by ${config.dateGranularity}` : "";
    const title = isMultiLine && config.measure2
      ? `${config.measure} vs ${config.measure2} by ${config.groupBy}${timeLabel}`
      : `${config.measure} by ${config.groupBy}${timeLabel}`;

    // Pass value field names for legend
    const valueFieldNames = isMultiLine && config.measure2
      ? [config.measure, config.measure2]
      : [config.measure];

    handleUpdateVisual(visualId, {
      data: newData,
      properties: {
        ...visual?.properties!,
        title,
      },
      valueFieldNames,
    });

    toast.success(`Loaded ${title}`);
  }, [metaAdsData, visuals, slotVisuals, handleUpdateVisual, getTimePeriodKey]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;
    const data = active.data.current;

    // Set dragging state based on element type
    if (id.startsWith("layout-")) {
      setIsLayoutDragging(true);
      setDraggingLayout(data?.layout?.type || null);
    } else if (id.startsWith("component-")) {
      setIsComponentDragging(true);
      setDraggingComponent(data?.componentType || null);
    } else if (id.startsWith("slicer-type-")) {
      setIsSlicerDragging(true);
      setDraggingSlicerType(data?.slicerType || null);
    } else if (id.startsWith("text-type-")) {
      setIsTextDragging(true);
      setDraggingTextType(data?.textType || null);
    }
    // Note: field dragging removed - using dropdown config instead
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    const activeId = active.id as string;
    const activeData = active.data.current;

    // Reset all dragging states
    setIsLayoutDragging(false);
    setIsComponentDragging(false);
    setIsSlicerDragging(false);
    setIsTextDragging(false);
    setDraggingLayout(null);
    setDraggingComponent(null);
    setDraggingSlicerType(null);
    setDraggingTextType(null);

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

    // Handle text container type drop on canvas
    if (activeId.startsWith("text-type-") && over) {
      const overId = over.id as string;
      if (overId === "canvas-drop" || !overId.startsWith("slot-") && !overId.startsWith("drop-") && !overId.startsWith("visual-")) {
        handleAddTextContainer({ x: 0, y: 0 });
      }
      return;
    }

    // Handle text container drag (move)
    if (activeId.startsWith("text-") && !activeId.startsWith("text-type-")) {
      const containerId = activeId.replace("text-", "");
      const container = textContainers.find((t) => t.id === containerId);
      if (container && !container.snapToTop && !container.matchWidth) {
        handleUpdateTextContainer(containerId, {
          position: {
            x: container.position.x + delta.x,
            y: container.position.y + delta.y,
          },
        });
      }
      return;
    }

    // Field dropping removed - using dropdown configuration instead

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
                onAddSlicer={handleAddSlicer}
                onChangeVisualType={handleTypeChange}
                selectedVisualType={selectedVisual?.type || null}
                onAddTextContainer={handleAddTextContainer}
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

            {/* Canvas with Slicers and Text Containers */}
            <div className="flex-1 p-4 bg-muted/30 canvas-grid overflow-auto relative">
              {/* Render Text Containers */}
              {textContainers.map((container) => (
                <TextContainer
                  key={container.id}
                  container={container}
                  isSelected={selectedTextContainerId === container.id}
                  canvasWidth={800}
                  onSelect={() => {
                    setSelectedTextContainerId(container.id);
                    setSelectedPanelId(null);
                    setSelectedVisualId(null);
                    setSelectedSlicerId(null);
                  }}
                  onUpdate={(updates) => handleUpdateTextContainer(container.id, updates)}
                  onDelete={() => handleDeleteTextContainer(container.id)}
                />
              ))}

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
                isFieldDragging={false}
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
              {/* Data Fields panel removed - using dropdown configuration */}
              
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
                    {/* Chart Configuration Panel - Shown when a visual is selected */}
                    {selectedVisual ? (
                      <ChartConfigDropdowns
                        config={visualConfigs.get(selectedVisual.id) || { measure: "", groupBy: "", dateGranularity: "none" }}
                        onChange={(config) => handleChartConfigChange(selectedVisual.id, config)}
                        visualType={selectedVisual.type}
                      />
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
                      <SlicerSettingsPanel 
                        slicer={selectedSlicer} 
                        onUpdate={(updates) => handleUpdateSlicer(selectedSlicer.id, updates)} 
                      />
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
        {draggingTextType && (
          <div className="flex items-center gap-2 px-4 py-3 bg-card border rounded-lg shadow-lg text-sm font-medium">
            <Type className="h-4 w-4 text-primary" />
            <span className="capitalize">{draggingTextType === "text" ? "Text Header" : "Logo"}</span>
          </div>
        )}
        {/* Field drag overlay removed - using dropdown configuration */}
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
