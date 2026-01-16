import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface DataPoint {
  id: string;
  category: string;
  value: number;
}

interface DataEditorProps {
  data: DataPoint[];
  onChange: (data: DataPoint[]) => void;
}

export function DataEditor({ data, onChange }: DataEditorProps) {
  const addRow = () => {
    const newId = crypto.randomUUID();
    onChange([...data, { id: newId, category: `Category ${data.length + 1}`, value: Math.floor(Math.random() * 100) }]);
  };

  const updateRow = (id: string, field: "category" | "value", value: string | number) => {
    onChange(
      data.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const deleteRow = (id: string) => {
    onChange(data.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_80px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
        <span>Category</span>
        <span>Value</span>
        <span></span>
      </div>
      
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {data.map((item) => (
          <div key={item.id} className="grid grid-cols-[1fr_80px_40px] gap-2 items-center">
            <Input
              value={item.category}
              onChange={(e) => updateRow(item.id, "category", e.target.value)}
              className="h-8 text-sm"
            />
            <Input
              type="number"
              value={item.value}
              onChange={(e) => updateRow(item.id, "value", Number(e.target.value))}
              className="h-8 text-sm"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteRow(item.id)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={addRow}
        className="w-full gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Row
      </Button>
    </div>
  );
}
