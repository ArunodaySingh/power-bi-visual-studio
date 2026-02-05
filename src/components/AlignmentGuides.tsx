 import { cn } from "@/lib/utils";
 
 interface AlignmentLine {
   type: "horizontal" | "vertical";
   position: number;
   start: number;
   end: number;
 }
 
 interface AlignmentGuidesProps {
   lines: AlignmentLine[];
   canvasWidth: number;
   canvasHeight: number;
 }
 
 export function AlignmentGuides({ lines, canvasWidth, canvasHeight }: AlignmentGuidesProps) {
   if (lines.length === 0) return null;
 
   return (
     <svg
       className="absolute inset-0 pointer-events-none z-50"
       width={canvasWidth}
       height={canvasHeight}
       style={{ overflow: "visible" }}
     >
       {lines.map((line, index) => (
         <line
           key={index}
           x1={line.type === "vertical" ? line.position : line.start}
           y1={line.type === "horizontal" ? line.position : line.start}
           x2={line.type === "vertical" ? line.position : line.end}
           y2={line.type === "horizontal" ? line.position : line.end}
           stroke="hsl(var(--primary))"
           strokeWidth="1"
           strokeDasharray="4 4"
           className="animate-pulse"
         />
       ))}
     </svg>
   );
 }
 
 export type { AlignmentLine };