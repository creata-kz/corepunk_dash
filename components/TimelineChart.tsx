import React from 'react';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea, ReferenceLine } from 'recharts';
import { DailyMetric, ProductionActivity } from '../types';

interface TimelineChartProps {
  metrics: DailyMetric[];
  activities: ProductionActivity[];
  highlightedActivity: ProductionActivity | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Получаем данные по платформам из первого payload (все имеют одинаковый объект метрики)
    const metricData = payload[0]?.payload;
    const byPlatform = metricData?.byPlatform || {};

    return (
      <div className="glass-card p-3 rounded-lg shadow-lg text-sm max-w-xs">
        <p className="label font-bold text-brand-text-primary mb-2 pb-2 border-b border-brand-border">{`${label}`}</p>

        {payload.map((pld: any) => {
          const metricKey = pld.dataKey;

          return (
            <div key={pld.dataKey} className="mb-2">
              <div style={{ color: pld.color }} className="font-semibold mb-1">
                {`${pld.name}: ${pld.value.toLocaleString()}`}
              </div>

              {Object.keys(byPlatform).length > 0 && (
                <div className="ml-3 text-xs text-brand-text-secondary space-y-0.5">
                  {Object.entries(byPlatform).map(([platform, data]: [string, any]) => {
                    let value = 0;

                    // Вычисляем значение в зависимости от метрики
                    switch (metricKey) {
                      case 'likes':
                        value = data.likes || 0;
                        break;
                      case 'reach':
                        value = data.reach || 0;
                        break;
                      case 'negativeComments':
                        value = data.negativeComments || 0;
                        break;
                      case 'positiveComments':
                        // Позитивные = всего комментариев - негативные
                        value = Math.max(0, (data.comments || 0) - (data.negativeComments || 0));
                        break;
                      default:
                        return null;
                    }

                    if (value > 0) {
                      return (
                        <div key={platform}>
                          {platform}: {value.toLocaleString()}
                        </div>
                      );
                    }
                    return null;
                  }).filter(Boolean)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const ActivityLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <g>
        <text x={x + width / 2} y={y - 10} fill="#E6EDF3" textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight="bold">
          {value}
        </text>
      </g>
    );
};

export const TimelineChart: React.FC<TimelineChartProps> = ({ metrics, activities, highlightedActivity }) => {
  return (
    <div className="glass-card p-6 rounded-xl h-96 relative z-10">
      <h3 className="text-3xl font-semibold text-brand-text-primary mb-4">Performance Overview</h3>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart 
          data={metrics} 
          margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DB61A2" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#DB61A2" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F85149" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#F85149" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9333EA" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#9333EA" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(48, 54, 61, 0.6)" />
          <XAxis dataKey="date" stroke="#8B949E" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" stroke="#8B949E" tick={{ fontSize: 12, dx:-5 }} />
          <YAxis yAxisId="right" orientation="right" stroke="#8B949E" tick={{ fontSize: 12, dx: 5 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#F0883E', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Legend wrapperStyle={{fontSize: "14px", paddingTop: "20px"}}/>
          
          {activities.map(activity => {
              const isHighlighted = activity.id === highlightedActivity?.id;
              if (activity.startDate && activity.endDate) {
                  return (
                      <ReferenceArea 
                          key={`area-${activity.id}`} 
                          yAxisId="left"
                          x1={activity.startDate} 
                          x2={activity.endDate} 
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
                      x={activity.date}
                      stroke={isHighlighted ? "#F0883E" : "#484F58"}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeDasharray="4 4"
                      label={isHighlighted ? { value: activity.description, position: 'insideTop', fill: '#E6EDF3', fontSize: 10 } : undefined}
                  />
              )
          })}
          
          <Area yAxisId="left" type="monotone" dataKey="likes" name="Likes" stroke="#DB61A2" strokeWidth={2} fillOpacity={1} fill="url(#colorLikes)" dot={false} />
          <Area yAxisId="left" type="monotone" dataKey="positiveComments" name="Positive Comments" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorPositive)" dot={false} />
          <Area yAxisId="right" type="monotone" dataKey="reach" name="Reach" stroke="#9333EA" strokeWidth={2} fillOpacity={1} fill="url(#colorReach)" dot={false} />
          <Area yAxisId="right" type="monotone" dataKey="negativeComments" name="Negative Comments" stroke="#F85149" strokeWidth={2} fillOpacity={1} fill="url(#colorNegative)" dot={false} />

        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};