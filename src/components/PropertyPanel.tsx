import { useState } from "react";
import { ChevronDown, ChevronRight, Palette, Type, Layout, Sliders, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ConditionalFormatting } from "@/components/formatting";
import type { ConditionalRule } from "@/types/dashboard";

export type LegendPosition = "top" | "bottom" | "left" | "right";
export type BarChartMode = "grouped" | "stacked";

export interface VisualProperties {
  title: string;
  showTitle: boolean;
  showLegend: boolean;
  legendPosition: LegendPosition;
  showDataLabels: boolean;
  primaryColor: string;
  backgroundColor: string;
  fontSize: number;
  borderRadius: number;
  animationDuration: number;
  barChartMode: BarChartMode;
  conditionalFormatting?: ConditionalRule[];
}

interface PropertyPanelProps {
  properties: VisualProperties;
  onChange: (props: VisualProperties) => void;
}

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon: Icon, children, defaultOpen = true }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-secondary/50 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <Icon className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium">{title}</span>
      </button>
      {isOpen && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
}

interface PropertyPanelProps {
  properties: VisualProperties;
  onChange: (props: VisualProperties) => void;
  availableFields?: string[];
}

export function PropertyPanel({ properties, onChange, availableFields = [] }: PropertyPanelProps) {
  const updateProperty = <K extends keyof VisualProperties>(
    key: K,
    value: VisualProperties[K]
  ) => {
    onChange({ ...properties, [key]: value });
  };

  return (
    <div className="h-full overflow-y-auto">
      <Section title="General" icon={Layout}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs text-muted-foreground">
              Visual Title
            </Label>
            <Input
              id="title"
              value={properties.title}
              onChange={(e) => updateProperty("title", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="showTitle" className="text-xs text-muted-foreground">
              Show Title
            </Label>
            <Switch
              id="showTitle"
              checked={properties.showTitle}
              onCheckedChange={(checked) => updateProperty("showTitle", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="showLegend" className="text-xs text-muted-foreground">
              Show Legend
            </Label>
            <Switch
              id="showLegend"
              checked={properties.showLegend}
              onCheckedChange={(checked) => updateProperty("showLegend", checked)}
            />
          </div>
          {properties.showLegend && (
            <div className="space-y-1.5 pl-2 border-l-2 border-border">
              <Label className="text-xs text-muted-foreground">Legend Position</Label>
              <RadioGroup
                value={properties.legendPosition || "bottom"}
                onValueChange={(value) => updateProperty("legendPosition", value as "top" | "bottom" | "left" | "right")}
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="top" id="legend-top" />
                  <Label htmlFor="legend-top" className="text-xs">Top</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bottom" id="legend-bottom" />
                  <Label htmlFor="legend-bottom" className="text-xs">Bottom</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="left" id="legend-left" />
                  <Label htmlFor="legend-left" className="text-xs">Left</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="right" id="legend-right" />
                  <Label htmlFor="legend-right" className="text-xs">Right</Label>
                </div>
              </RadioGroup>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label htmlFor="showDataLabels" className="text-xs text-muted-foreground">
              Show Data Labels
            </Label>
            <Switch
              id="showDataLabels"
              checked={properties.showDataLabels}
              onCheckedChange={(checked) => updateProperty("showDataLabels", checked)}
            />
          </div>
        </div>
      </Section>

      <Section title="Colors" icon={Palette}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Primary Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={properties.primaryColor}
                onChange={(e) => updateProperty("primaryColor", e.target.value)}
                className="h-8 w-12 rounded border cursor-pointer"
              />
              <Input
                value={properties.primaryColor}
                onChange={(e) => updateProperty("primaryColor", e.target.value)}
                className="h-8 text-sm flex-1 font-mono"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Background Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={properties.backgroundColor}
                onChange={(e) => updateProperty("backgroundColor", e.target.value)}
                className="h-8 w-12 rounded border cursor-pointer"
              />
              <Input
                value={properties.backgroundColor}
                onChange={(e) => updateProperty("backgroundColor", e.target.value)}
                className="h-8 text-sm flex-1 font-mono"
              />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Typography" icon={Type} defaultOpen={false}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Font Size</Label>
              <span className="text-xs font-mono text-muted-foreground">
                {properties.fontSize}px
              </span>
            </div>
            <Slider
              value={[properties.fontSize]}
              onValueChange={([value]) => updateProperty("fontSize", value)}
              min={1}
              max={28}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </Section>

      <Section title="Effects" icon={Sliders} defaultOpen={false}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Border Radius</Label>
              <span className="text-xs font-mono text-muted-foreground">
                {properties.borderRadius}px
              </span>
            </div>
            <Slider
              value={[properties.borderRadius]}
              onValueChange={([value]) => updateProperty("borderRadius", value)}
              min={0}
              max={20}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </Section>

      <Section title="Bar Chart Options" icon={BarChart3} defaultOpen={false}>
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground">Bar Display Mode</Label>
          <RadioGroup
            value={properties.barChartMode || "grouped"}
            onValueChange={(value) => updateProperty("barChartMode", value as "grouped" | "stacked")}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="grouped" id="bar-grouped" />
              <Label htmlFor="bar-grouped" className="text-xs">Grouped (Side by Side)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="stacked" id="bar-stacked" />
              <Label htmlFor="bar-stacked" className="text-xs">Stacked</Label>
            </div>
          </RadioGroup>
        </div>
      </Section>

      <Section title="Conditional Formatting" icon={Palette} defaultOpen={false}>
        <ConditionalFormatting
          rules={properties.conditionalFormatting || []}
          availableFields={availableFields.length > 0 ? availableFields : ["value"]}
          onChange={(rules) => updateProperty("conditionalFormatting", rules)}
        />
      </Section>
    </div>
  );
}
