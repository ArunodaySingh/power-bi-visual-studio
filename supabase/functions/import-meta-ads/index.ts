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

    const { action, data: rows } = await req.json();

    if (action === "clear") {
      // Clear existing data
      const { error: deleteError } = await supabase
        .from("meta_ads_campaigns")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, action: "cleared" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "import" && rows && Array.isArray(rows)) {
      // Transform and insert data in batches
      const batchSize = 100;
      let inserted = 0;
      let errors: string[] = [];

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize).map((row: Record<string, unknown>) => {
          // Parse date safely
          const parseDate = (dateStr: unknown): string | null => {
            if (!dateStr || typeof dateStr !== 'string') return null;
            try {
              const date = new Date(dateStr);
              if (isNaN(date.getTime())) return null;
              return date.toISOString().split('T')[0];
            } catch {
              return null;
            }
          };

          const parseNumber = (val: unknown): number => {
            if (val === null || val === undefined || val === '') return 0;
            const num = parseFloat(String(val));
            return isNaN(num) ? 0 : num;
          };

          const parseString = (val: unknown): string | null => {
            if (val === null || val === undefined || val === '') return null;
            return String(val).replace(/\\_/g, '_');
          };

          return {
            account_id: parseString(row.account_id),
            account_name: parseString(row.account_name),
            campaign_id: parseString(row.campaign_id) || 'unknown',
            campaign_name: parseString(row.campaign_name) || 'Unknown Campaign',
            adset_id: parseString(row.adset_id),
            ad_set_name: parseString(row.ad_set_name) || 'Unknown Adset',
            ad_id: parseString(row.ad_id),
            ad_name: parseString(row.ad_name),
            campaign_status: parseString(row.campaign_status),
            adset_status: parseString(row.adset_status),
            ad_status: parseString(row.ad_status),
            objective: parseString(row.objective),
            start_date: parseDate(row.start_date),
            end_date: parseDate(row.end_date),
            date: parseDate(row.start_date) || new Date().toISOString().split('T')[0],
            impressions: Math.round(parseNumber(row.impressions)),
            reach: Math.round(parseNumber(row.reach)),
            frequency: parseNumber(row.frequency),
            clicks: Math.round(parseNumber(row.clicks)),
            spend: parseNumber(row.spend),
            cpm: parseNumber(row.cpm),
            ctr: parseNumber(row.ctr),
            cpc: parseNumber(row.cpc),
            results: Math.round(parseNumber(row.results)),
            conversions: Math.round(parseNumber(row.purchases)),
            purchases: Math.round(parseNumber(row.purchases)),
            leads: Math.round(parseNumber(row.leads)),
            video_plays_100: Math.round(parseNumber(row.video_plays_100)),
            video_spend: parseNumber(row.video_spend),
            video_starts: Math.round(parseNumber(row.video_starts)),
            video_view_25: Math.round(parseNumber(row.video_view_25)),
            video_view_50: Math.round(parseNumber(row.video_view_50)),
            video_view_75: Math.round(parseNumber(row.video_view_75)),
            video_view_100: Math.round(parseNumber(row.video_view_100)),
            video_views: Math.round(parseNumber(row.video_views)),
            cpv: parseNumber(row.cpv),
            cpcv: parseNumber(row.cpcv),
            vtr: parseNumber(row.vtr),
            thruplays: Math.round(parseNumber(row.thruplays)),
            cpe: parseNumber(row.cpe),
            engagement_rate: parseNumber(row.engagement_rate),
            engagements: Math.round(parseNumber(row.engagements)),
            landing_page_view: Math.round(parseNumber(row.landing_page_view)),
            cpl: parseNumber(row.cpl),
            brand_suitability_blocked: Math.round(parseNumber(row.brand_suitability_blocked)),
            brand_suitability_failed: Math.round(parseNumber(row.brand_suitability_failed)),
            impressions_verification: Math.round(parseNumber(row.impressions_verification)),
            measurable_impressions: Math.round(parseNumber(row.measurable_impressions)),
            measurable_rate: parseNumber(row.measurable_rate),
            tracked_ads: Math.round(parseNumber(row.tracked_ads)),
            viewability_rate: parseNumber(row.viewability_rate),
            viewability_rate_verification: parseNumber(row.viewability_rate_verification),
            viewability_impressions: Math.round(parseNumber(row.viewability_impressions)),
            platform: parseString(row.platform),
            device: parseString(row.device),
            campaign_category: parseString(row.campaign_category),
            campaign_label: parseString(row.campaign_label),
            campaign_type: parseString(row.campaign_type),
            ad_set_label: parseString(row.ad_set_label),
            ad_set_type: parseString(row.ad_set_type),
            ad_category: parseString(row.ad_category),
            ad_format: parseString(row.ad_format),
            ad_type: parseString(row.ad_type),
            age: parseString(row.age),
            gender: parseString(row.gender),
            roas: parseNumber(row.roas) || 0,
          };
        });

        const { error } = await supabase
          .from("meta_ads_campaigns")
          .insert(batch);

        if (error) {
          console.error("Batch insert error:", error);
          errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
        } else {
          inserted += batch.length;
        }
      }

      return new Response(
        JSON.stringify({ 
          success: errors.length === 0, 
          inserted,
          total: rows.length,
          errors: errors.length > 0 ? errors : undefined
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'clear' or 'import'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
