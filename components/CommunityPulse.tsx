

import React, { useMemo, useState, useEffect } from 'react';
import { Comment } from '../types';
import { CommentCard } from './CommentCard';

interface CommunityPulseProps {
    comments: Comment[];
    onOpenModal: () => void;
}

export const CommunityPulse: React.FC<CommunityPulseProps> = ({ comments, onOpenModal }) => {
    const [displayScore, setDisplayScore] = useState(0);

    const { sentimentScore, overall } = useMemo(() => {
        const counts = { Positive: 0, Negative: 0, Neutral: 0 };
        comments.forEach(c => {
            counts[c.sentiment]++;
        });
        const total = counts.Positive + counts.Negative;
        if (total === 0) return { sentimentScore: 50, overall: 'Neutral' };

        const score = Math.round((counts.Positive / total) * 100);
        
        let overallStatus: 'Positive' | 'Negative' | 'Neutral' = 'Neutral';
        if (score > 60) {
            overallStatus = 'Positive';
        } else if (score < 40) {
            overallStatus = 'Negative';
        }

        return { sentimentScore: score, overall: overallStatus };
    }, [comments]);

    useEffect(() => {
        // Animate the score on mount and when it changes
        const timer = setTimeout(() => {
            setDisplayScore(sentimentScore);
        }, 100); // Small delay to allow initial render
        return () => clearTimeout(timer);
    }, [sentimentScore]);

    const keyComments = useMemo(() => {
        // Сортируем по важности (score + likes + views)
        const sortedByImportance = [...comments].sort((a, b) => {
            const aScore = (a.metadata?.score || 0) + (a.metadata?.likes || 0) + ((a.metadata?.views || 0) / 100);
            const bScore = (b.metadata?.score || 0) + (b.metadata?.likes || 0) + ((b.metadata?.views || 0) / 100);
            return bScore - aScore;
        });

        // Берем самый важный позитивный и негативный комментарий
        const positive = sortedByImportance.find(c => c.sentiment === 'Positive');
        const negative = sortedByImportance.find(c => c.sentiment === 'Negative');
        return { positive, negative };
    }, [comments]);
    
    const overallSentimentStyles = {
        Positive: 'text-teal-400',
        Negative: 'text-red-400',
        Neutral: 'text-gray-400',
    }

    return (
        <div className="glass-card p-4 rounded-xl h-full flex flex-col justify-between">
            <div>
                <h3 className="text-3xl font-semibold text-brand-text-primary mb-2">Community Pulse</h3>
                
                 <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-baseline">
                        <p className="text-sm text-brand-text-secondary">Overall Sentiment</p>
                        <p className={`text-lg font-bold ${overallSentimentStyles[overall]}`}>{overall}</p>
                    </div>
                    <div className="relative w-full pt-2">
                        <div className="h-2 w-full rounded-full bg-gradient-to-r from-red-500 via-brand-primary to-teal-400" />
                        <div 
                            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-2 border-brand-bg shadow-lg"
                            style={{ 
                                left: `calc(${displayScore}% - 10px)`,
                                transition: 'left 1s cubic-bezier(0.25, 1, 0.5, 1)',
                            }}
                        >
                           <div className="w-full h-full rounded-full border-2 border-brand-bg"/>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-brand-text-secondary mb-2">Key Comments</h4>
                    <div className="space-y-2">
                        {keyComments.positive && <CommentCard comment={keyComments.positive} withBorder={false} />}
                        {keyComments.negative && <CommentCard comment={keyComments.negative} withBorder={false} />}
                        {!keyComments.positive && !keyComments.negative && <p className="text-sm text-brand-text-secondary text-center py-4">No comments available.</p>}
                    </div>
                </div>
            </div>

            <button
                onClick={onOpenModal}
                className="w-full mt-3 bg-white/5 hover:bg-white/10 text-brand-text-primary font-bold py-2 px-4 rounded-md transition-colors duration-200"
            >
                View All Comments
            </button>
        </div>
    );
};