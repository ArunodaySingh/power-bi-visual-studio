import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: rows } = await req.json();

    if (!rows || !Array.isArray(rows)) {
      return new Response(
        JSON.stringify({ error: "Invalid data format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform and insert data in batches
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).map((row: any) => ({
        account_id: row.account_id || null,
        account_name: row.account_name || null,
        campaign_id: row.campaign_id || null,
        campaign_name: row.campaign_name || null,
        adset_id: row.adset_id || null,
        ad_set_name: row.ad_set_name || null,
        ad_id: row.ad_id || null,
        ad_name: row.ad_name || null,
        campaign_status: row.campaign_status || null,
        adset_status: row.adset_status || null,
        ad_status: row.ad_status || null,
        objective: row.objective || null,
        start_date: row.start_date || null,
        end_date: row.end_date || null,
        date: row.start_date || new Date().toISOString().split('T')[0],
        impressions: parseInt(row.impressions) || 0,
        reach: parseInt(row.reach) || 0,
        frequency: parseFloat(row.frequency) || 0,
        clicks: parseInt(row.clicks) || 0,
        spend: parseFloat(row.spend) || 0,
        cpm: parseFloat(row.cpm) || 0,
        ctr: parseFloat(row.ctr) || 0,
        cpc: parseFloat(row.cpc) || 0,
        results: parseInt(row.results) || 0,
        conversions: parseInt(row.purchases) || 0,
        purchases: parseInt(row.purchases) || 0,
        leads: parseInt(row.leads) || 0,
        video_plays_100: parseInt(row.video_plays_100) || 0,
        video_spend: parseFloat(row.video_spend) || 0,
        video_starts: parseInt(row.video_starts) || 0,
        video_view_25: parseInt(row.video_view_25) || 0,
        video_view_50: parseInt(row.video_view_50) || 0,
        video_view_75: parseInt(row.video_view_75) || 0,
        video_view_100: parseInt(row.video_view_100) || 0,
        video_views: parseInt(row.video_views) || 0,
        cpv: parseFloat(row.cpv) || 0,
        cpcv: parseFloat(row.cpcv) || 0,
        vtr: parseFloat(row.vtr) || 0,
        thruplays: parseInt(row.thruplays) || 0,
        cpe: parseFloat(row.cpe) || 0,
        engagement_rate: parseFloat(row.engagement_rate) || 0,
        engagements: parseInt(row.engagements) || 0,
        landing_page_view: parseInt(row.landing_page_view) || 0,
        cpl: parseFloat(row.cpl) || 0,
        brand_suitability_blocked: parseInt(row.brand_suitability_blocked) || 0,
        brand_suitability_failed: parseInt(row.brand_suitability_failed) || 0,
        impressions_verification: parseInt(row.impressions_verification) || 0,
        measurable_impressions: parseInt(row.measurable_impressions) || 0,
        measurable_rate: parseFloat(row.measurable_rate) || 0,
        tracked_ads: parseInt(row.tracked_ads) || 0,
        viewability_rate: parseFloat(row.viewability_rate) || 0,
        viewability_rate_verification: parseFloat(row.viewability_rate_verification) || 0,
        viewability_impressions: parseInt(row.viewability_impressions) || 0,
        platform: row.platform || null,
        device: row.device || null,
        campaign_category: row.campaign_category || null,
        campaign_label: row.campaign_label || null,
        campaign_type: row.campaign_type || null,
        ad_set_label: row.ad_set_label || null,
        ad_set_type: row.ad_set_type || null,
        ad_category: row.ad_category || null,
        ad_format: row.ad_format || null,
        ad_type: row.ad_type || null,
        age: row.age || null,
        gender: row.gender || null,
        roas: 0,
      }));

      const { error } = await supabase
        .from("meta_ads_campaigns")
        .insert(batch);

      if (error) {
        console.error("Insert error:", error);
        return new Response(
          JSON.stringify({ error: error.message, inserted }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      inserted += batch.length;
    }

    return new Response(
      JSON.stringify({ success: true, inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
