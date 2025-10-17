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
            <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#388BFD" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#388BFD" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1F883D" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#1F883D" stopOpacity={0}/>
            </linearGradient>
             <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DB61A2" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#DB61A2" stopOpacity={0}/>
            </linearGradient>
             <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F85149" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#F85149" stopOpacity={0}/>
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
          
          <Area yAxisId="left" type="monotone" dataKey="dau" name="DAU" stroke="#388BFD" strokeWidth={2} fillOpacity={1} fill="url(#colorDau)" dot={false} />
          <Area yAxisId="right" type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#1F883D" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" dot={false} />
          <Area yAxisId="right" type="monotone" dataKey="likes" name="Likes" stroke="#DB61A2" strokeWidth={2} fillOpacity={1} fill="url(#colorLikes)" dot={false} />
          <Area yAxisId="right" type="monotone" dataKey="negativeComments" name="Negative Comments" stroke="#F85149" strokeWidth={2} fillOpacity={1} fill="url(#colorNegative)" dot={false} />

        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};