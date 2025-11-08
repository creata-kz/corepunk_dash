import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea, ReferenceLine } from 'recharts';
import { DailyMetric, ProductionActivity } from '../types';

interface SocialEngagementChartProps {
  metrics: DailyMetric[];
  activities: ProductionActivity[];
  highlightedActivity: ProductionActivity | null;
}

// Функция для форматирования дат
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 rounded-lg shadow-lg text-sm">
        <p className="label font-bold text-brand-text-primary mb-2">{formatDate(label)}</p>
        {payload.map((pld: any) => (
          <div key={pld.dataKey} style={{ color: pld.color }} className="flex justify-between gap-4">
            <span>{pld.name}:</span>
            <span className="font-semibold">{pld.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const SocialEngagementChart: React.FC<SocialEngagementChartProps> = ({ metrics, activities, highlightedActivity }) => {
  // Подготавливаем данные с форматированными датами
  const formattedMetrics = useMemo(() => {
    return metrics.map(m => ({
      ...m,
      formattedDate: formatDate(m.date)
    }));
  }, [metrics]);

  return (
    <div className="glass-card p-6 rounded-xl h-80 relative z-10">
      <h3 className="text-xl font-semibold text-brand-text-primary mb-4">Community Sentiment</h3>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart 
          data={formattedMetrics} 
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorTotalComments" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3BBDD0" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#3BBDD0" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorNegativeComments" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F85149" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#F85149" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(48, 54, 61, 0.6)" />
          <XAxis dataKey="formattedDate" stroke="#8B949E" tick={{ fontSize: 11 }} />
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
                          x1={formatDate(activity.startDate)} 
                          x2={formatDate(activity.endDate)} 
                          stroke={isHighlighted ? "#10B981" : "#484F58"}
                          strokeOpacity={isHighlighted ? 0.8 : 0.5}
                          fill={isHighlighted ? "#10B981" : "#484F58"}
                          fillOpacity={isHighlighted ? 0.3 : 0.1}
                      />
                  )
              }
              return (
                   <ReferenceLine 
                      key={`line-${activity.id}`}
                      yAxisId="left"
                      x={formatDate(activity.date)}
                      stroke={isHighlighted ? "#10B981" : "#484F58"}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeDasharray="4 4"
                  />
              )
          })}

          <Area yAxisId="left" type="monotone" dataKey="totalComments" name="Comments" stroke="#3BBDD0" strokeWidth={2} fillOpacity={1} fill="url(#colorTotalComments)" dot={false} />
          <Area yAxisId="right" type="monotone" dataKey="sentimentPercent" name="Positive (%)" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorSentiment)" dot={false} />
          <Area yAxisId="left" type="monotone" dataKey="negativeComments" name="Negative" stroke="#F85149" strokeWidth={2} fillOpacity={1} fill="url(#colorNegativeComments)" dot={false} />
          
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};