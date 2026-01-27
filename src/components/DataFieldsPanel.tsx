import { useState } from "react";
import { ChevronDown, ChevronRight, Table2, Hash, Type, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export interface DataField {
  id: string;
  name: string;
  type: "metric" | "dimension";
  dataType: "number" | "string" | "date";
  table: string;
}

export interface DataTable {
  id: string;
  name: string;
  fields: DataField[];
}

interface DraggableFieldProps {
  field: DataField;
}

function DraggableField({ field }: DraggableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-${field.id}`,
    data: { field },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md cursor-grab text-sm",
        "hover:bg-secondary/80 transition-colors group",
        isDragging && "opacity-50 bg-primary/10 ring-1 ring-primary"
      )}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      {field.type === "metric" ? (
        <Hash className="h-4 w-4 text-accent flex-shrink-0" />
      ) : (
        <Type className="h-4 w-4 text-primary flex-shrink-0" />
      )}
      <span className="truncate flex-1 min-w-0">{field.name}</span>
      <span className="ml-auto text-xs text-muted-foreground uppercase flex-shrink-0">
        {field.type === "metric" ? "Σ" : "A"}
      </span>
    </div>
  );
}

interface TableSectionProps {
  table: DataTable;
  defaultOpen?: boolean;
}

function TableSection({ table, defaultOpen = true }: TableSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const metrics = table.fields.filter((f) => f.type === "metric");
  const dimensions = table.fields.filter((f) => f.type === "dimension");

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-secondary/50 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <Table2 className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium">{table.name}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {table.fields.length}
        </span>
      </button>
      {isOpen && (
        <div className="px-3 pb-3 space-y-3">
          {dimensions.length > 0 && (
            <div>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Dimensions
              </div>
              <div className="space-y-1">
                {dimensions.map((field) => (
                  <DraggableField key={field.id} field={field} />
                ))}
              </div>
            </div>
          )}
          {metrics.length > 0 && (
            <div>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Metrics
              </div>
              <div className="space-y-1">
                {metrics.map((field) => (
                  <DraggableField key={field.id} field={field} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface DataFieldsPanelProps {
  tables: DataTable[];
}

export function DataFieldsPanel({ tables }: DataFieldsPanelProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b bg-secondary/30">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Data Fields
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Drag fields to visuals
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tables.map((table) => (
          <TableSection key={table.id} table={table} />
        ))}
      </div>
    </div>
  );
}

// Meta Ads table schema for the fields panel
export const metaAdsDataTables: DataTable[] = [
  {
    id: "meta_campaigns",
    name: "Meta Campaigns",
    fields: [
      { id: "campaign_name", name: "Campaign Name", type: "dimension", dataType: "string", table: "meta_campaigns" },
      { id: "ad_set_name", name: "Ad Set Name", type: "dimension", dataType: "string", table: "meta_campaigns" },
      { id: "date", name: "Date", type: "dimension", dataType: "date", table: "meta_campaigns" },
      { id: "impressions", name: "Impressions", type: "metric", dataType: "number", table: "meta_campaigns" },
      { id: "clicks", name: "Clicks", type: "metric", dataType: "number", table: "meta_campaigns" },
      { id: "spend", name: "Spend", type: "metric", dataType: "number", table: "meta_campaigns" },
      { id: "conversions", name: "Conversions", type: "metric", dataType: "number", table: "meta_campaigns" },
      { id: "ctr", name: "CTR", type: "metric", dataType: "number", table: "meta_campaigns" },
      { id: "cpc", name: "CPC", type: "metric", dataType: "number", table: "meta_campaigns" },
      { id: "cpm", name: "CPM", type: "metric", dataType: "number", table: "meta_campaigns" },
      { id: "roas", name: "ROAS", type: "metric", dataType: "number", table: "meta_campaigns" },
    ],
  },
  {
    id: "meta_ad_sets",
    name: "Meta Ad Sets",
    fields: [
      { id: "ad_set_id", name: "Ad Set ID", type: "dimension", dataType: "string", table: "meta_ad_sets" },
      { id: "ad_set_status", name: "Status", type: "dimension", dataType: "string", table: "meta_ad_sets" },
      { id: "audience_name", name: "Audience", type: "dimension", dataType: "string", table: "meta_ad_sets" },
      { id: "budget", name: "Budget", type: "metric", dataType: "number", table: "meta_ad_sets" },
      { id: "reach", name: "Reach", type: "metric", dataType: "number", table: "meta_ad_sets" },
      { id: "frequency", name: "Frequency", type: "metric", dataType: "number", table: "meta_ad_sets" },
    ],
  },
];
