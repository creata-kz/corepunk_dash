import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LineChart, Line, ResponsiveContainer, Tooltip, TooltipProps } from 'recharts';
import { DailyMetric } from '../types';
import { getPlatformIcon } from '../utils/platformIcons';
import { FaChartBar, FaComment, FaHeart, FaEye } from 'react-icons/fa';

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
      <div className="bg-brand-surface border border-brand-border rounded-lg p-2 text-xs relative shadow-xl" style={{ zIndex: 999999, position: 'fixed' }}>
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
      <div className="bg-brand-surface border border-brand-border rounded-lg p-2 text-xs relative shadow-xl" style={{ zIndex: 999999, position: 'fixed' }}>
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
    <div className="bg-brand-surface border border-brand-border rounded-lg p-3 text-xs shadow-xl relative" style={{ zIndex: 999999, position: 'fixed' }}>
      <p className="text-brand-text-secondary mb-2 font-medium">{metric.date}</p>
      <p className="text-brand-text-primary font-bold mb-2">{title}: {payload[0].value?.toLocaleString()}</p>
      {sortedPlatforms.length > 0 && (
        <div className="border-t border-brand-border pt-2 mt-1">
          <p className="text-brand-text-secondary text-[10px] mb-1 uppercase tracking-wide">By platform:</p>
          {sortedPlatforms.map(({ platform, value }) => {
            const platformIcon = getPlatformIcon(platform as any, 'w-3 h-3');
            return (
              <div key={platform} className="flex justify-between items-center py-0.5">
                <span className="text-brand-text-secondary flex items-center gap-1">
                  {platformIcon}
                  {platform}:
                </span>
                <span className="text-brand-text-primary font-semibold ml-2">{value.toLocaleString()}</span>
              </div>
            );
          })}
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
  const [showPlatformTooltip, setShowPlatformTooltip] = useState(false);
  const platformButtonRef = useRef<HTMLButtonElement>(null);
  const infoButtonRef = useRef<HTMLButtonElement>(null);
  const [platformTooltipPosition, setPlatformTooltipPosition] = useState({ top: 0, left: 0 });
  const [infoTooltipPosition, setInfoTooltipPosition] = useState({ top: 0, right: 0 });
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
            const platformData = data as DailyMetric['byPlatform'][string];
            // Вычисляем engagement score для платформы: likes * 1.5 + comments * 2 + reach * 0.1
            const engagement = Math.round(
              (platformData.likes || 0) * 1.5 +
              (platformData.comments || 0) * 2 +
              (platformData.reach || 0) * 0.1
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

    // Сортируем по вкладу и показываем все платформы с данными
    const sorted = Object.entries(platformTotals)
      .map(([platform, value]) => {
        // Используем более точное округление для процентов
        const rawPercentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
        // Если процент меньше 1, показываем с одним знаком после запятой, иначе округляем до целого
        const percentage = rawPercentage < 1 ? Math.round(rawPercentage * 10) / 10 : Math.round(rawPercentage);
        
        return {
          platform,
          value,
          percentage
        };
      })
      .filter(p => p.value > 0) // Фильтруем по значению, а не по проценту (чтобы не потерять платформы с маленьким процентом)
      .sort((a, b) => b.value - a.value);

    // Отладочный вывод для проверки
    if (process.env.NODE_ENV === 'development') {
      console.log('Platform Breakdown Debug:', {
        metricKey,
        platformTotals,
        totalValue,
        sorted: sorted.map(p => ({ platform: p.platform, value: p.value, percentage: p.percentage }))
      });
    }

    return sorted.length > 0 ? sorted : null;
  }, [fullMetrics, metricKey]);

  // Иконки и цвета для платформ
  const platformStyles: Record<string, { icon: React.ReactNode; color: string }> = {
    'Reddit': { icon: getPlatformIcon('Reddit', 'w-2.5 h-2.5'), color: 'text-orange-400' },
    'Youtube': { icon: getPlatformIcon('Youtube', 'w-2.5 h-2.5'), color: 'text-red-400' },
    'Tiktok': { icon: getPlatformIcon('Tiktok', 'w-2.5 h-2.5'), color: 'text-pink-400' },
    'Vk': { icon: getPlatformIcon('Vk', 'w-2.5 h-2.5'), color: 'text-blue-400' },
    'Discord': { icon: getPlatformIcon('Discord', 'w-2.5 h-2.5'), color: 'text-indigo-400' },
    'X': { icon: getPlatformIcon('X', 'w-2.5 h-2.5'), color: 'text-gray-300' },
    'Twitter': { icon: getPlatformIcon('X', 'w-2.5 h-2.5'), color: 'text-gray-300' }, // Поддержка старого названия
    'Instagram': { icon: getPlatformIcon('Instagram', 'w-2.5 h-2.5'), color: 'text-purple-400' },
  };

  return (
    <div
      className={`glass-card p-4 rounded-xl flex flex-col h-40 relative overflow-visible ${onClick ? 'cursor-pointer hover:border-brand-primary transition-all' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="text-brand-text-secondary text-xs font-medium mb-1.5">
            {title}
          </h3>
          
          {/* Value and Change - теперь в колонку */}
          <div className="flex flex-col gap-0.5 mb-1.5">
            <p className="text-2xl font-semibold text-brand-text-primary">{value}</p>
            <div className={`flex items-center text-xs font-medium ${changeColor} whitespace-nowrap`}>
                {isPositive ? <ArrowUpIcon/> : <ArrowDownIcon/>}
                <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          </div>

          {/* Platform breakdown - показывается при наведении */}
          {platformBreakdown && (
            <div className="relative">
              <button
                ref={platformButtonRef}
                onMouseEnter={() => {
                  if (platformButtonRef.current) {
                    const rect = platformButtonRef.current.getBoundingClientRect();
                    setPlatformTooltipPosition({ top: rect.bottom + 4, left: rect.left });
                    setShowPlatformTooltip(true);
                  }
                }}
                onMouseLeave={() => setShowPlatformTooltip(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (platformButtonRef.current) {
                    const rect = platformButtonRef.current.getBoundingClientRect();
                    setPlatformTooltipPosition({ top: rect.bottom + 4, left: rect.left });
                    setShowPlatformTooltip(!showPlatformTooltip);
                  }
                }}
                className="text-[9px] text-brand-text-secondary hover:text-brand-text-primary transition-colors flex items-center gap-1 px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded"
              >
                <FaChartBar size={8} />
                <span>By Platform</span>
              </button>
              
              {/* Popup с процентами платформ через Portal */}
              {showPlatformTooltip && typeof window !== 'undefined' && createPortal(
                <div 
                  className="fixed bg-brand-surface border border-brand-border rounded-lg p-2 shadow-xl text-xs min-w-[140px]"
                  style={{ 
                    zIndex: 999999,
                    top: `${platformTooltipPosition.top}px`,
                    left: `${platformTooltipPosition.left}px`
                  }}
                  onMouseEnter={() => setShowPlatformTooltip(true)}
                  onMouseLeave={() => setShowPlatformTooltip(false)}
                >
                  <p className="text-brand-text-secondary text-[10px] mb-1.5 uppercase tracking-wide">Platform Breakdown:</p>
                  <div className="flex flex-col gap-1">
                    {platformBreakdown.map(({ platform, percentage }) => {
                      const style = platformStyles[platform] || { icon: getPlatformIcon(platform as any, 'w-3 h-3') || <FaChartBar size={12} />, color: 'text-gray-400' };
                      // Форматируем процент: если меньше 1, показываем с одним знаком после запятой
                      const formattedPercentage = percentage < 1 ? percentage.toFixed(1) : percentage.toString();
                      return (
                        <div key={platform} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 text-brand-text-secondary">
                            {style.icon}
                            <span className="text-[10px]">{platform}</span>
                          </span>
                          <span className={`text-xs font-semibold ${style.color}`}>{formattedPercentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>,
                document.body
              )}
            </div>
          )}
        </div>

        {/* Info Button */}
        {description && (
          <div className="relative flex-shrink-0">
            <button
              ref={infoButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                if (infoButtonRef.current) {
                  const rect = infoButtonRef.current.getBoundingClientRect();
                  setInfoTooltipPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                  setShowTooltip(!showTooltip);
                }
              }}
              onMouseEnter={() => {
                if (infoButtonRef.current) {
                  const rect = infoButtonRef.current.getBoundingClientRect();
                  setInfoTooltipPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                  setShowTooltip(true);
                }
              }}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-brand-text-secondary hover:text-brand-primary transition-colors p-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Tooltip через Portal */}
            {showTooltip && typeof window !== 'undefined' && createPortal(
              <div 
                className="fixed w-64 bg-brand-surface border border-brand-border rounded-lg p-3 shadow-xl text-xs text-brand-text-secondary"
                style={{ 
                  zIndex: 999999,
                  top: `${infoTooltipPosition.top}px`,
                  right: `${infoTooltipPosition.right}px`
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                {description}
              </div>,
              document.body
            )}
          </div>
        )}
      </div>

      <div className="flex-1 w-full min-h-0 relative overflow-visible">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={last7DaysData}>
            <Tooltip
              content={<CustomTooltip fullMetrics={last7DaysMetrics} metricKey={metricKey} title={title} />}
              cursor={{ stroke: strokeColor, strokeWidth: 1, strokeDasharray: '5 5' }}
              wrapperStyle={{ zIndex: 999999, pointerEvents: 'none', position: 'fixed' }}
            />
            <Line type="monotone" dataKey={dataKey} stroke={strokeColor} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};