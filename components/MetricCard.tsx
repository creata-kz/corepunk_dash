
import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  changeType?: 'positive' | 'negative';
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


export const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changeType = 'positive' }) => {
  const isPositive = change >= 0;
  const changeColor = (changeType === 'positive' ? isPositive : !isPositive) ? 'text-green-400' : 'text-red-400';

  return (
    <div className="bg-brand-surface p-4 rounded-lg border border-brand-border">
      <h3 className="text-brand-text-secondary text-sm font-medium">{title}</h3>
      <div className="flex items-baseline space-x-2 mt-1">
        <p className="text-2xl font-semibold text-brand-text-primary">{value}</p>
        <div className={`flex items-center text-sm font-medium ${changeColor}`}>
            {isPositive ? <ArrowUpIcon/> : <ArrowDownIcon/>}
            <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};
