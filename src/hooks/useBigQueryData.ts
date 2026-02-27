import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BigQueryTable {
  id: string;
  name: string;
  type: string;
  rowCount: number | null;
}

export interface BigQueryField {
  name: string;
  type: string; // STRING, INTEGER, FLOAT, NUMERIC, DATE, TIMESTAMP, BOOLEAN
}

export interface BigQueryDataset {
  id: string;
  name: string;
}

async function callBigQueryProxy(body: Record<string, any>) {
  const { data, error } = await supabase.functions.invoke("bigquery-proxy", {
    body,
  });
  if (error) throw new Error(error.message || "BigQuery proxy call failed");
  if (data?.error) throw new Error(data.error);
  return data;
}

// List datasets in a GCP project
export function useBigQueryDatasets(projectId: string | null) {
  return useQuery({
    queryKey: ["bq-datasets", projectId],
    queryFn: () => callBigQueryProxy({ action: "list-datasets", projectId }),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 10,
    select: (data) => (data.datasets || []) as BigQueryDataset[],
  });
}

// List tables in a dataset
export function useBigQueryTables(projectId: string | null, datasetId: string | null) {
  return useQuery({
    queryKey: ["bq-tables", projectId, datasetId],
    queryFn: () => callBigQueryProxy({ action: "list-tables", projectId, datasetId }),
    enabled: !!projectId && !!datasetId,
    staleTime: 1000 * 60 * 10,
    select: (data) => (data.tables || []) as BigQueryTable[],
  });
}

// Get table schema
export function useBigQuerySchema(projectId: string | null, datasetId: string | null, tableId: string | null) {
  return useQuery({
    queryKey: ["bq-schema", projectId, datasetId, tableId],
    queryFn: () => callBigQueryProxy({ action: "get-schema", projectId, datasetId, tableId }),
    enabled: !!projectId && !!datasetId && !!tableId,
    staleTime: 1000 * 60 * 30,
    select: (data) => {
      const fields = (data.fields || []) as BigQueryField[];
      const NUMERIC_TYPES = ["INTEGER", "INT64", "FLOAT", "FLOAT64", "NUMERIC", "BIGNUMERIC"];
      const DATE_TYPES = ["DATE", "TIMESTAMP", "DATETIME"];
      const EXCLUDED = ["id", "created_at"];

      const measures: string[] = [];
      const dimensions: string[] = [];

      fields.forEach((f) => {
        if (EXCLUDED.includes(f.name.toLowerCase())) return;
        if (NUMERIC_TYPES.includes(f.type)) {
          measures.push(f.name);
        } else {
          dimensions.push(f.name);
        }
      });

      measures.sort((a, b) => a.localeCompare(b));
      dimensions.sort((a, b) => a.localeCompare(b));

      return {
        measures,
        dimensions,
        allColumns: fields.filter((f) => !EXCLUDED.includes(f.name.toLowerCase())).map((f) => f.name),
        fields,
      };
    },
  });
}

// Query table data
export function useBigQueryTableData(
  projectId: string | null,
  datasetId: string | null,
  tableId: string | null,
  pageSize = 5000
) {
  return useQuery({
    queryKey: ["bq-data", projectId, datasetId, tableId, pageSize],
    queryFn: () => callBigQueryProxy({ action: "query-data", projectId, datasetId, tableId, pageSize }),
    enabled: !!projectId && !!datasetId && !!tableId,
    staleTime: 1000 * 60 * 5,
    select: (data) => ({
      rows: (data.rows || []) as Record<string, any>[],
      totalRows: data.totalRows || 0,
      schema: (data.schema || []) as { name: string; type: string }[],
    }),
  });
}

// Helper to get unique values from BigQuery data for slicers
export function getUniqueValues(data: Record<string, any>[], field: string): (string | number)[] {
  const values = data.map((item) => item[field]).filter((v) => v !== null && v !== undefined);
  return [...new Set(values)] as (string | number)[];
}

// Helper for column display names (same pattern as before)
export function getColumnDisplayName(columnName: string): string {
  return columnName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
