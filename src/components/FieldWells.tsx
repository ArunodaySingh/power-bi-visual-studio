import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { X, GripVertical, Sigma, Hash, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DataField, FieldMapping, AggregationType } from "@/types/dashboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FieldWellProps {
  label: string;
  wellType: keyof FieldMapping;
  fields: DataField[];
  onRemoveField: (fieldId: string) => void;
  onAggregationChange?: (fieldId: string, aggregation: AggregationType) => void;
  allowMultiple?: boolean;
}

function FieldWell({
  label,
  wellType,
  fields,
  onRemoveField,
  onAggregationChange,
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface FieldChipProps {
  field: DataField & { aggregation?: AggregationType };
  onRemove: () => void;
  showAggregation?: boolean;
  onAggregationChange?: (fieldId: string, aggregation: AggregationType) => void;
}

function FieldChip({
  field,
  onRemove,
  showAggregation,
  onAggregationChange,
}: FieldChipProps) {
  const [aggregation, setAggregation] = useState<AggregationType>(
    field.aggregation || "sum"
  );

  const handleAggregationChange = (value: AggregationType) => {
    setAggregation(value);
    onAggregationChange?.(field.id, value);
  };

  const aggregationLabels: Record<AggregationType, string> = {
    sum: "Σ",
    avg: "μ",
    count: "#",
    min: "↓",
    max: "↑",
    distinctCount: "∑#",
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
      <span className="truncate flex-1 min-w-0 max-w-[100px]">{field.name}</span>
      
      {showAggregation && field.type === "metric" && (
        <Select value={aggregation} onValueChange={handleAggregationChange}>
          <SelectTrigger className="h-6 w-10 px-1.5 text-xs border-0 bg-transparent flex-shrink-0">
            <SelectValue>
              <span className="font-mono">{aggregationLabels[aggregation]}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="min-w-[120px] bg-popover z-50">
            <SelectItem value="sum">Sum (Σ)</SelectItem>
            <SelectItem value="avg">Average (μ)</SelectItem>
            <SelectItem value="count">Count (#)</SelectItem>
            <SelectItem value="min">Min (↓)</SelectItem>
            <SelectItem value="max">Max (↑)</SelectItem>
            <SelectItem value="distinctCount">Distinct Count</SelectItem>
          </SelectContent>
        </Select>
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
