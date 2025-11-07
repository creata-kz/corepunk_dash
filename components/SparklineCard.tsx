import React, { useState, useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, TooltipProps } from 'recharts';
import { DailyMetric } from '../types';

interface SparklineCardProps {
  title: string;
  value: string;
  change: number;
  changeType?: 'positive' | 'negative';
  data: any[];
  dataKey: string;
  strokeColor: string;
  fullMetrics?: DailyMetric[]; // Полные метрики с byPlatform
  metricKey?: keyof DailyMetric; // Какую метрику показывать ('likes', 'reach', и т.д.)
  description?: string; // Описание метрики
  onClick?: () => void; // Обработчик клика на карточку
}

const ArrowUpIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
    </svg>
);

const ArrowDownIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-3.707-9.293l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414z" clipRule="evenodd" />
    </svg>
);

// Custom tooltip для показа платформ
const CustomTooltip: React.FC<TooltipProps<number, string> & {
  fullMetrics?: DailyMetric[],
  metricKey?: string,
  title?: string
}> = ({ active, payload, fullMetrics, metricKey, title }) => {
  if (!active || !payload || !payload[0] || !fullMetrics || !metricKey) {
    return null;
  }

  // Находим индекс точки в данных (это локальный индекс в last7DaysMetrics)
  const localIndex = payload[0].payload.index;
  if (localIndex === undefined || localIndex < 0 || localIndex >= fullMetrics.length) {
    return null;
  }

  const metric = fullMetrics[localIndex];
  const byPlatform = metric.byPlatform;

  // Если нет данных по платформам, показываем обычный tooltip
  if (!byPlatform || Object.keys(byPlatform).length === 0) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-lg p-2 text-xs z-[9999] relative">
        <p className="text-brand-text-secondary">{metric.date}</p>
        <p className="text-brand-text-primary font-semibold">{title}: {payload[0].value}</p>
        <p className="text-red-400 text-[10px] mt-1">No platform data</p>
      </div>
    );
  }

  // Маппинг ключей метрик на ключи в byPlatform
  const metricKeyMap: Record<string, keyof typeof byPlatform[string] | undefined> = {
    'dailyMentions': 'dailyMentions',
    'likes': 'likes',
    'totalComments': 'comments',
    'reach': 'reach',
    'negativeComments': 'negativeComments',
    'engagementScore': undefined, // Engagement Score не имеет breakdown по платформам
    'sentimentPercent': undefined, // Sentiment также не имеет breakdown
  };

  const platformKey = metricKeyMap[metricKey];

  // Если метрика не имеет platform breakdown, показываем простой tooltip
  if (!platformKey) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-lg p-2 text-xs z-[9999] relative">
        <p className="text-brand-text-secondary">{metric.date}</p>
        <p className="text-brand-text-primary font-semibold">{title}: {payload[0].value}</p>
      </div>
    );
  }

  // Сортируем платформы по значению метрики (от большего к меньшему)
  const allPlatforms = Object.entries(byPlatform)
    .map(([platform, metrics]) => ({ platform, value: metrics[platformKey] || 0 }));

  const sortedPlatforms = allPlatforms
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-brand-surface border border-brand-border rounded-lg p-3 text-xs shadow-xl z-[9999] relative">
      <p className="text-brand-text-secondary mb-2 font-medium">{metric.date}</p>
      <p className="text-brand-text-primary font-bold mb-2">{title}: {payload[0].value?.toLocaleString()}</p>
      {sortedPlatforms.length > 0 && (
        <div className="border-t border-brand-border pt-2 mt-1">
          <p className="text-brand-text-secondary text-[10px] mb-1 uppercase tracking-wide">По платформам:</p>
          {sortedPlatforms.map(({ platform, value }) => (
            <div key={platform} className="flex justify-between items-center py-0.5">
              <span className="text-brand-text-secondary">{platform}:</span>
              <span className="text-brand-text-primary font-semibold ml-2">{value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const SparklineCard: React.FC<SparklineCardProps> = ({
  title,
  value,
  change,
  changeType = 'positive',
  data,
  dataKey,
  strokeColor,
  fullMetrics,
  metricKey,
  description,
  onClick
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const isPositive = change >= 0;
  const changeColor = (changeType === 'positive' ? isPositive : !isPositive) ? 'text-green-400' : 'text-red-400';

  // Добавляем локальные индексы к данным (0, 1, 2, ..., 6 для последних 7 дней)
  const last7DaysData = data.slice(-7).map((item, idx) => ({
    ...item,
    index: idx // Локальный индекс в пределах last7DaysMetrics
  }));

  // Получаем последние 7 дней из fullMetrics
  const last7DaysMetrics = fullMetrics ? fullMetrics.slice(-7) : undefined;

  // Расчет топ платформ по вкладу в метрику
  const platformBreakdown = useMemo(() => {
    if (!fullMetrics || !metricKey || fullMetrics.length === 0) return null;

    // Суммируем по платформам
    const platformTotals: Record<string, number> = {};
    let totalValue = 0;

    // Специальная обработка для engagementScore
    if (metricKey === 'engagementScore') {
      fullMetrics.forEach(metric => {
        if (metric.byPlatform) {
          Object.entries(metric.byPlatform).forEach(([platform, data]) => {
            // Вычисляем engagement score для платформы: likes * 1.5 + comments * 2 + reach * 0.1
            const engagement = Math.round(
              (data.likes || 0) * 1.5 +
              (data.comments || 0) * 2 +
              (data.reach || 0) * 0.1
            );
            platformTotals[platform] = (platformTotals[platform] || 0) + engagement;
            totalValue += engagement;
          });
        }
      });
    } else {
      // Обычные метрики с прямым маппингом
      const metricKeyMap: Record<string, keyof DailyMetric['byPlatform'][string] | undefined> = {
        'dailyMentions': 'dailyMentions',
        'likes': 'likes',
        'totalComments': 'comments',
        'reach': 'reach',
        'negativeComments': 'negativeComments',
      };

      const platformKey = metricKeyMap[metricKey as string];
      if (!platformKey) return null;

      fullMetrics.forEach(metric => {
        if (metric.byPlatform) {
          Object.entries(metric.byPlatform).forEach(([platform, data]) => {
            const val = data[platformKey] || 0;
            platformTotals[platform] = (platformTotals[platform] || 0) + val;
            totalValue += val;
          });
        }
      });
    }

    if (totalValue === 0) return null;

    // Сортируем по вкладу и берем топ-3
    const sorted = Object.entries(platformTotals)
      .map(([platform, value]) => ({
        platform,
        value,
        percentage: Math.round((value / totalValue) * 100)
      }))
      .filter(p => p.percentage > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    return sorted.length > 0 ? sorted : null;
  }, [fullMetrics, metricKey]);

  // Иконки и цвета для платформ
  const platformStyles: Record<string, { emoji: string; color: string }> = {
    'Reddit': { emoji: '🔴', color: 'text-orange-400' },
    'Youtube': { emoji: '📺', color: 'text-red-400' },
    'Tiktok': { emoji: '🎵', color: 'text-pink-400' },
    'Vk': { emoji: '🔵', color: 'text-blue-400' },
    'Discord': { emoji: '💬', color: 'text-indigo-400' },
    'Twitter': { emoji: '🐦', color: 'text-sky-400' },
    'Instagram': { emoji: '📸', color: 'text-purple-400' },
  };

  return (
    <div
      className={`glass-card p-4 rounded-xl flex flex-col h-40 relative ${onClick ? 'cursor-pointer hover:border-brand-primary transition-all' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="text-brand-text-secondary text-sm font-medium mb-2">{title}</h3>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-2xl font-semibold text-brand-text-primary">{value}</p>
            <div className={`flex items-center text-sm font-medium ${changeColor} whitespace-nowrap`}>
                {isPositive ? <ArrowUpIcon/> : <ArrowDownIcon/>}
                <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          </div>

          {/* Platform breakdown badges */}
          {platformBreakdown && (
            <div className="flex gap-1 flex-wrap">
              {platformBreakdown.map(({ platform, percentage }) => {
                const style = platformStyles[platform] || { emoji: '📊', color: 'text-gray-400' };
                return (
                  <span
                    key={platform}
                    className={`text-[10px] ${style.color} flex items-center gap-0.5 px-1 py-0.5 bg-white/5 rounded`}
                    title={`${platform}: ${percentage}%`}
                  >
                    <span>{style.emoji}</span>
                    <span className="font-medium">{percentage}%</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Button */}
        {description && (
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(!showTooltip);
              }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-brand-text-secondary hover:text-brand-primary transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Tooltip */}
            {showTooltip && (
              <div className="absolute top-8 right-0 w-64 bg-brand-surface border border-brand-border rounded-lg p-3 shadow-xl z-[9999] text-sm text-brand-text-secondary">
                {description}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={last7DaysData}>
            <Tooltip
              content={<CustomTooltip fullMetrics={last7DaysMetrics} metricKey={metricKey} title={title} />}
              cursor={{ stroke: strokeColor, strokeWidth: 1, strokeDasharray: '5 5' }}
              wrapperStyle={{ zIndex: 99999, position: 'relative' }}
            />
            <Line type="monotone" dataKey={dataKey} stroke={strokeColor} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};