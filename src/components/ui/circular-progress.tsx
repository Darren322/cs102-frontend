import * as React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;          // 0–100
  size?: number;           // px diameter
  stroke?: number;         // px ring thickness
}

export function CircularProgress({
  value = 0,
  size = 120,
  stroke = 10,
  className,
  ...props
}: CircularProgressProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;

  return (
    <div
      className={cn("relative inline-block", className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg]"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={stroke}
          opacity={0.2}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          className="transition-all duration-200"
        />
      </svg>
      {/* Inner content */}
      <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
        {Math.round(value)}%
      </div>
    </div>
  );
}
