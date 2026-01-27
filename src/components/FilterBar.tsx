import { Filter, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface FilterBarProps {
  channels: string[];
  platforms: string[];
  currencies: string[];
  selectedChannel: string;
  selectedPlatform: string;
  selectedCurrency: string;
  dateRange: { start: string; end: string };
  onChannelChange: (value: string) => void;
  onPlatformChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onDateRangeChange?: (range: { start: string; end: string }) => void;
}

export function FilterBar({
  channels,
  platforms,
  currencies,
  selectedChannel,
  selectedPlatform,
  selectedCurrency,
  dateRange,
  onChannelChange,
  onPlatformChange,
  onCurrencyChange,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-card border-b">
      <div className="flex-1 grid grid-cols-4 gap-4">
        {/* Channel Filter */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Channel</label>
          <Select value={selectedChannel} onValueChange={onChannelChange}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {channels.map((channel) => (
                <SelectItem key={channel} value={channel}>
                  {channel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Platform Filter */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Platform</label>
          <Select value={selectedPlatform} onValueChange={onPlatformChange}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {platforms.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Currency Filter */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Currency</label>
          <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="USD" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Date</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 border rounded-md bg-background text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{dateRange.start}</span>
            </div>
            <div className="flex-1 flex items-center gap-2 px-3 py-2 border rounded-md bg-background text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{dateRange.end}</span>
            </div>
          </div>
        </div>
      </div>

      <Button variant="outline" className="gap-2 mt-5">
        <Filter className="h-4 w-4" />
        Filters
      </Button>
    </div>
  );
}
