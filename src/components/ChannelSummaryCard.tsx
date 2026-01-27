import { LucideIcon, Search, Users, PlayCircle, Monitor, ArrowRightCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChannelData {
  id: string;
  name: string;
  icon: "search" | "social" | "youtube" | "programmatic" | "directBuy";
  color: string;
  metrics: {
    label: string;
    value: string | number;
    format?: "currency" | "number" | "percent";
  }[];
}

const iconMap: Record<string, LucideIcon> = {
  search: Search,
  social: Users,
  youtube: PlayCircle,
  programmatic: Monitor,
  directBuy: ArrowRightCircle,
};

const colorMap: Record<string, string> = {
  search: "bg-gradient-to-r from-pink-500 to-rose-500",
  social: "bg-gradient-to-r from-red-500 to-orange-500",
  youtube: "bg-gradient-to-r from-amber-400 to-yellow-400",
  programmatic: "bg-gradient-to-r from-amber-500 to-orange-400",
  directBuy: "bg-gradient-to-r from-amber-400 to-yellow-300",
};

interface ChannelSummaryCardProps {
  channel: ChannelData;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ChannelSummaryCard({ channel, isSelected, onClick }: ChannelSummaryCardProps) {
  const Icon = iconMap[channel.icon] || Search;
  const bgColor = colorMap[channel.icon] || "bg-muted";

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md",
        bgColor,
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <div className="p-4 flex items-start gap-4">
        {/* Icon and Name */}
        <div className="flex flex-col items-center gap-1 min-w-[80px]">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wide">
            {channel.name}
          </span>
        </div>

        {/* Metrics */}
        <div className="flex-1 grid grid-cols-5 gap-4">
          {channel.metrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className="text-lg font-bold text-white">
                {metric.format === "currency" && "$"}
                {typeof metric.value === "number" 
                  ? metric.value.toLocaleString() 
                  : metric.value}
                {metric.format === "percent" && "%"}
              </div>
              <div className="text-xs text-white/80">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
