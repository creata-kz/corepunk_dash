import React from 'react';
import { Tooltip as RechartsTooltip, TooltipProps } from 'recharts';

export type ChartConfig = Record<string, { label: string; color?: string }>; 

export const ChartContainer: React.FC<{ config?: ChartConfig; className?: string; children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>> = ({ config, className = '', style, children, ...rest }) => {
  // Пробрасываем CSS-переменные вида --color-key для использования в fill
  const cssVars: React.CSSProperties = { ...(style || {}) };
  if (config) {
    Object.entries(config).forEach(([key, value], idx) => {
      const varName = `--color-${key.toLowerCase()}`;
      if (value?.color) cssVars[varName as any] = value.color as any;
      // Дополнительно выставим --chart-n если нужно последовательное использование
      cssVars[`--chart-${idx + 1}` as any] = value?.color || cssVars[`--chart-${idx + 1}` as any];
    });
  }

  return (
    <div className={className} style={cssVars} {...rest}>
      {children}
    </div>
  );
};

export const ChartTooltip: React.FC<React.ComponentProps<typeof RechartsTooltip>> = (props) => {
  return <RechartsTooltip {...props} />;
};

export const ChartTooltipContent: React.FC<{ hideLabel?: boolean } & Partial<TooltipProps<number, string>>> = ({ hideLabel, active, label, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-brand-surface border border-brand-border rounded-md p-2 text-xs">
      {!hideLabel && <div className="text-brand-text-secondary mb-1">{label}</div>}
      <div className="space-y-0.5">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="text-brand-text-secondary">{p.name}</span>
            <span className="text-brand-text-primary font-semibold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
