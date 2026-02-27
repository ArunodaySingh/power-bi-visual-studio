import { useState } from "react";
import { Database, Loader2, Table2, ChevronRight, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBigQueryDatasets, useBigQueryTables } from "@/hooks/useBigQueryData";
import { cn } from "@/lib/utils";

export interface BigQueryConnection {
  projectId: string;
  datasetId: string;
  tableId: string;
}

interface BigQueryConfigProps {
  connection: BigQueryConnection;
  onConnectionChange: (conn: BigQueryConnection) => void;
}

export function BigQueryConfig({ connection, onConnectionChange }: BigQueryConfigProps) {
  const [projectInput, setProjectInput] = useState(connection.projectId);
  const [isConfiguring, setIsConfiguring] = useState(!connection.projectId);

  const { data: datasets, isLoading: loadingDatasets, error: datasetsError } = useBigQueryDatasets(
    connection.projectId || null
  );
  const { data: tables, isLoading: loadingTables, error: tablesError } = useBigQueryTables(
    connection.projectId || null,
    connection.datasetId || null
  );

  const handleProjectSubmit = () => {
    if (projectInput.trim()) {
      onConnectionChange({ ...connection, projectId: projectInput.trim(), datasetId: "", tableId: "" });
    }
  };

  const handleDatasetChange = (val: string) => {
    onConnectionChange({ ...connection, datasetId: val, tableId: "" });
  };

  const handleTableChange = (val: string) => {
    onConnectionChange({ ...connection, tableId: val });
  };

  if (!isConfiguring && connection.projectId && connection.datasetId && connection.tableId) {
    return (
      <div className="px-4 py-3 border-b bg-secondary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Database className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{connection.tableId}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {connection.projectId} / {connection.datasetId}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsConfiguring(true)} className="h-7 w-7 p-0">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-b space-y-3 bg-secondary/30">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">BigQuery Connection</h3>
      </div>

      {/* Project ID */}
      <div className="space-y-1.5">
        <Label className="text-xs">GCP Project ID</Label>
        <div className="flex gap-1.5">
          <Input
            value={projectInput}
            onChange={(e) => setProjectInput(e.target.value)}
            placeholder="my-gcp-project"
            className="h-8 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleProjectSubmit()}
          />
          <Button size="sm" className="h-8 px-2.5" onClick={handleProjectSubmit} disabled={!projectInput.trim()}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Dataset selector */}
      {connection.projectId && (
        <div className="space-y-1.5">
          <Label className="text-xs">Dataset</Label>
          {loadingDatasets ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading datasets...
            </div>
          ) : datasetsError ? (
            <p className="text-xs text-destructive">Error loading datasets: {(datasetsError as Error).message}</p>
          ) : (
            <Select value={connection.datasetId} onValueChange={handleDatasetChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select dataset..." />
              </SelectTrigger>
              <SelectContent>
                {(datasets || []).map((ds) => (
                  <SelectItem key={ds.id} value={ds.id} className="text-xs">
                    {ds.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Table selector */}
      {connection.datasetId && (
        <div className="space-y-1.5">
          <Label className="text-xs">Table</Label>
          {loadingTables ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading tables...
            </div>
          ) : tablesError ? (
            <p className="text-xs text-destructive">Error loading tables: {(tablesError as Error).message}</p>
          ) : (
            <Select value={connection.tableId} onValueChange={handleTableChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select table..." />
              </SelectTrigger>
              <SelectContent>
                {(tables || []).map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <Table2 className="h-3 w-3" />
                      <span>{t.name}</span>
                      {t.rowCount !== null && (
                        <span className="text-muted-foreground">({t.rowCount.toLocaleString()} rows)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {connection.tableId && (
        <Button size="sm" className="w-full h-8 text-xs" onClick={() => setIsConfiguring(false)}>
          Connect
        </Button>
      )}
    </div>
  );
}
