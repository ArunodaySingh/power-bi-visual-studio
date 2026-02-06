import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ColumnSchema {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
}

// Define which columns are measures (numeric) vs dimensions (text)
const EXCLUDED_COLUMNS = ['id', 'created_at', 'date', 'start_date', 'end_date'];

// Column display name mapping for better readability
const COLUMN_DISPLAY_NAMES: Record<string, string> = {
  impressions: "Impressions",
  clicks: "Clicks",
  spend: "Spend",
  conversions: "Conversions",
  ctr: "CTR",
  cpc: "CPC",
  cpm: "CPM",
  roas: "ROAS",
  reach: "Reach",
  frequency: "Frequency",
  results: "Results",
  purchases: "Purchases",
  leads: "Leads",
  video_plays_100: "100% Video View",
  video_spend: "Video Spend",
  video_starts: "Video Starts",
  video_view_25: "25% Video View",
  video_view_50: "50% Video View",
  video_view_75: "75% Video View",
  video_view_100: "100% Video View",
  video_views: "Video Views",
  cpv: "CPV",
  cpcv: "CPCV",
  vtr: "VTR",
  thruplays: "Thruplays",
  cpe: "CPE",
  engagement_rate: "Engagement Rate",
  engagements: "Engagements",
  landing_page_view: "Landing Page View",
  cpl: "CPL",
  brand_suitability_blocked: "Brand Suitability Blocked Ads",
  brand_suitability_failed: "Brand Suitability Failed Ads",
  impressions_verification: "Impressions (Verification)",
  measurable_impressions: "Measurable Impressions (Verification)",
  measurable_rate: "Measurable Rate (Verification)",
  tracked_ads: "Tracked Ads",
  viewability_rate: "Viewability Rate",
  viewability_rate_verification: "Viewability Rate (Verification)",
  viewability_impressions: "Viewability Impressions (Verification)",
  // Dimensions
  platform: "Platform",
  device: "Device",
  campaign_category: "Campaign Category",
  campaign_label: "Campaign Label",
  campaign_type: "Campaign Type",
  campaign_name: "Campaign Name",
  campaign_id: "Campaign ID",
  ad_set_name: "Ad Set Name",
  ad_set_label: "Ad Set Label",
  ad_set_type: "Ad Set Type",
  adset_id: "Adset ID",
  ad_category: "Ad Category",
  ad_format: "Ad Format",
  ad_type: "Ad Type",
  ad_name: "Ad Name",
  ad_id: "Ad ID",
  account_id: "Account ID",
  account_name: "Account Name",
  age: "Age",
  gender: "Gender",
  campaign_status: "Campaign Status",
  adset_status: "Adset Status",
  ad_status: "Ad Status",
  objective: "Objective",
};

export function getColumnDisplayName(columnName: string): string {
  return COLUMN_DISPLAY_NAMES[columnName] || columnName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function useMetaAdsSchema() {
  return useQuery({
    queryKey: ["meta-ads-schema"],
    queryFn: async () => {
      // Get a single row to determine column types dynamically
      const { data, error } = await supabase
        .from("meta_ads_campaigns")
        .select("*")
        .limit(1);

      if (error) throw error;

      const sampleRow = data?.[0] || {};
      const columns = Object.keys(sampleRow);

      // Categorize columns into measures and dimensions
      const measures: string[] = [];
      const dimensions: string[] = [];

      columns.forEach(col => {
        if (EXCLUDED_COLUMNS.includes(col)) return;

        const value = sampleRow[col];
        // Check if numeric (measure) or text (dimension)
        if (typeof value === 'number') {
          measures.push(col);
        } else if (typeof value === 'string' && value !== null) {
          dimensions.push(col);
        }
      });

      // Sort alphabetically by display name
      measures.sort((a, b) => getColumnDisplayName(a).localeCompare(getColumnDisplayName(b)));
      dimensions.sort((a, b) => getColumnDisplayName(a).localeCompare(getColumnDisplayName(b)));

      return {
        measures,
        dimensions,
        allColumns: columns.filter(c => !EXCLUDED_COLUMNS.includes(c)),
      };
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}

// Export typed arrays for static usage if needed
export type MeasureColumn = string;
export type DimensionColumn = string;
