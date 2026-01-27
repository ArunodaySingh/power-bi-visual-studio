import type { DataPoint } from "@/components/DataEditor";
import type { VisualProperties } from "@/components/PropertyPanel";
import type { VisualType } from "@/components/VisualTypeSelector";
import type { CanvasVisualData } from "@/components/CanvasVisual";

// Meta Ads dummy data - structured for future BigQuery integration
export interface MetaAdsCampaign {
  campaignId: string;
  campaignName: string;
  adSetName: string;
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

export const metaAdsRawData: MetaAdsCampaign[] = [
  { campaignId: "camp_001", campaignName: "Brand Awareness Q1", adSetName: "Lookalike 1%", impressions: 125000, clicks: 3750, spend: 1250, conversions: 89, ctr: 3.0, cpc: 0.33, cpm: 10.0, roas: 2.8, date: "2024-01-15" },
  { campaignId: "camp_002", campaignName: "Lead Gen - Retargeting", adSetName: "Website Visitors", impressions: 45000, clicks: 2250, spend: 890, conversions: 156, ctr: 5.0, cpc: 0.40, cpm: 19.8, roas: 4.2, date: "2024-01-15" },
  { campaignId: "camp_003", campaignName: "Product Launch", adSetName: "Interest - Tech", impressions: 89000, clicks: 1780, spend: 1560, conversions: 67, ctr: 2.0, cpc: 0.88, cpm: 17.5, roas: 1.9, date: "2024-01-15" },
  { campaignId: "camp_004", campaignName: "Holiday Sale", adSetName: "Custom Audience", impressions: 156000, clicks: 6240, spend: 2340, conversions: 234, ctr: 4.0, cpc: 0.38, cpm: 15.0, roas: 5.1, date: "2024-01-15" },
  { campaignId: "camp_005", campaignName: "App Install", adSetName: "Mobile Users", impressions: 234000, clicks: 4680, spend: 1890, conversions: 312, ctr: 2.0, cpc: 0.40, cpm: 8.1, roas: 3.4, date: "2024-01-15" },
  { campaignId: "camp_006", campaignName: "Video Views", adSetName: "Broad Audience", impressions: 567000, clicks: 8505, spend: 980, conversions: 45, ctr: 1.5, cpc: 0.12, cpm: 1.7, roas: 1.2, date: "2024-01-15" },
];

// Aggregated data for charts
export const metaAdsSpendByCampaign: DataPoint[] = metaAdsRawData.map((campaign) => ({
  id: crypto.randomUUID(),
  category: campaign.campaignName.slice(0, 20),
  value: campaign.spend,
}));

export const metaAdsConversionsByCampaign: DataPoint[] = metaAdsRawData.map((campaign) => ({
  id: crypto.randomUUID(),
  category: campaign.campaignName.slice(0, 20),
  value: campaign.conversions,
}));

export const metaAdsROASByCampaign: DataPoint[] = metaAdsRawData.map((campaign) => ({
  id: crypto.randomUUID(),
  category: campaign.campaignName.slice(0, 20),
  value: Math.round(campaign.roas * 100) / 100,
}));

export const metaAdsCTRByCampaign: DataPoint[] = metaAdsRawData.map((campaign) => ({
  id: crypto.randomUUID(),
  category: campaign.campaignName.slice(0, 20),
  value: campaign.ctr,
}));

export const metaAdsImpressionsByCampaign: DataPoint[] = metaAdsRawData.map((campaign) => ({
  id: crypto.randomUUID(),
  category: campaign.campaignName.slice(0, 20),
  value: Math.round(campaign.impressions / 1000), // in thousands
}));

// Summary metrics
export const metaAdsSummary = {
  totalSpend: metaAdsRawData.reduce((sum, c) => sum + c.spend, 0),
  totalImpressions: metaAdsRawData.reduce((sum, c) => sum + c.impressions, 0),
  totalClicks: metaAdsRawData.reduce((sum, c) => sum + c.clicks, 0),
  totalConversions: metaAdsRawData.reduce((sum, c) => sum + c.conversions, 0),
  avgCTR: metaAdsRawData.reduce((sum, c) => sum + c.ctr, 0) / metaAdsRawData.length,
  avgROAS: metaAdsRawData.reduce((sum, c) => sum + c.roas, 0) / metaAdsRawData.length,
};

// Pre-configured visuals for Meta Ads dashboard
export const createMetaAdsVisuals = (): CanvasVisualData[] => [
  {
    id: crypto.randomUUID(),
    type: "bar" as VisualType,
    data: metaAdsSpendByCampaign,
    properties: {
      title: "Ad Spend by Campaign ($)",
      showTitle: true,
      showLegend: false,
      legendPosition: "bottom",
      showDataLabels: true,
      primaryColor: "#3b82f6",
      backgroundColor: "#ffffff",
      fontSize: 12,
      borderRadius: 8,
      animationDuration: 500,
      barChartMode: "grouped",
    },
    position: { x: 20, y: 20 },
    size: { width: 480, height: 320 },
  },
  {
    id: crypto.randomUUID(),
    type: "bar" as VisualType,
    data: metaAdsConversionsByCampaign,
    properties: {
      title: "Conversions by Campaign",
      showTitle: true,
      showLegend: false,
      legendPosition: "bottom",
      showDataLabels: true,
      primaryColor: "#10b981",
      backgroundColor: "#ffffff",
      fontSize: 12,
      borderRadius: 8,
      animationDuration: 500,
      barChartMode: "grouped",
    },
    position: { x: 520, y: 20 },
    size: { width: 480, height: 320 },
  },
  {
    id: crypto.randomUUID(),
    type: "line" as VisualType,
    data: metaAdsROASByCampaign,
    properties: {
      title: "ROAS by Campaign",
      showTitle: true,
      showLegend: false,
      legendPosition: "bottom",
      showDataLabels: true,
      primaryColor: "#8b5cf6",
      backgroundColor: "#ffffff",
      fontSize: 12,
      borderRadius: 8,
      animationDuration: 500,
      barChartMode: "grouped",
    },
    position: { x: 20, y: 360 },
    size: { width: 480, height: 320 },
  },
  {
    id: crypto.randomUUID(),
    type: "pie" as VisualType,
    data: metaAdsImpressionsByCampaign,
    properties: {
      title: "Impressions Distribution (K)",
      showTitle: true,
      showLegend: true,
      legendPosition: "bottom",
      showDataLabels: true,
      primaryColor: "#f59e0b",
      backgroundColor: "#ffffff",
      fontSize: 12,
      borderRadius: 8,
      animationDuration: 500,
      barChartMode: "grouped",
    },
    position: { x: 520, y: 360 },
    size: { width: 480, height: 320 },
  },
];
