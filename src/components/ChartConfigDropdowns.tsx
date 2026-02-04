/**
 * ChartConfigDropdowns Component
 * 
 * This component provides visual-type-specific configuration interfaces:
 * - Standard charts: Measure, GroupBy, Date dropdowns
 * - Multi-Line: Measure 1, Measure 2, GroupBy, Date
 * - Table: Select Columns (multi-select)
 * - Card/KPI: Measure, Calculation
 * - Pie: Measure, Legend (GroupBy), no date
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart3, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

// ============================================================================
// CONSTANTS - Meta Ads Metrics and Dimensions
// ============================================================================

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

export const dateGranularities = [
  { value: "none", label: "No Date Split" },
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
] as const;

export const calculationTypes = [
  { value: "sum", label: "Sum" },
  { value: "average", label: "Average" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
  { value: "count", label: "Count" },
  { value: "last", label: "Last Value" },
] as const;

export const sortOptions = [
  { value: "value-desc", label: "Value (High to Low)" },
  { value: "value-asc", label: "Value (Low to High)" },
  { value: "name-asc", label: "Name (A to Z)" },
  { value: "name-desc", label: "Name (Z to A)" },
  { value: "none", label: "No Sorting" },
] as const;

// ============================================================================
// TYPES
// ============================================================================

export type MetaMetric = typeof metaMetrics[number];
export type GroupByDimension = typeof groupByDimensions[number];
export type DateGranularity = typeof dateGranularities[number]["value"];
export type CalculationType = typeof calculationTypes[number]["value"];
export type SortOption = typeof sortOptions[number]["value"];

export interface ChartConfig {
  measure: MetaMetric | "";
  measure2?: MetaMetric | "";  // For multi-line charts
  groupBy: GroupByDimension | "";
  dateGranularity: DateGranularity;
  calculation?: CalculationType;  // For KPI cards
  selectedColumns?: string[];  // For tables
  sortBy?: SortOption;  // For sorting data
  matrixRows?: GroupByDimension[];  // For matrix - row dimensions
  matrixColumns?: GroupByDimension[];  // For matrix - column dimensions
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface ChartConfigDropdownsProps {
  config: ChartConfig;
  onChange: (config: ChartConfig) => void;
  visualType?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ChartConfigDropdowns({ config, onChange, visualType }: ChartConfigDropdownsProps) {
  const isPieChart = visualType === "pie";
  const isMultiLineChart = visualType === "multiline";
  const isTableChart = visualType === "table";
  const isCardChart = visualType === "card";
  const isMatrixChart = visualType === "matrix";
  const isStandardChart = ["bar", "line", "area", "combo", "waterfall", "treemap", "funnel", "scatter"].includes(visualType || "");

  const handleMeasureChange = (value: string) => {
    onChange({ ...config, measure: value as MetaMetric });
  };

  const handleMeasure2Change = (value: string) => {
    onChange({ ...config, measure2: value as MetaMetric });
  };

  const handleGroupByChange = (value: string) => {
    onChange({ ...config, groupBy: value as GroupByDimension });
  };

  const handleDateChange = (value: string) => {
    onChange({ ...config, dateGranularity: value as DateGranularity });
  };

  const handleCalculationChange = (value: string) => {
    onChange({ ...config, calculation: value as CalculationType });
  };

  const handleColumnToggle = (column: string) => {
    const current = config.selectedColumns || [];
    const updated = current.includes(column)
      ? current.filter(c => c !== column)
      : [...current, column];
    onChange({ ...config, selectedColumns: updated });
  };

  const handleSortChange = (value: string) => {
    onChange({ ...config, sortBy: value as SortOption });
  };

  const handleMatrixRowToggle = (dim: string) => {
    const current = config.matrixRows || [];
    const updated = current.includes(dim as GroupByDimension)
      ? current.filter(d => d !== dim)
      : [...current, dim as GroupByDimension];
    onChange({ ...config, matrixRows: updated });
  };

  const handleMatrixColumnToggle = (dim: string) => {
    const current = config.matrixColumns || [];
    const updated = current.includes(dim as GroupByDimension)
      ? current.filter(d => d !== dim)
      : [...current, dim as GroupByDimension];
    onChange({ ...config, matrixColumns: updated });
  };

  // All available columns for table = measures + dimensions
  const allColumns = [...metaMetrics, ...groupByDimensions];

  // ========== MATRIX CONFIG ==========
  if (isMatrixChart) {
    return (
      <div className="space-y-4 overflow-hidden">
        <div className="flex items-center gap-2 pb-3 border-b">
          <BarChart3 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Matrix Configuration
          </h3>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Values (Measure)
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

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Row Fields
          </Label>
          <ScrollArea className="h-[150px] border rounded-md p-2">
            <div className="space-y-1">
              {groupByDimensions.map((dim) => (
                <div key={dim} className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id={`row-${dim}`}
                    checked={(config.matrixRows || []).includes(dim)}
                    onCheckedChange={() => handleMatrixRowToggle(dim)}
                  />
                  <label htmlFor={`row-${dim}`} className="text-sm cursor-pointer">
                    {dim}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Column Fields
          </Label>
          <ScrollArea className="h-[150px] border rounded-md p-2">
            <div className="space-y-1">
              {groupByDimensions.map((dim) => (
                <div key={dim} className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id={`col-${dim}`}
                    checked={(config.matrixColumns || []).includes(dim)}
                    onCheckedChange={() => handleMatrixColumnToggle(dim)}
                  />
                  <label htmlFor={`col-${dim}`} className="text-sm cursor-pointer">
                    {dim}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {config.measure && ((config.matrixRows?.length || 0) > 0 || (config.matrixColumns?.length || 0) > 0) && (
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{config.measure}</span>
              {(config.matrixRows?.length || 0) > 0 && (
                <> by <span className="font-medium text-foreground">{config.matrixRows?.length} row(s)</span></>
              )}
              {(config.matrixColumns?.length || 0) > 0 && (
                <> × <span className="font-medium text-foreground">{config.matrixColumns?.length} column(s)</span></>
              )}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ========== CARD / KPI CONFIG ==========
  if (isCardChart) {
    return (
      <div className="space-y-4 overflow-hidden">
        <div className="flex items-center gap-2 pb-3 border-b">
          <BarChart3 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            KPI Configuration
          </h3>
        </div>

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

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Calculation
          </Label>
          <Select value={config.calculation || "sum"} onValueChange={handleCalculationChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select calculation..." />
            </SelectTrigger>
            <SelectContent>
              {calculationTypes.map((calc) => (
                <SelectItem key={calc.value} value={calc.value}>
                  {calc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {config.measure && (
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{config.calculation || "Sum"}</span> of{" "}
              <span className="font-medium text-foreground">{config.measure}</span>
            </p>
          </div>
        )}
      </div>
    );
  }

  // ========== TABLE CONFIG ==========
  if (isTableChart) {
    return (
      <div className="space-y-4 overflow-hidden">
        <div className="flex items-center gap-2 pb-3 border-b">
          <BarChart3 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Table Configuration
          </h3>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Select Columns
          </Label>
          <ScrollArea className="h-[300px] border rounded-md p-2">
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground mb-2 uppercase">Measures</div>
              {metaMetrics.map((metric) => (
                <div key={metric} className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id={`col-${metric}`}
                    checked={(config.selectedColumns || []).includes(metric)}
                    onCheckedChange={() => handleColumnToggle(metric)}
                  />
                  <label htmlFor={`col-${metric}`} className="text-sm cursor-pointer">
                    {metric}
                  </label>
                </div>
              ))}
              <div className="text-xs font-medium text-muted-foreground mt-4 mb-2 uppercase">Dimensions</div>
              {groupByDimensions.map((dim) => (
                <div key={dim} className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id={`col-${dim}`}
                    checked={(config.selectedColumns || []).includes(dim)}
                    onCheckedChange={() => handleColumnToggle(dim)}
                  />
                  <label htmlFor={`col-${dim}`} className="text-sm cursor-pointer">
                    {dim}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {(config.selectedColumns?.length || 0) > 0 && (
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{config.selectedColumns?.length}</span> columns selected
            </p>
          </div>
        )}
      </div>
    );
  }

  // ========== MULTI-LINE CHART CONFIG ==========
  if (isMultiLineChart) {
    return (
      <div className="space-y-4 overflow-hidden">
        <div className="flex items-center gap-2 pb-3 border-b">
          <BarChart3 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Multi-Line Configuration
          </h3>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Measure 1
          </Label>
          <Select value={config.measure} onValueChange={handleMeasureChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select first measure..." />
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

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Measure 2
          </Label>
          <Select value={config.measure2 || ""} onValueChange={handleMeasure2Change}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select second measure..." />
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

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Group By
          </Label>
          <Select value={config.groupBy} onValueChange={handleGroupByChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select dimension..." />
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

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Sort By
          </Label>
          <Select value={config.sortBy || "value-desc"} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select sort order..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {config.measure && config.measure2 && config.groupBy && (
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              Comparing <span className="font-medium text-foreground">{config.measure}</span> vs{" "}
              <span className="font-medium text-foreground">{config.measure2}</span> by{" "}
              <span className="font-medium text-foreground">{config.groupBy}</span>
            </p>
          </div>
        )}
      </div>
    );
  }

  // ========== PIE CHART CONFIG ==========
  if (isPieChart) {
    return (
      <div className="space-y-4 overflow-hidden">
        <div className="flex items-center gap-2 pb-3 border-b">
          <BarChart3 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Pie Chart Configuration
          </h3>
        </div>

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

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Legend
          </Label>
          <Select value={config.groupBy} onValueChange={handleGroupByChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select legend..." />
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

        {config.measure && config.groupBy && (
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{config.measure}</span> by{" "}
              <span className="font-medium text-foreground">{config.groupBy}</span>
            </p>
          </div>
        )}
      </div>
    );
  }

  // ========== STANDARD CHART CONFIG (Bar, Line, Area, Combo, etc.) ==========
  return (
    <div className="space-y-4 overflow-hidden">
      <div className="flex items-center gap-2 pb-3 border-b">
        <BarChart3 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Chart Configuration
        </h3>
      </div>

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

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Group By
        </Label>
        <Select value={config.groupBy} onValueChange={handleGroupByChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select dimension..." />
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

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Sort By
        </Label>
        <Select value={config.sortBy || "value-desc"} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select sort order..." />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {config.measure && config.groupBy && (
        <div className="pt-3 border-t">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{config.measure}</span> by{" "}
            <span className="font-medium text-foreground">{config.groupBy}</span>
            {config.dateGranularity !== "none" && (
              <> split by <span className="font-medium text-foreground">{config.dateGranularity}</span></>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
