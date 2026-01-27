import { ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface OverviewSectionProps {
  title: string;
  dimensions: string[];
  selectedDimension: string;
  onDimensionChange: (value: string) => void;
  children: React.ReactNode;
}

export function OverviewSection({
  title,
  dimensions,
  selectedDimension,
  onDimensionChange,
  children,
}: OverviewSectionProps) {
  return (
    <div className="bg-card rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Dimension</label>
        <Select value={selectedDimension} onValueChange={onDimensionChange}>
          <SelectTrigger className="w-64 bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dimensions.map((dim) => (
              <SelectItem key={dim} value={dim}>
                {dim}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );
}
