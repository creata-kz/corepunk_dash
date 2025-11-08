import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea, ReferenceLine, Scatter } from 'recharts';
import { DailyMetric, ProductionActivity } from '../types';
import { getPlatformIcon } from '../utils/platformIcons';
import { FaEye, FaHeart, FaHandsHelping } from 'react-icons/fa';
import { HiHashtag } from 'react-icons/hi2';

interface TimelineChartProps {
  metrics: DailyMetric[];
  activities: ProductionActivity[];
  highlightedActivity: ProductionActivity | null;
}

type TimeScale = 'week' | 'month' | 'year';

// Функция для форматирования дат
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
};

// Функция для получения количества дней в масштабе
const getDaysInScale = (scale: TimeScale): number => {
  switch (scale) {
    case 'week': return 7;
    case 'month': return 30;
    case 'year': return 365;
    default: return 30;
  }
};

const CustomTooltip = ({ active, payload, label, activitiesByDate }: any) => {
  if (active && payload && payload.length) {
    const dateStr = label;
    const activitiesForDate = activitiesByDate?.[dateStr] || [];
    
    return (
      <div className="bg-brand-surface border border-brand-border rounded-lg shadow-2xl text-sm max-w-sm p-4" style={{ backgroundColor: 'rgba(22, 27, 34, 0.95)', backdropFilter: 'blur(20px)' }}>
        <p className="label font-bold text-brand-text-primary mb-3 text-base">{formatDate(label)}</p>
        
        {/* Метрики */}
        <div className="mb-3 space-y-1.5">
          {payload.map((pld: any) => (
            <div key={pld.dataKey} style={{ color: pld.color }} className="flex justify-between items-center gap-4 py-0.5">
              <span className="text-xs text-brand-text-secondary">{pld.name}:</span>
              <span className="font-semibold text-brand-text-primary">{pld.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
        
        {/* Активности */}
        {activitiesForDate.length > 0 && (
          <div className="mt-3 pt-3 border-t border-brand-border">
            <p className="text-xs font-semibold text-brand-text-secondary mb-2.5 uppercase tracking-wide">Activities:</p>
            <div className="space-y-2.5">
              {activitiesForDate.map((activity: ProductionActivity) => (
                <div key={activity.id} className="bg-white/10 rounded-lg p-2.5 border border-brand-border/70 hover:border-brand-border transition-colors" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <div className="flex items-start gap-2.5">
                    {/* Статус индикатор */}
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      activity.status === 'Completed' ? 'bg-green-500' :
                      activity.status === 'In Progress' ? 'bg-blue-500' :
                      'bg-yellow-500'
                    }`} />
                    
                    {/* Описание активности */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-brand-text-primary leading-relaxed mb-2">
                        {activity.description}
                      </p>
                      
                      {/* Платформы с увеличенными иконками */}
                      {activity.platforms && activity.platforms.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] text-brand-text-secondary/70 uppercase tracking-wide mr-1">Platforms:</span>
                          {activity.platforms.map(platform => {
                            const icon = getPlatformIcon(platform, 'w-4 h-4');
                            // Отладочный вывод для проверки
                            if (!icon) {
                              console.warn(`TimelineChart Tooltip: No icon found for platform "${platform}"`);
                            }
                            return (
                              <div 
                                key={platform} 
                                className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-brand-border/30 hover:bg-white/10 transition-colors"
                                title={platform}
                              >
                                <span className="flex-shrink-0">
                                  {icon || <span className="text-xs">📱</span>}
                                </span>
                                <span className="text-[11px] font-medium text-brand-text-secondary">{platform}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Кастомная легенда с иконками
const CustomLegend = ({ payload }: any) => {
  const getMetricIcon = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('mention')) {
      return <div className="text-brand-text-secondary flex items-center"><HiHashtag size={14} /></div>;
    }
    if (nameLower.includes('engagement')) {
      return <div className="text-brand-text-secondary flex items-center"><FaHandsHelping size={14} /></div>;
    }
    if (nameLower.includes('like')) {
      return <div className="text-brand-text-secondary flex items-center"><FaHeart size={14} /></div>;
    }
    if (nameLower.includes('reach')) {
      return <div className="text-brand-text-secondary flex items-center"><FaEye size={14} /></div>;
    }
    return null;
  };

  if (!payload || payload.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 justify-center pt-5" style={{ fontSize: "14px" }}>
      {payload.map((entry: any) => {
        const icon = getMetricIcon(entry.value);
        return (
          <div key={entry.value} className="flex items-center gap-2">
            {icon}
            <span style={{ color: entry.color }}>{entry.value}</span>
          </div>
        );
      })}
    </div>
  );
};

const ActivityMarker = (props: any) => {
  const { cx, cy, payload, middleY } = props;
  const activities = payload?.activities || [];
  
  if (!activities || activities.length === 0) {
    return null;
  }
  
  // Используем переданную middleY или cy как fallback
  const yPos = middleY !== undefined ? middleY : cy;
  const hasMultiple = activities.length > 1;
  
  return (
    <g>
      {/* Фон круга - нейтральный серый цвет */}
      <circle
        cx={cx}
        cy={yPos}
        r={hasMultiple ? 10 : 9}
        fill="#6B7280"
        stroke="#fff"
        strokeWidth={2}
        opacity={0.9}
      />
      {/* Иконка активности */}
      {hasMultiple ? (
        <text
          x={cx}
          y={yPos}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize="10"
          fontWeight="bold"
        >
          {activities.length}
        </text>
      ) : (
        <g transform={`translate(${cx}, ${yPos})`}>
          {/* Иконка календаря/события */}
          <svg
            x="-6"
            y="-6"
            width="12"
            height="12"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 7h12v9H4V7z"
              fill="#fff"
            />
          </svg>
        </g>
      )}
    </g>
  );
};

export const TimelineChart: React.FC<TimelineChartProps> = ({ metrics, activities, highlightedActivity }) => {
  const [timeScale, setTimeScale] = useState<TimeScale>('month');
  const [visibleDays, setVisibleDays] = useState<number>(30); // Количество видимых дней
  const [startDateIndex, setStartDateIndex] = useState<number>(0); // Индекс начальной даты
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartDateIndex, setDragStartDateIndex] = useState(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Подготавливаем данные с форматированными датами (все данные, отсортированные)
  const sortedMetrics = useMemo(() => {
    return metrics
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(m => ({
        ...m,
        formattedDate: formatDate(m.date)
      }));
  }, [metrics]);

  // Применяем курсор к SVG элементам
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    const cursorStyle = isDragging ? 'grabbing' : (isHovering ? 'grab' : 'default');
    const svgElements = chartContainerRef.current.querySelectorAll('svg, svg *');
    
    svgElements.forEach((el: Element) => {
      (el as HTMLElement).style.cursor = cursorStyle;
    });
  }, [isDragging, isHovering]);

  // Инициализируем видимый диапазон при изменении масштаба или данных
  useEffect(() => {
    if (sortedMetrics.length > 0) {
      const scaleDays = getDaysInScale(timeScale);
      setVisibleDays(scaleDays);
      const newStartDateIndex = Math.max(0, sortedMetrics.length - scaleDays);
      setStartDateIndex(newStartDateIndex);
    }
  }, [timeScale, sortedMetrics.length]);

  // Создаем карту активностей по датам для быстрого поиска (используем formattedDate)
  const activitiesByDate = useMemo(() => {
    const map: Record<string, ProductionActivity[]> = {};
    activities.forEach(activity => {
      const date = activity.date || activity.startDate || '';
      if (date) {
        const formattedDateKey = formatDate(date);
        if (!map[formattedDateKey]) {
          map[formattedDateKey] = [];
        }
        map[formattedDateKey].push(activity);
      }
    });
    return map;
  }, [activities]);

  // Фильтруем данные для видимого диапазона - график всегда заполняет контейнер
  const visibleMetrics = useMemo(() => {
    if (sortedMetrics.length === 0) return [];
    const endIndex = Math.min(startDateIndex + visibleDays, sortedMetrics.length);
    return sortedMetrics.slice(startDateIndex, endIndex);
  }, [sortedMetrics, startDateIndex, visibleDays]);

  // Вычисляем среднее значение для позиционирования точек посередине
  const middleValue = useMemo(() => {
    if (visibleMetrics.length === 0) return 0;
    const values = visibleMetrics.map(m => m.dailyMentions);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return (min + max) / 2;
  }, [visibleMetrics]);

  // Добавляем информацию об активностях и маркеры к метрикам
  const metricsWithActivities = useMemo(() => {
    const result = visibleMetrics.map(metric => {
      const activitiesForDate = activitiesByDate[metric.formattedDate] || [];
      return {
        ...metric,
        activities: activitiesForDate,
        // Добавляем значение для маркера активности (только если есть активности)
        activityMarkerValue: activitiesForDate.length > 0 ? middleValue : null
      };
    });
    
    // Отладочный вывод
    const withActivities = result.filter(m => m.activities.length > 0);
    if (withActivities.length > 0) {
      console.log('TimelineChart: Metrics with activities:', {
        totalActivities: activities.length,
        activitiesByDateKeys: Object.keys(activitiesByDate),
        visibleMetricsCount: visibleMetrics.length,
        metricsWithActivities: withActivities.length,
        middleValue,
        sample: withActivities.slice(0, 2).map(m => ({
          date: m.date,
          formattedDate: m.formattedDate,
          activitiesCount: m.activities.length,
          activityMarkerValue: m.activityMarkerValue,
          activities: m.activities.map(a => ({ id: a.id, description: a.description }))
        }))
      });
    } else {
      console.log('TimelineChart: No activities found for visible metrics', {
        totalActivities: activities.length,
        activitiesByDateKeys: Object.keys(activitiesByDate),
        visibleMetricsDates: visibleMetrics.map(m => m.formattedDate).slice(0, 5)
      });
    }
    
    return result;
  }, [visibleMetrics, activitiesByDate, middleValue, activities.length]);

  // Фильтруем activities для видимого диапазона
  const visibleActivities = useMemo(() => {
    if (sortedMetrics.length === 0) return [];
    const startIndex = startDateIndex;
    const endIndex = Math.min(startDateIndex + visibleDays, sortedMetrics.length);
    const startDate = sortedMetrics[startIndex]?.date || '';
    const endDate = sortedMetrics[endIndex - 1]?.date || '';
    return activities.filter(activity => {
      const activityDate = activity.date || activity.startDate || '';
      return activityDate >= startDate && activityDate <= endDate;
    });
  }, [activities, sortedMetrics, startDateIndex, visibleDays]);

  // Обработчик начала перетаскивания
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Предотвращаем выделение текста
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartDateIndex(startDateIndex);
  }, [startDateIndex]);

  // Обработчик перемещения мыши
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !chartContainerRef.current || sortedMetrics.length === 0) return;
    
    const deltaX = e.clientX - dragStartX;
    const containerWidth = chartContainerRef.current.clientWidth;
    const pixelsPerDay = containerWidth / visibleDays;
    const daysDelta = Math.round(-deltaX / pixelsPerDay);
    
    const newStartDateIndex = Math.max(0, Math.min(
      sortedMetrics.length - visibleDays,
      dragStartDateIndex + daysDelta
    ));
    
    setStartDateIndex(newStartDateIndex);
  }, [isDragging, dragStartX, dragStartDateIndex, visibleDays, sortedMetrics.length]);

  // Обработчик окончания перетаскивания
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Обработчик наведения мыши на график
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  // Обработчик ухода мыши с графика
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setIsDragging(false); // Также сбрасываем перетаскивание при уходе мыши
  }, []);

  // Обработчик изменения масштаба через кнопки
  const handleScaleChange = useCallback((scale: TimeScale) => {
    setTimeScale(scale);
    const newScaleDays = getDaysInScale(scale);
    setVisibleDays(newScaleDays);
    const newStartDateIndex = Math.max(0, sortedMetrics.length - newScaleDays);
    setStartDateIndex(newStartDateIndex);
  }, [sortedMetrics.length]);

  return (
    <div className="glass-card p-6 rounded-xl h-full relative z-10 flex flex-col">
      <div className="shrink-0 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold text-brand-text-primary">Social Metrics</h3>
          
          {/* Time Scale Selector */}
          <div className="flex items-center gap-2">
            <div className="bg-brand-surface p-1 rounded-lg border border-brand-border flex items-center space-x-1">
              {(['week', 'month', 'year'] as TimeScale[]).map(scale => (
                <button
                  key={scale}
                  onClick={() => handleScaleChange(scale)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    timeScale === scale
                      ? 'bg-brand-primary text-white'
                      : 'text-brand-text-secondary hover:bg-brand-surface-2'
                  }`}
                >
                  {scale.charAt(0).toUpperCase() + scale.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div 
        ref={chartContainerRef}
        className="flex-1 min-h-0 relative select-none chart-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ 
          cursor: isDragging ? 'grabbing' : (isHovering ? 'grab' : 'default'), 
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={metricsWithActivities} 
            margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
          >
          <defs>
            <linearGradient id="colorMentions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#388BFD" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#388BFD" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1F883D" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#1F883D" stopOpacity={0}/>
            </linearGradient>
             <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DB61A2" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#DB61A2" stopOpacity={0}/>
            </linearGradient>
             <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9333EA" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#9333EA" stopOpacity={0}/>
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(48, 54, 61, 0.6)" />
          <XAxis dataKey="formattedDate" stroke="#8B949E" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left" stroke="#8B949E" tick={{ fontSize: 12, dx:-5 }} />
          <YAxis yAxisId="right" orientation="right" stroke="#8B949E" tick={{ fontSize: 12, dx: 5 }} />
          <Tooltip content={<CustomTooltip activitiesByDate={activitiesByDate} />} cursor={{ stroke: '#F0883E', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Legend content={<CustomLegend />} />
          
          {visibleActivities.map(activity => {
              const isHighlighted = activity.id === highlightedActivity?.id;
              const activitiesForDate = activitiesByDate[formatDate(activity.date)] || [];
              
              if (activity.startDate && activity.endDate) {
                  return (
                      <ReferenceArea 
                          key={`area-${activity.id}`} 
                          yAxisId="left"
                          x1={formatDate(activity.startDate)} 
                          x2={formatDate(activity.endDate)} 
                          stroke={isHighlighted ? "#F0883E" : "#484F58"}
                          strokeOpacity={isHighlighted ? 0.8 : 0.5}
                          fill={isHighlighted ? "#F0883E" : "#484F58"}
                          fillOpacity={isHighlighted ? 0.3 : 0.1}
                          label={isHighlighted ? <ActivityLabel value={activity.description} /> : undefined}
                      />
                  )
              }
              return (
                  <ReferenceLine 
                      key={`line-${activity.id}`}
                      yAxisId="left"
                      x={formatDate(activity.date)}
                      stroke={isHighlighted ? "#F0883E" : "#484F58"}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeDasharray="4 4"
                      label={isHighlighted ? { value: activity.description, position: 'insideTop', fill: '#E6EDF3', fontSize: 10 } : undefined}
                  />
              )
          })}
          
          <Area 
            yAxisId="left" 
            type="monotone" 
            dataKey="dailyMentions" 
            name="Mentions" 
            stroke="#388BFD" 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#colorMentions)" 
            dot={(props: any) => {
              const activities = props.payload?.activities || [];
              if (!activities || activities.length === 0) return false;
              
              const { key, ...restProps } = props;
              const dotKey = key ?? `activity-${restProps.payload?.date ?? restProps.cx ?? restProps.index ?? Math.random()}`;
              return <ActivityMarker key={dotKey} {...restProps} middleY={restProps.cy} />;
            }}
          />
          
          <Area yAxisId="right" type="monotone" dataKey="engagementScore" name="Engagement" stroke="#1F883D" strokeWidth={2} fillOpacity={1} fill="url(#colorEngagement)" dot={false} />
          <Area yAxisId="right" type="monotone" dataKey="likes" name="Likes" stroke="#DB61A2" strokeWidth={2} fillOpacity={1} fill="url(#colorLikes)" dot={false} />
          <Area yAxisId="right" type="monotone" dataKey="reach" name="Reach" stroke="#9333EA" strokeWidth={2} fillOpacity={1} fill="url(#colorReach)" dot={false} />

        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
};