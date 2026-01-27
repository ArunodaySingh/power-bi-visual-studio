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
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[40px] rounded-lg border-2 border-dashed p-2 transition-all",
          isOver && "border-primary bg-primary/5",
          fields.length === 0 && "border-border/50",
          fields.length > 0 && "border-transparent bg-muted/30"
        )}
      >
        {fields.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-1">
            Drop field here
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
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
        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
        field.type === "metric"
          ? "bg-primary/10 text-primary border border-primary/20"
          : "bg-secondary text-secondary-foreground border border-border"
      )}
    >
      <GripVertical className="h-3 w-3 opacity-40" />
      {field.type === "metric" ? (
        <Hash className="h-3 w-3" />
      ) : (
        <Type className="h-3 w-3" />
      )}
      <span className="max-w-[80px] truncate">{field.name}</span>
      
      {showAggregation && field.type === "metric" && (
        <Select value={aggregation} onValueChange={handleAggregationChange}>
          <SelectTrigger className="h-5 w-8 px-1 text-[10px] border-0 bg-transparent">
            <SelectValue>
              <span className="font-mono">{aggregationLabels[aggregation]}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="min-w-[100px] bg-popover z-50">
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
        className="ml-0.5 p-0.5 hover:bg-foreground/10 rounded transition-colors"
      >
        <X className="h-3 w-3" />
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
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Sigma className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
