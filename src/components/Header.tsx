import { Zap, Github, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="h-14 border-b bg-card px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-powerbi">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-semibold">Power BI Visual Builder</h1>
          <p className="text-xs text-muted-foreground">Design custom visuals with React</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <FileCode className="h-4 w-4" />
          Docs
        </Button>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Github className="h-4 w-4" />
          GitHub
        </Button>
      </div>
    </header>
  );
}
