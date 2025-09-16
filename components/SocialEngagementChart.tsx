import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea, ReferenceLine } from 'recharts';
import { DailyMetric, ProductionActivity } from '../types';

interface SocialEngagementChartProps {
  metrics: DailyMetric[];
  activities: ProductionActivity[];
  highlightedActivity: ProductionActivity | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 rounded-lg shadow-lg text-sm">
        <p className="label font-bold text-brand-text-primary">{`${label}`}</p>
        {payload.map((pld: any) => (
          <div key={pld.dataKey} style={{ color: pld.color }}>
            {`${pld.name}: ${pld.value.toLocaleString()}`}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const SocialEngagementChart: React.FC<SocialEngagementChartProps> = ({ metrics, activities, highlightedActivity }) => {
  
  return (
    <div className="glass-card p-6 rounded-xl h-80">
      <h3 className="text-3xl font-semibold text-brand-text-primary mb-4">Social Engagement Overview</h3>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart 
          data={metrics} 
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A371F7" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#A371F7" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F0883E" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#F0883E" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(48, 54, 61, 0.6)" />
          <XAxis dataKey="date" stroke="#8B949E" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" stroke="#8B949E" tick={{ fontSize: 12, dx:-5 }} />
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
                          stroke={isHighlighted ? "#A371F7" : "#484F58"}
                          strokeOpacity={isHighlighted ? 0.8 : 0.5}
                          fill={isHighlighted ? "#A371F7" : "#484F58"}
                          fillOpacity={isHighlighted ? 0.3 : 0.1}
                      />
                  )
              }
              return (
                   <ReferenceLine 
                      key={`line-${activity.id}`}
                      yAxisId="left"
                      x={activity.date}
                      stroke={isHighlighted ? "#A371F7" : "#484F58"}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeDasharray="4 4"
                  />
              )
          })}

          <Area yAxisId="left" type="monotone" dataKey="shares" name="Shares" stroke="#A371F7" strokeWidth={2} fillOpacity={1} fill="url(#colorShares)" dot={false} />
          <Area yAxisId="left" type="monotone" dataKey="reach" name="Reach" stroke="#F0883E" strokeWidth={2} fillOpacity={1} fill="url(#colorReach)" dot={false} />
          
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};