/**
 * Shared data aggregation utility for computing visual data from raw meta ads records.
 * Used by both the editor (Index.tsx) and the viewer (ViewDashboard.tsx).
 */

import { format, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from "date-fns";
import type { ChartConfig } from "@/components/ChartConfigDropdowns";
import type { DataPoint } from "@/components/DataEditor";
import type { TimeGranularity } from "@/types/dashboard";
import type { MetaAdsCampaign } from "@/hooks/useMetaAdsData";

function getTimePeriodKey(dateStr: string, granularity: TimeGranularity): string {
  if (granularity === "none" || !dateStr) return dateStr;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  switch (granularity) {
    case "day": return format(date, "yyyy-MM-dd");
    case "week": return format(startOfWeek(date, { weekStartsOn: 1 }), "'Week of' MMM d, yyyy");
    case "month": return format(startOfMonth(date), "MMM yyyy");
    case "quarter": return format(startOfQuarter(date), "'Q'Q yyyy");
    case "year": return format(startOfYear(date), "yyyy");
    default: return dateStr;
  }
}

const RATE_FIELDS = ["ctr", "cpc", "cpm", "roas", "cpv", "cpcv", "vtr", "cpe", "cpl", "engagement_rate", "frequency", "measurable_rate", "viewability_rate", "viewability_rate_verification"];

function isRateField(key: string) {
  return RATE_FIELDS.includes(key);
}

/**
 * Aggregates raw data into chart-ready DataPoint[] based on a ChartConfig.
 */
export function aggregateVisualData(
  data: MetaAdsCampaign[],
  config: ChartConfig,
  visualType: string
): DataPoint[] {
  if (!data.length) return [];

  // Table type
  if (visualType === "table") {
    const selectedColumns = config.selectedColumns || [];
    if (selectedColumns.length === 0) return [];
    return data.slice(0, 100).map((record) => {
      const row: Record<string, string | number> = { id: crypto.randomUUID() };
      selectedColumns.forEach((col) => {
        const value = record[col as keyof MetaAdsCampaign];
        row[col] = value !== undefined && value !== null ? (value as string | number) : '';
      });
      const firstDimCol = selectedColumns.find(c => typeof record[c as keyof MetaAdsCampaign] === 'string');
      const firstMeasureCol = selectedColumns.find(c => typeof record[c as keyof MetaAdsCampaign] === 'number');
      row.category = firstDimCol ? String(record[firstDimCol as keyof MetaAdsCampaign]) : String(record.campaign_name);
      row.value = firstMeasureCol ? Number(record[firstMeasureCol as keyof MetaAdsCampaign]) : 0;
      return row as DataPoint;
    });
  }

  // KPI Card type
  if (visualType === "card") {
    if (!config.measure) return [];
    const measureKey = config.measure;
    const calculation = config.calculation || "sum";
    const values = data
      .map(r => r[measureKey as keyof MetaAdsCampaign])
      .filter((v): v is number => typeof v === 'number');
    
    let aggregateValue = 0;
    if (values.length > 0) {
      switch (calculation) {
        case "sum": aggregateValue = values.reduce((a, b) => a + b, 0); break;
        case "average": aggregateValue = values.reduce((a, b) => a + b, 0) / values.length; break;
        case "min": aggregateValue = Math.min(...values); break;
        case "max": aggregateValue = Math.max(...values); break;
        case "count": aggregateValue = values.length; break;
        case "last": aggregateValue = values[0]; break;
      }
    }
    return [{
      id: crypto.randomUUID(),
      category: config.measure,
      value: Math.round(aggregateValue * 100) / 100,
    }];
  }

  // Matrix type
  if (visualType === "matrix") {
    if (!config.measure) return [];
    const measureKey = config.measure;
    const rowFields = config.matrixRows || [];
    const colFields = config.matrixColumns || [];
    const agg = new Map<string, { sum: number; count: number }>();
    
    data.forEach((record) => {
      const rowParts = rowFields.map(f => String(record[f as keyof MetaAdsCampaign] || "Unknown"));
      const colParts = colFields.map(f => String(record[f as keyof MetaAdsCampaign] || "Unknown"));
      const groupKey = [...rowParts, ...colParts].join(" | ") || "Total";
      const rawValue = record[measureKey as keyof MetaAdsCampaign];
      const value = typeof rawValue === "number" ? rawValue : 0;
      if (!agg.has(groupKey)) agg.set(groupKey, { sum: 0, count: 0 });
      const entry = agg.get(groupKey)!;
      entry.sum += value;
      entry.count += 1;
    });

    return Array.from(agg.entries())
      .map(([category, { sum, count }]) => ({
        id: crypto.randomUUID(),
        category: category.slice(0, 50),
        value: Math.round((isRateField(measureKey) ? sum / count : sum) * 100) / 100,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 50);
  }

  // Standard chart types (bar, line, pie, area, multiline, combo, etc.)
  if (!config.measure || !config.groupBy) return [];

  const measureKey = config.measure;
  const measure2Key = config.measure2 || null;
  const groupByKey = config.groupBy;
  const timeGranularity = (config.dateGranularity || "none") as TimeGranularity;
  const isMultiLine = visualType === "multiline" && config.measure2;

  const agg = new Map<string, { sum: number; count: number; sum2: number; count2: number }>();

  data.forEach((record) => {
    let groupValue = String(record[groupByKey as keyof MetaAdsCampaign] || "Unknown");
    if (timeGranularity !== "none" && record.date) {
      groupValue = `${groupValue} - ${getTimePeriodKey(record.date, timeGranularity)}`;
    }
    const rawValue = record[measureKey as keyof MetaAdsCampaign];
    const value = typeof rawValue === "number" ? rawValue : 0;
    const rawValue2 = measure2Key ? record[measure2Key as keyof MetaAdsCampaign] : 0;
    const value2 = typeof rawValue2 === "number" ? rawValue2 : 0;

    if (!agg.has(groupValue)) agg.set(groupValue, { sum: 0, count: 0, sum2: 0, count2: 0 });
    const entry = agg.get(groupValue)!;
    entry.sum += value;
    entry.count += 1;
    entry.sum2 += value2;
    entry.count2 += 1;
  });

  let result: DataPoint[] = Array.from(agg.entries())
    .map(([category, { sum, count, sum2, count2 }]) => {
      const dp: DataPoint = {
        id: crypto.randomUUID(),
        category: category.slice(0, 30),
        value: Math.round((isRateField(measureKey) ? sum / count : sum) * 100) / 100,
      };
      if (isMultiLine && measure2Key) {
        dp.value2 = Math.round((isRateField(measure2Key) ? sum2 / count2 : sum2) * 100) / 100;
      }
      return dp;
    });

  // Sort
  const sortBy = config.sortBy || "value-desc";
  switch (sortBy) {
    case "value-desc": result.sort((a, b) => b.value - a.value); break;
    case "value-asc": result.sort((a, b) => a.value - b.value); break;
    case "name-asc": result.sort((a, b) => a.category.localeCompare(b.category)); break;
    case "name-desc": result.sort((a, b) => b.category.localeCompare(a.category)); break;
  }

  return result.slice(0, 15);
}
