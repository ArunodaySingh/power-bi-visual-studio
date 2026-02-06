import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MetaAdsCampaign {
  id: string;
  account_id: string | null;
  account_name: string | null;
  campaign_id: string;
  campaign_name: string;
  adset_id: string | null;
  ad_set_name: string;
  ad_id: string | null;
  ad_name: string | null;
  campaign_status: string | null;
  adset_status: string | null;
  ad_status: string | null;
  objective: string | null;
  start_date: string | null;
  end_date: string | null;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  spend: number;
  cpm: number;
  ctr: number;
  cpc: number;
  results: number;
  conversions: number;
  purchases: number;
  leads: number;
  video_plays_100: number;
  video_spend: number;
  video_starts: number;
  video_view_25: number;
  video_view_50: number;
  video_view_75: number;
  video_view_100: number;
  video_views: number;
  cpv: number;
  cpcv: number;
  vtr: number;
  thruplays: number;
  cpe: number;
  engagement_rate: number;
  engagements: number;
  landing_page_view: number;
  cpl: number;
  brand_suitability_blocked: number;
  brand_suitability_failed: number;
  impressions_verification: number;
  measurable_impressions: number;
  measurable_rate: number;
  tracked_ads: number;
  viewability_rate: number;
  viewability_rate_verification: number;
  viewability_impressions: number;
  platform: string | null;
  device: string | null;
  campaign_category: string | null;
  campaign_label: string | null;
  campaign_type: string | null;
  ad_set_label: string | null;
  ad_set_type: string | null;
  ad_category: string | null;
  ad_format: string | null;
  ad_type: string | null;
  age: string | null;
  gender: string | null;
  roas: number;
  date: string;
}

export function useMetaAdsData() {
  const query = useQuery({
    queryKey: ["meta-ads-campaigns"],
    queryFn: async (): Promise<MetaAdsCampaign[]> => {
      const { data, error } = await supabase
        .from("meta_ads_campaigns")
        .select("*")
        .order("date", { ascending: false })
        .limit(1000);

      if (error) {
        console.error("Error fetching meta ads data:", error);
        throw error;
      }

      return (data || []).map((row) => ({
        id: row.id,
        account_id: row.account_id,
        account_name: row.account_name,
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name,
        adset_id: row.adset_id,
        ad_set_name: row.ad_set_name,
        ad_id: row.ad_id,
        ad_name: row.ad_name,
        campaign_status: row.campaign_status,
        adset_status: row.adset_status,
        ad_status: row.ad_status,
        objective: row.objective,
        start_date: row.start_date,
        end_date: row.end_date,
        impressions: Number(row.impressions) || 0,
        reach: Number(row.reach) || 0,
        frequency: Number(row.frequency) || 0,
        clicks: Number(row.clicks) || 0,
        spend: Number(row.spend) || 0,
        cpm: Number(row.cpm) || 0,
        ctr: Number(row.ctr) || 0,
        cpc: Number(row.cpc) || 0,
        results: Number(row.results) || 0,
        conversions: Number(row.conversions) || 0,
        purchases: Number(row.purchases) || 0,
        leads: Number(row.leads) || 0,
        video_plays_100: Number(row.video_plays_100) || 0,
        video_spend: Number(row.video_spend) || 0,
        video_starts: Number(row.video_starts) || 0,
        video_view_25: Number(row.video_view_25) || 0,
        video_view_50: Number(row.video_view_50) || 0,
        video_view_75: Number(row.video_view_75) || 0,
        video_view_100: Number(row.video_view_100) || 0,
        video_views: Number(row.video_views) || 0,
        cpv: Number(row.cpv) || 0,
        cpcv: Number(row.cpcv) || 0,
        vtr: Number(row.vtr) || 0,
        thruplays: Number(row.thruplays) || 0,
        cpe: Number(row.cpe) || 0,
        engagement_rate: Number(row.engagement_rate) || 0,
        engagements: Number(row.engagements) || 0,
        landing_page_view: Number(row.landing_page_view) || 0,
        cpl: Number(row.cpl) || 0,
        brand_suitability_blocked: Number(row.brand_suitability_blocked) || 0,
        brand_suitability_failed: Number(row.brand_suitability_failed) || 0,
        impressions_verification: Number(row.impressions_verification) || 0,
        measurable_impressions: Number(row.measurable_impressions) || 0,
        measurable_rate: Number(row.measurable_rate) || 0,
        tracked_ads: Number(row.tracked_ads) || 0,
        viewability_rate: Number(row.viewability_rate) || 0,
        viewability_rate_verification: Number(row.viewability_rate_verification) || 0,
        viewability_impressions: Number(row.viewability_impressions) || 0,
        platform: row.platform,
        device: row.device,
        campaign_category: row.campaign_category,
        campaign_label: row.campaign_label,
        campaign_type: row.campaign_type,
        ad_set_label: row.ad_set_label,
        ad_set_type: row.ad_set_type,
        ad_category: row.ad_category,
        ad_format: row.ad_format,
        ad_type: row.ad_type,
        age: row.age,
        gender: row.gender,
        roas: Number(row.roas) || 0,
        date: row.date,
      }));
    },
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    ...query,
    refetch: query.refetch,
  };
}

// Helper to get unique values for slicer filters
export function getUniqueValues(data: MetaAdsCampaign[], field: keyof MetaAdsCampaign): (string | number)[] {
  const values = data.map((item) => item[field]).filter(v => v !== null && v !== undefined);
  return [...new Set(values)] as (string | number)[];
}
