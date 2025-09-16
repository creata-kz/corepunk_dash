
import React from 'react';

interface AiInsightCardProps {
  insight: string;
  isLoading: boolean;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="w-4 h-4 rounded-full animate-pulse bg-brand-primary"></div>
    <div className="w-4 h-4 rounded-full animate-pulse bg-brand-primary delay-200"></div>
    <div className="w-4 h-4 rounded-full animate-pulse bg-brand-primary delay-400"></div>
    <span className="text-brand-text-secondary">AI is analyzing...</span>
  </div>
);

// A simple markdown-to-html renderer
const renderMarkdown = (text: string) => {
  return text
    .split('\n')
    .map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="font-bold text-brand-text-primary mt-2">{line.slice(2, -2)}</p>;
      }
      if (line.startsWith('* ')) {
        return <li key={index} className="ml-4 list-disc">{line.slice(2)}</li>;
      }
      return <p key={index} className="mb-2">{line}</p>;
    });
};

export const AiInsightCard: React.FC<AiInsightCardProps> = ({ insight, isLoading }) => {
  return (
    <div className="bg-brand-surface p-4 rounded-lg border border-brand-border h-full">
      <h3 className="text-lg font-semibold text-brand-text-primary mb-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-brand-primary" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        Context AI Insight
      </h3>
      <div className="text-brand-text-secondary text-sm prose prose-invert">
        {isLoading ? <LoadingSpinner /> : (
          insight ? <div>{renderMarkdown(insight)}</div> : <p>Add a new production activity to trigger an AI analysis.</p>
        )}
      </div>
    </div>
  );
};
