import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface DataPoint {
  id: string;
  category: string;
  value: number;
  // Additional value fields for multi-metric charts
  [key: string]: string | number;
}

interface DataEditorProps {
  data: DataPoint[];
  onChange: (data: DataPoint[]) => void;
}

interface SortableRowProps {
  item: DataPoint;
  onUpdate: (id: string, field: "category" | "value", value: string | number) => void;
  onDelete: (id: string) => void;
}

function SortableRow({ item, onUpdate, onDelete }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[24px_1fr_80px_40px] gap-2 items-center"
    >
      <button
        {...attributes}
        {...listeners}
        className="flex items-center justify-center h-8 w-6 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        value={item.category}
        onChange={(e) => onUpdate(item.id, "category", e.target.value)}
        className="h-8 text-sm"
      />
      <Input
        type="number"
        value={item.value}
        onChange={(e) => onUpdate(item.id, "value", Number(e.target.value))}
        className="h-8 text-sm"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(item.id)}
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function DataEditor({ data, onChange }: DataEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addRow = () => {
    const newId = crypto.randomUUID();
    onChange([
      ...data,
      {
        id: newId,
        category: `Category ${data.length + 1}`,
        value: Math.floor(Math.random() * 100),
      },
    ]);
  };

  const updateRow = (
    id: string,
    field: "category" | "value",
    value: string | number
  ) => {
    onChange(
      data.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const deleteRow = (id: string) => {
    onChange(data.filter((item) => item.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = data.findIndex((item) => item.id === active.id);
      const newIndex = data.findIndex((item) => item.id === over.id);
      onChange(arrayMove(data, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[24px_1fr_80px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
        <span></span>
        <span>Category</span>
        <span>Value</span>
        <span></span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={data} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {data.map((item) => (
              <SortableRow
                key={item.id}
                item={item}
                onUpdate={updateRow}
                onDelete={deleteRow}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button variant="outline" size="sm" onClick={addRow} className="w-full gap-2">
        <Plus className="h-4 w-4" />
        Add Row
      </Button>
    </div>
  );
}
