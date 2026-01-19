import { Plus, X, Edit2, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface Sheet {
  id: string;
  name: string;
}

interface SheetTabsProps {
  sheets: Sheet[];
  activeSheetId: string;
  onSelectSheet: (id: string) => void;
  onAddSheet: () => void;
  onDeleteSheet: (id: string) => void;
  onRenameSheet: (id: string, name: string) => void;
}

export function SheetTabs({
  sheets,
  activeSheetId,
  onSelectSheet,
  onAddSheet,
  onDeleteSheet,
  onRenameSheet,
}: SheetTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleStartEdit = (sheet: Sheet) => {
    setEditingId(sheet.id);
    setEditName(sheet.name);
  };

  const handleConfirmEdit = () => {
    if (editingId && editName.trim()) {
      onRenameSheet(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirmEdit();
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditName("");
    }
  };

  return (
    <div className="h-10 border-t bg-card flex items-center px-2 gap-1 overflow-x-auto">
      {sheets.map((sheet) => (
        <div
          key={sheet.id}
          className={cn(
            "group flex items-center gap-1 px-3 py-1.5 rounded-t-md text-sm cursor-pointer transition-colors border border-b-0",
            activeSheetId === sheet.id
              ? "bg-background border-border text-foreground font-medium"
              : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          onClick={() => onSelectSheet(sheet.id)}
        >
          {editingId === sheet.id ? (
            <div className="flex items-center gap-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-5 w-20 text-xs px-1"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmEdit();
                }}
              >
                <Check className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <span>{sheet.name}</span>
              <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 opacity-60 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(sheet);
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                {sheets.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 opacity-60 hover:opacity-100 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSheet(sheet.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      ))}
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 ml-1"
        onClick={onAddSheet}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
