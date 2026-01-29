import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { X, GripVertical, Sigma, Hash, Type, Calendar, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DataField, FieldMapping, AggregationType, TimeGranularity } from "@/types/dashboard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FieldWellProps {
  label: string;
  wellType: keyof FieldMapping;
  fields: DataField[];
  onRemoveField: (fieldId: string) => void;
  onAggregationChange?: (fieldId: string, aggregation: AggregationType) => void;
  onTimeGranularityChange?: (fieldId: string, granularity: TimeGranularity) => void;
  allowMultiple?: boolean;
}

function FieldWell({
  label,
  wellType,
  fields,
  onRemoveField,
  onAggregationChange,
  onTimeGranularityChange,
  allowMultiple = true,
}: FieldWellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `well-${wellType}`,
    data: { wellType },
  });

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
        {label}
      </label>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[44px] rounded-lg border-2 border-dashed p-2.5 transition-all overflow-hidden",
          isOver && "border-primary bg-primary/5",
          fields.length === 0 && "border-border/50",
          fields.length > 0 && "border-transparent bg-muted/30"
        )}
      >
        {fields.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-1.5">
            Drop field here
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {fields.map((field) => (
              <FieldChip
                key={field.id}
                field={field}
                onRemove={() => onRemoveField(field.id)}
                showAggregation={wellType === "values"}
                onAggregationChange={onAggregationChange}
                onTimeGranularityChange={onTimeGranularityChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface FieldChipProps {
  field: DataField & { aggregation?: AggregationType; timeGranularity?: TimeGranularity };
  onRemove: () => void;
  showAggregation?: boolean;
  onAggregationChange?: (fieldId: string, aggregation: AggregationType) => void;
  onTimeGranularityChange?: (fieldId: string, granularity: TimeGranularity) => void;
}

function FieldChip({
  field,
  onRemove,
  showAggregation,
  onAggregationChange,
  onTimeGranularityChange,
}: FieldChipProps) {
  const [aggregation, setAggregation] = useState<AggregationType>(
    field.aggregation || "sum"
  );
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>(
    field.timeGranularity || "none"
  );

  const handleAggregationChange = (value: AggregationType) => {
    setAggregation(value);
    onAggregationChange?.(field.id, value);
  };

  const handleTimeGranularityChange = (value: TimeGranularity) => {
    setTimeGranularity(value);
    onTimeGranularityChange?.(field.id, value);
  };

  const aggregationLabels: Record<AggregationType, string> = {
    sum: "Sum",
    avg: "Average",
    count: "Count",
    min: "Min",
    max: "Max",
    distinctCount: "Distinct Count",
  };

  const aggregationSymbols: Record<AggregationType, string> = {
    sum: "Σ",
    avg: "μ",
    count: "#",
    min: "↓",
    max: "↑",
    distinctCount: "∑#",
  };

  const timeGranularityLabels: Record<TimeGranularity, string> = {
    none: "No time grouping",
    day: "by Day",
    week: "by Week",
    month: "by Month",
    quarter: "by Quarter",
    year: "by Year",
  };

  const getDisplayLabel = () => {
    if (timeGranularity === "none") {
      return `${aggregationSymbols[aggregation]}`;
    }
    return `${aggregationSymbols[aggregation]} ${timeGranularityLabels[timeGranularity]}`;
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium max-w-full",
        field.type === "metric"
          ? "bg-primary/10 text-primary border border-primary/20"
          : "bg-secondary text-secondary-foreground border border-border"
      )}
    >
      <GripVertical className="h-3.5 w-3.5 opacity-40 flex-shrink-0" />
      {field.type === "metric" ? (
        <Hash className="h-3.5 w-3.5 flex-shrink-0" />
      ) : (
        <Type className="h-3.5 w-3.5 flex-shrink-0" />
      )}
      <span className="truncate min-w-0 max-w-[80px]">{field.name}</span>
      
      {showAggregation && field.type === "metric" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded hover:bg-foreground/10 transition-colors flex-shrink-0">
              <span className="font-mono text-xs">{getDisplayLabel()}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-popover z-50">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Aggregation
            </DropdownMenuLabel>
            {(Object.keys(aggregationLabels) as AggregationType[]).map((agg) => (
              <DropdownMenuItem
                key={agg}
                onClick={() => handleAggregationChange(agg)}
                className="flex items-center justify-between"
              >
                <span>{aggregationLabels[agg]} ({aggregationSymbols[agg]})</span>
                {aggregation === agg && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Time Grouping
            </DropdownMenuLabel>
            {(Object.keys(timeGranularityLabels) as TimeGranularity[]).map((gran) => (
              <DropdownMenuItem
                key={gran}
                onClick={() => handleTimeGranularityChange(gran)}
                className="flex items-center justify-between"
              >
                <span>{gran === "none" ? "None" : timeGranularityLabels[gran].replace("by ", "")}</span>
                {timeGranularity === gran && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      <button
        onClick={onRemove}
        className="ml-1 p-0.5 hover:bg-foreground/10 rounded transition-colors flex-shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface FieldWellsProps {
  fieldMapping: FieldMapping;
  onFieldMappingChange: (mapping: FieldMapping) => void;
}

export function FieldWells({ fieldMapping, onFieldMappingChange }: FieldWellsProps) {
  const handleRemoveField = (wellType: keyof FieldMapping, fieldId: string) => {
    const newMapping = { ...fieldMapping };
    
    if (wellType === "legend") {
      if (newMapping.legend?.id === fieldId) {
        newMapping.legend = undefined;
      }
    } else {
      const fields = newMapping[wellType] as DataField[] | undefined;
      if (fields) {
        newMapping[wellType] = fields.filter((f) => f.id !== fieldId) as never;
      }
    }
    
    onFieldMappingChange(newMapping);
  };

  const handleAggregationChange = (fieldId: string, aggregation: AggregationType) => {
    const newMapping = { ...fieldMapping };
    if (newMapping.values) {
      newMapping.values = newMapping.values.map((f) =>
        f.id === fieldId ? { ...f, aggregation } : f
      ) as DataField[];
    }
    onFieldMappingChange(newMapping);
  };

  const handleTimeGranularityChange = (fieldId: string, timeGranularity: TimeGranularity) => {
    const newMapping = { ...fieldMapping };
    if (newMapping.values) {
      newMapping.values = newMapping.values.map((f) =>
        f.id === fieldId ? { ...f, timeGranularity } : f
      ) as DataField[];
    }
    onFieldMappingChange(newMapping);
  };

  return (
    <div className="space-y-4 overflow-hidden">
      <div className="flex items-center gap-2 pb-3 border-b">
        <Sigma className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Field Wells
        </h3>
      </div>

      <FieldWell
        label="Axis"
        wellType="axis"
        fields={fieldMapping.axis || []}
        onRemoveField={(id) => handleRemoveField("axis", id)}
      />

      <FieldWell
        label="Values"
        wellType="values"
        fields={fieldMapping.values || []}
        onRemoveField={(id) => handleRemoveField("values", id)}
        onAggregationChange={handleAggregationChange}
        onTimeGranularityChange={handleTimeGranularityChange}
      />

      <FieldWell
        label="Legend"
        wellType="legend"
        fields={fieldMapping.legend ? [fieldMapping.legend] : []}
        onRemoveField={(id) => handleRemoveField("legend", id)}
        allowMultiple={false}
      />

      <FieldWell
        label="Tooltips"
        wellType="tooltips"
        fields={fieldMapping.tooltips || []}
        onRemoveField={(id) => handleRemoveField("tooltips", id)}
      />
    </div>
  );
}
