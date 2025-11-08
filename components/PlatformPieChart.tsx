import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DailyMetric } from '../types';
import { getPlatformIcon } from '../utils/platformIcons';

interface PlatformPieChartProps {
  metrics: DailyMetric[];
  metricKey?: 'dailyMentions' | 'likes' | 'totalComments' | 'reach' | 'negativeComments';
  title?: string;
  description?: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  'Reddit': '#F59E0B',
  'Youtube': '#EF4444',
  'Instagram': '#A855F7',
  'X': '#FFFFFF', // Белый цвет
  'Twitter': '#FFFFFF', // Поддержка старого названия для обратной совместимости
  'Tiktok': '#EC4899',
  'TikTok': '#EC4899',
  'Vk': '#3B82F6',
  'Discord': '#6366F1',
};

// Кастомный tooltip для пирчарта
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const platform = data.name;
    const value = data.value;
    const percentage = data.payload.percentage || 0;
    const icon = getPlatformIcon(platform, 'w-4 h-4');
    
    return (
      <div className="bg-brand-surface border border-brand-border rounded-lg p-3 shadow-xl" style={{ backgroundColor: 'rgba(22, 27, 34, 0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="font-semibold text-brand-text-primary">{platform}</span>
        </div>
        <div className="text-xs text-brand-text-secondary">
          <div className="flex justify-between gap-4">
            <span>Value:</span>
            <span className="font-semibold text-brand-text-primary">{value.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-4 mt-1">
            <span>Share:</span>
            <span className="font-semibold text-brand-text-primary">
              {percentage < 1 ? percentage.toFixed(1) : percentage.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const PlatformPieChart: React.FC<PlatformPieChartProps> = ({
  metrics,
  metricKey = 'dailyMentions',
  title = 'Platform Distribution',
  description,
}) => {
  const { chartData, total }: { chartData: { name: string; value: number; fill: string; percentage: number }[]; total: number } = useMemo(() => {
    const totals: Record<string, number> = {};

    metrics.forEach(m => {
      if (!m.byPlatform) return;
      Object.entries(m.byPlatform).forEach(([platform, data]) => {
        let value = 0;
        if (metricKey === 'dailyMentions') value = data.dailyMentions || 0;
        else if (metricKey === 'likes') value = data.likes || 0;
        else if (metricKey === 'totalComments') value = data.comments || 0;
        else if (metricKey === 'reach') value = data.reach || 0;
        else if (metricKey === 'negativeComments') value = data.negativeComments || 0;
        totals[platform] = (totals[platform] || 0) + value;
      });
    });

    const entries = Object.entries(totals)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);

    const totalValue = entries.reduce((acc, [, v]) => acc + v, 0);

    const chartData = entries.map(([platform, value]) => ({
      name: platform,
      value,
      fill: PLATFORM_COLORS[platform] || '#6B7280',
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }));

    return { chartData, total: totalValue };
  }, [metrics, metricKey]);

  return (
    <div className="glass-card p-6 rounded-xl h-full flex flex-col">
      <div className="shrink-0 mb-4">
        <h3 className="text-xl font-semibold text-brand-text-primary mb-1">{title}</h3>
        {description && <p className="text-xs text-brand-text-secondary">{description}</p>}
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={chartData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              label={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} strokeWidth={1} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Легенда с иконками и названиями платформ */}
      <div className="shrink-0 mt-4 pt-4 border-t border-brand-border">
        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto pr-2">
          {chartData.map((entry) => {
            const icon = getPlatformIcon(entry.name, 'w-4 h-4');
            const formattedPercentage = entry.percentage < 1 
              ? entry.percentage.toFixed(1) 
              : entry.percentage.toFixed(0);
            
            return (
              <div 
                key={entry.name} 
                className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0">{icon}</span>
                    <span className="text-xs font-medium text-brand-text-primary truncate">{entry.name}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-brand-text-secondary">
                    {entry.value.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-brand-text-primary w-10 text-right">
                    {formattedPercentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
