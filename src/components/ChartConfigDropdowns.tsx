/**
 * ChartConfigDropdowns Component
 * 
 * This component provides a 3-dropdown interface for configuring chart data:
 * - Measure: The metric to display (Clicks, Spend, CTR, etc.)
 * - GroupBy: The dimension to group data by (Campaign Name, Ad Set, etc.)
 * - Date: Time granularity for data aggregation (Day, Week, Month, etc.)
 * 
 * Used in the right sidebar when a chart visual is selected.
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart3 } from "lucide-react";

// ============================================================================
// CONSTANTS - Meta Ads Metrics and Dimensions
// ============================================================================

/**
 * All available Meta Ads metrics that can be measured
 * These come from the Meta Ads API and represent different performance indicators
 */
export const metaMetrics = [
  "100% Video View",
  "25% Video View",
  "50% Video View",
  "75% Video View",
  "Brand Suitability Blocked Ads",
  "Brand Suitability Failed Ads",
  "Clicks",
  "CPC",
  "CPCV",
  "CPE",
  "CPL",
  "CPM",
  "CPV",
  "CTR",
  "Engagement Rate",
  "Engagements",
  "Impression",
  "Impressions (Verification)",
  "Landing Page View",
  "Leads",
  "Measurable Impressions (Verification)",
  "Measurable Rate (Verification)",
  "Spend",
  "Thruplays",
  "Tracked Ads",
  "Video Spend",
  "Video Starts",
  "Video Views",
  "Viewability Impressions (Verification)",
  "Viewability Rate",
  "Viewabillity Rate (Verification)",
  "VTR",
] as const;

/**
 * All available dimensions to group metrics by
 * These represent different ways to slice/segment the data
 */
export const groupByDimensions = [
  "Ad Category",
  "Ad Format",
  "Ad Name",
  "Ad Set Label",
  "Ad Set Name",
  "Ad Set Type",
  "Ad Type",
  "Age",
  "Campaign Category",
  "Campaign Label",
  "Campaign Name",
  "Campaign Type",
  "Device",
  "Gender",
  "Platform",
] as const;

/**
 * Date granularity options for time-based aggregation
 * Controls how data is grouped over time periods
 */
export const dateGranularities = [
  { value: "none", label: "No Date Split" },   // No time grouping
  { value: "day", label: "Day" },              // Daily aggregation
  { value: "week", label: "Week" },            // Weekly aggregation
  { value: "month", label: "Month" },          // Monthly aggregation
  { value: "quarter", label: "Quarter" },      // Quarterly aggregation
  { value: "year", label: "Year" },            // Yearly aggregation
] as const;

// ============================================================================
// TYPES
// ============================================================================

/** Type for available metrics (derived from metaMetrics array) */
export type MetaMetric = typeof metaMetrics[number];

/** Type for available groupBy dimensions (derived from groupByDimensions array) */
export type GroupByDimension = typeof groupByDimensions[number];

/** Type for date granularity values */
export type DateGranularity = typeof dateGranularities[number]["value"];

/**
 * Configuration object for a chart
 * Stores the user's selections for measure, groupBy, and date
 */
export interface ChartConfig {
  measure: MetaMetric | "";           // Selected metric (empty string = not selected)
  groupBy: GroupByDimension | "";     // Selected dimension (empty string = not selected)
  dateGranularity: DateGranularity;   // Selected date split (defaults to "none")
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface ChartConfigDropdownsProps {
  config: ChartConfig;                        // Current configuration state
  onChange: (config: ChartConfig) => void;    // Callback when config changes
  visualType?: string;                        // Type of visual (for conditional rendering)
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * ChartConfigDropdowns - Main dropdown interface for chart configuration
 * 
 * @param config - Current chart configuration
 * @param onChange - Callback fired when any dropdown value changes
 * @param visualType - Type of visual for conditional UI (e.g., "pie" hides date)
 */
export function ChartConfigDropdowns({ config, onChange, visualType }: ChartConfigDropdownsProps) {
  
  // Check if this is a pie chart - pie charts have different field labels
  const isPieChart = visualType === "pie";
  
  // Handler for measure dropdown change
  const handleMeasureChange = (value: string) => {
    onChange({ ...config, measure: value as MetaMetric });
  };

  // Handler for groupBy dropdown change
  const handleGroupByChange = (value: string) => {
    onChange({ ...config, groupBy: value as GroupByDimension });
  };

  // Handler for date granularity dropdown change
  const handleDateChange = (value: string) => {
    onChange({ ...config, dateGranularity: value as DateGranularity });
  };

  return (
    <div className="space-y-4 overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-2 pb-3 border-b">
        <BarChart3 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Chart Configuration
        </h3>
      </div>

      {/* Measure Dropdown - Select which metric to display */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Measure
        </Label>
        <Select value={config.measure} onValueChange={handleMeasureChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a measure..." />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {metaMetrics.map((metric) => (
              <SelectItem key={metric} value={metric}>
                {metric}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* GroupBy/Legend Dropdown - Label changes for pie charts */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {isPieChart ? "Legend" : "Group By"}
        </Label>
        <Select value={config.groupBy} onValueChange={handleGroupByChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isPieChart ? "Select legend..." : "Select dimension..."} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {groupByDimensions.map((dimension) => (
              <SelectItem key={dimension} value={dimension}>
                {dimension}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Dropdown - Hidden for pie charts */}
      {!isPieChart && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Date
          </Label>
          <Select value={config.dateGranularity} onValueChange={handleDateChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select date split..." />
            </SelectTrigger>
            <SelectContent>
              {dateGranularities.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Configuration Summary - Shows current selection in readable format */}
      {config.measure && config.groupBy && (
        <div className="pt-3 border-t">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{config.measure}</span> by{" "}
            <span className="font-medium text-foreground">{config.groupBy}</span>
            {!isPieChart && config.dateGranularity !== "none" && (
              <> split by <span className="font-medium text-foreground">{config.dateGranularity}</span></>
            )}
          </p>
        </div>
      )}
    </div>
  );
}