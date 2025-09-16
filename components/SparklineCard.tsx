import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineCardProps {
  title: string;
  value: string;
  change: number;
  changeType?: 'positive' | 'negative';
  data: any[];
  dataKey: string;
  strokeColor: string;
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

export const SparklineCard: React.FC<SparklineCardProps> = ({ title, value, change, changeType = 'positive', data, dataKey, strokeColor }) => {
  const isPositive = change >= 0;
  const changeColor = (changeType === 'positive' ? isPositive : !isPositive) ? 'text-green-400' : 'text-red-400';
  const last7DaysData = data.slice(-7);

  return (
    <div className="glass-card p-4 rounded-xl flex flex-col justify-between h-32">
      <div>
        <h3 className="text-brand-text-secondary text-lg font-medium">{title}</h3>
        <div className="flex items-baseline space-x-2 mt-1">
          <p className="text-2xl font-semibold text-brand-text-primary">{value}</p>
          <div className={`flex items-center text-sm font-medium ${changeColor}`}>
              {isPositive ? <ArrowUpIcon/> : <ArrowDownIcon/>}
              <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        </div>
      </div>
      <div className="h-1/3 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={last7DaysData}>
            <Line type="monotone" dataKey={dataKey} stroke={strokeColor} strokeWidth={2} dot={false} />
{/* FIX: Corrected typo in the closing tag for LineChart. */}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};