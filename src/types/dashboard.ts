// Shared types for the dashboard builder

export type SlicerType = "dropdown" | "list" | "date-range" | "numeric-range" | "relative-date";

export interface FilterValue {
  field: string;
  values: (string | number)[];
  operator?: "equals" | "contains" | "between" | "gt" | "lt" | "gte" | "lte";
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
  numericRange?: {
    min: number;
    max: number;
  };
}

export interface SlicerData {
  id: string;
  type: SlicerType;
  field: string;
  fieldLabel: string;
  title?: string;
  selectedValues: (string | number)[];
  position: { x: number; y: number };
  size: { width: number; height: number };
  multiSelect?: boolean;
  showSearch?: boolean;
}

export type TimeGranularity = "none" | "day" | "week" | "month" | "quarter" | "year";

export interface DataField {
  id: string;
  name: string;
  type: "metric" | "dimension";
  format?: string;
  aggregation?: AggregationType;
  timeGranularity?: TimeGranularity;
}

export interface FieldMapping {
  axis?: DataField[];
  values?: DataField[];
  legend?: DataField;
  tooltips?: DataField[];
}

export type AggregationType = "sum" | "avg" | "count" | "min" | "max" | "distinctCount";

export interface ConditionalRule {
  type: "gradient" | "threshold" | "databar" | "icon";
  field: string;
  conditions: RuleCondition[];
}

export interface RuleCondition {
  operator: "gt" | "lt" | "gte" | "lte" | "eq" | "between";
  value: number;
  value2?: number;
  color?: string;
  icon?: string;
}

export interface VisualPropertiesExtended {
  conditionalFormatting?: ConditionalRule[];
}
