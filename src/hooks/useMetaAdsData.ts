import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MetaAdsCampaign {
  id: string;
  campaign_id: string;
  campaign_name: string;
  ad_set_name: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
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
        .limit(500);

      if (error) {
        console.error("Error fetching meta ads data:", error);
        throw error;
      }

      return (data || []).map((row) => ({
        id: row.id,
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name,
        ad_set_name: row.ad_set_name,
        impressions: Number(row.impressions),
        clicks: Number(row.clicks),
        spend: Number(row.spend),
        conversions: Number(row.conversions),
        ctr: Number(row.ctr),
        cpc: Number(row.cpc),
        cpm: Number(row.cpm),
        roas: Number(row.roas),
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
  const values = data.map((item) => item[field]);
  return [...new Set(values)];
}
