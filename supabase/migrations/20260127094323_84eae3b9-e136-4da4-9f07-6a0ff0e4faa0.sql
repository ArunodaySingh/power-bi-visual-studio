-- Create meta_ads_campaigns table for dashboard data
CREATE TABLE public.meta_ads_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  ad_set_name TEXT NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  spend NUMERIC(10, 2) NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC(5, 2) NOT NULL DEFAULT 0,
  cpc NUMERIC(10, 4) NOT NULL DEFAULT 0,
  cpm NUMERIC(10, 2) NOT NULL DEFAULT 0,
  roas NUMERIC(5, 2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public read for dashboard)
ALTER TABLE public.meta_ads_campaigns ENABLE ROW LEVEL SECURITY;

-- Allow public read access for dashboard
CREATE POLICY "Allow public read access"
ON public.meta_ads_campaigns
FOR SELECT
USING (true);

-- Create index for common queries
CREATE INDEX idx_meta_ads_campaigns_date ON public.meta_ads_campaigns(date);
CREATE INDEX idx_meta_ads_campaigns_campaign_name ON public.meta_ads_campaigns(campaign_name);

-- Insert 500 sample records with realistic Meta Ads data
INSERT INTO public.meta_ads_campaigns (campaign_id, campaign_name, ad_set_name, impressions, clicks, spend, conversions, ctr, cpc, cpm, roas, date)
SELECT 
  'camp_' || LPAD(n::text, 4, '0'),
  (ARRAY['Brand Awareness', 'Lead Generation', 'Product Launch', 'Holiday Sale', 'App Install', 'Video Views', 'Retargeting', 'Lookalike', 'Conversion', 'Traffic'])[1 + (n % 10)],
  (ARRAY['Lookalike 1%', 'Website Visitors', 'Interest - Tech', 'Custom Audience', 'Mobile Users', 'Broad Audience', 'Cart Abandoners', 'Email List', 'Engaged Users', 'New Customers'])[1 + ((n + 3) % 10)],
  10000 + (random() * 500000)::int,
  500 + (random() * 15000)::int,
  (100 + random() * 5000)::numeric(10,2),
  (10 + random() * 500)::int,
  (0.5 + random() * 8)::numeric(5,2),
  (0.1 + random() * 2)::numeric(10,4),
  (2 + random() * 30)::numeric(10,2),
  (0.5 + random() * 8)::numeric(5,2),
  DATE '2024-01-01' + ((n % 365) || ' days')::interval
FROM generate_series(1, 500) AS n;