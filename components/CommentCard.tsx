import React from 'react';
import { Comment } from '../types';
import { getPlatformIcon, getPlatformColor } from '../utils/platformIcons';
import { FaHeart, FaComment } from 'react-icons/fa';

export const CommentCard: React.FC<{ comment: Comment, withBorder?: boolean }> = ({ comment, withBorder = true }) => {
    const sentimentStyles = {
        Positive: {
            border: 'border-green-500/30',
            bg: 'bg-green-500/5',
            icon: '✅',
            textColor: 'text-green-400'
        },
        Negative: {
            border: 'border-red-500/30',
            bg: 'bg-red-500/5',
            icon: '⚠️',
            textColor: 'text-red-400'
        },
        Neutral: {
            border: 'border-gray-500/30',
            bg: 'bg-gray-500/5',
            icon: '💭',
            textColor: 'text-gray-400'
        },
    }[comment.sentiment];

    return (
        <div className={`glass-card p-4 rounded-lg border ${sentimentStyles.border} ${sentimentStyles.bg} hover:border-opacity-50 transition-all`}>
            <div className="flex items-start gap-3">
                {/* Sentiment Icon */}
                <div className="flex-shrink-0 text-lg">{sentimentStyles.icon}</div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-brand-text-primary leading-relaxed mb-3">{comment.text}</p>
                    
                    {/* Metadata */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-medium text-brand-text-secondary">{comment.author}</span>
                            
                            <span className={`text-xs font-medium px-2 py-1 rounded-md border flex items-center gap-1.5 ${getPlatformColor(comment.source)}`}>
                                {getPlatformIcon(comment.source, 'w-3 h-3')}
                                <span>{comment.source}</span>
                            </span>
                            
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                comment.userType === 'Player' 
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}>
                                {comment.userType}
                            </span>
                        </div>
                        
                        {/* Engagement metrics */}
                        <div className="flex items-center gap-3">
                            {comment.metadata?.likes !== undefined && (
                                <div className="flex items-center gap-1.5 text-xs text-brand-text-secondary">
                                    <FaHeart className="text-pink-400" size={12} />
                                    <span>{comment.metadata.likes}</span>
                                </div>
                            )}
                            {comment.metadata?.score !== undefined && (
                                <div className="flex items-center gap-1.5 text-xs text-brand-text-secondary">
                                    <FaComment className="text-blue-400" size={12} />
                                    <span>{comment.metadata.score}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}