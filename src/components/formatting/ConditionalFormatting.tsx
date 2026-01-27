import { useState } from "react";
import { Plus, Trash2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConditionalRule, RuleCondition } from "@/types/dashboard";

interface ConditionalFormattingProps {
  rules: ConditionalRule[];
  availableFields: string[];
  onChange: (rules: ConditionalRule[]) => void;
}

export function ConditionalFormatting({
  rules,
  availableFields,
  onChange,
}: ConditionalFormattingProps) {
  const [expandedRuleIndex, setExpandedRuleIndex] = useState<number | null>(null);

  const addRule = () => {
    const newRule: ConditionalRule = {
      type: "gradient",
      field: availableFields[0] || "",
      conditions: [
        { operator: "gte", value: 0, color: "#22c55e" },
        { operator: "lt", value: 0, color: "#ef4444" },
      ],
    };
    onChange([...rules, newRule]);
    setExpandedRuleIndex(rules.length);
  };

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, updates: Partial<ConditionalRule>) => {
    onChange(
      rules.map((rule, i) => (i === index ? { ...rule, ...updates } : rule))
    );
  };

  const updateCondition = (
    ruleIndex: number,
    conditionIndex: number,
    updates: Partial<RuleCondition>
  ) => {
    const updatedRules = [...rules];
    const rule = updatedRules[ruleIndex];
    rule.conditions = rule.conditions.map((cond, i) =>
      i === conditionIndex ? { ...cond, ...updates } : cond
    );
    onChange(updatedRules);
  };

  const addCondition = (ruleIndex: number) => {
    const updatedRules = [...rules];
    updatedRules[ruleIndex].conditions.push({
      operator: "eq",
      value: 50,
      color: "#f59e0b",
    });
    onChange(updatedRules);
  };

  const removeCondition = (ruleIndex: number, conditionIndex: number) => {
    const updatedRules = [...rules];
    updatedRules[ruleIndex].conditions = updatedRules[
      ruleIndex
    ].conditions.filter((_, i) => i !== conditionIndex);
    onChange(updatedRules);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Conditional Formatting
          </h3>
        </div>
        <Button size="sm" variant="outline" onClick={addRule} className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Add Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-4 border rounded-lg border-dashed">
          No formatting rules. Click "Add Rule" to create one.
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, ruleIndex) => (
            <div
              key={ruleIndex}
              className="border rounded-lg bg-card overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() =>
                  setExpandedRuleIndex(
                    expandedRuleIndex === ruleIndex ? null : ruleIndex
                  )
                }
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{
                      background:
                        rule.type === "gradient"
                          ? `linear-gradient(90deg, ${rule.conditions[0]?.color || "#22c55e"}, ${rule.conditions[1]?.color || "#ef4444"})`
                          : rule.conditions[0]?.color || "#22c55e",
                    }}
                  />
                  <span className="text-sm font-medium capitalize">
                    {rule.type} on {rule.field}
                  </span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRule(ruleIndex);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {expandedRuleIndex === ruleIndex && (
                <div className="p-3 pt-0 space-y-3 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={rule.type}
                        onValueChange={(value) =>
                          updateRule(ruleIndex, {
                            type: value as ConditionalRule["type"],
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="gradient">Gradient</SelectItem>
                          <SelectItem value="threshold">Threshold</SelectItem>
                          <SelectItem value="databar">Data Bar</SelectItem>
                          <SelectItem value="icon">Icon Set</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Field</Label>
                      <Select
                        value={rule.field}
                        onValueChange={(value) =>
                          updateRule(ruleIndex, { field: value })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {availableFields.map((field) => (
                            <SelectItem key={field} value={field}>
                              {field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Conditions</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        onClick={() => addCondition(ruleIndex)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    {rule.conditions.map((condition, condIndex) => (
                      <div
                        key={condIndex}
                        className="flex items-center gap-2 p-2 bg-muted/30 rounded"
                      >
                        <Select
                          value={condition.operator}
                          onValueChange={(value) =>
                            updateCondition(ruleIndex, condIndex, {
                              operator: value as RuleCondition["operator"],
                            })
                          }
                        >
                          <SelectTrigger className="h-7 w-20 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50">
                            <SelectItem value="gt">&gt;</SelectItem>
                            <SelectItem value="gte">≥</SelectItem>
                            <SelectItem value="lt">&lt;</SelectItem>
                            <SelectItem value="lte">≤</SelectItem>
                            <SelectItem value="eq">=</SelectItem>
                            <SelectItem value="between">Between</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={condition.value}
                          onChange={(e) =>
                            updateCondition(ruleIndex, condIndex, {
                              value: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="h-7 w-16 text-xs"
                        />
                        {condition.operator === "between" && (
                          <Input
                            type="number"
                            value={condition.value2 || 0}
                            onChange={(e) =>
                              updateCondition(ruleIndex, condIndex, {
                                value2: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="h-7 w-16 text-xs"
                          />
                        )}
                        <input
                          type="color"
                          value={condition.color || "#22c55e"}
                          onChange={(e) =>
                            updateCondition(ruleIndex, condIndex, {
                              color: e.target.value,
                            })
                          }
                          className="h-7 w-8 rounded cursor-pointer"
                        />
                        {rule.conditions.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => removeCondition(ruleIndex, condIndex)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
