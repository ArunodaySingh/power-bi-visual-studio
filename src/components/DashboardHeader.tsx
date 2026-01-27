import { Play, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
}

interface DashboardHeaderProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  title?: string;
}

export function DashboardHeader({ tabs, activeTab, onTabChange, title = "Campaign Performance" }: DashboardHeaderProps) {
  return (
    <header className="h-14 border-b bg-card px-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded text-primary">
            <Play className="h-5 w-5 fill-current" />
          </div>
          <h1 className="text-sm font-semibold">{title}</h1>
        </div>
        
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors relative",
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
              )}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>IN / WM / Colgate</span>
        <HelpCircle className="h-5 w-5" />
      </div>
    </header>
  );
}
