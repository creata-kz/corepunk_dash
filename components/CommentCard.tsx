import React from 'react';
import { Comment } from '../types';

const SourceIcon: React.FC<{ source: string }> = ({ source }) => {
    const iconMap: Record<string, string> = {
        'YouTube': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path></svg>`,
        'Twitter': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616v.064c0 2.296 1.634 4.208 3.803 4.649-.6.164-1.249.2-1.916.084.608 1.923 2.363 3.243 4.444 3.28-1.72 1.34-3.873 2.066-6.21 2.066-.407 0-.808-.024-1.207-.07 2.22 1.424 4.857 2.25 7.699 2.25 9.23 0 14.288-7.66 13.996-14.619.977-.704 1.825-1.58 2.5-2.59z"></path></svg>`,
        'Reddit': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 12.11c0 .5-.4 1-.9 1-.2 0-.4-.1-.5-.2-.1 0-.2-.1-.2-.2 0-.2.1-.4.2-.5 0 0 0-.1.1-.1.1 0 .3-.1.4-.1.5 0 1 .4 1 .9zm-1.8 2.8c.6 0 1 .4 1 1 0 .5-.4 1-1 1s-1-.4-1-1 .4-1 1-1zm-1-6.1c-.5-.5-1.2-.8-2-.8s-1.5.3-2 .8c-.5.5-.8 1.2-.8 2 0 .8.3 1.5.8 2s1.2.8 2 .8 1.5-.3 2-.8.8-1.2.8-2c0-.8-.3-1.5-.8-2zm-6.8-1.2c0-.5.4-1 .9-1 .2 0 .4.1.5.2.1 0 .2.1.2.2 0 .2-.1.4-.2.5 0 0 0 .1-.1.1-.1 0-.3.1-.4.1-.5 0-.9-.4-.9-.9zm1.8-2.8c-.6 0-1-.4-1-1 0-.5.4-1 1-1s1 .4 1 1-.4 1-1 1zm8.3 10.1c-1.1 1.1-2.7 1.8-4.4 1.8s-3.3-.6-4.4-1.8c-.2-.2-.5-.2-.7 0s-.2.5 0 .7c1.3 1.3 3.1 2.1 5.1 2.1s3.8-.8 5.1-2.1c.2-.2.2-.5 0-.7s-.5-.2-.7 0z"></path></svg>`,
    };
    return <div className="shrink-0" dangerouslySetInnerHTML={{ __html: iconMap[source] || '' }} />;
};

export const CommentCard: React.FC<{ comment: Comment, withBorder?: boolean }> = ({ comment, withBorder = true }) => {
    const sentimentColor = {
        Positive: 'border-green-500/50',
        Negative: 'border-red-500/50',
        Neutral: 'border-gray-500/50',
    }[comment.sentiment];
    
    return (
        <div className={`bg-white/5 p-3 rounded-lg ${withBorder ? `border-l-4 ${sentimentColor}` : ''}`}>
           <div className="flex items-start justify-between">
              <blockquote className="text-sm text-brand-text-primary pr-4 italic">"{comment.text}"</blockquote>
           </div>
            <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                    <SourceIcon source={comment.source} />
                    <p className="text-xs text-brand-text-secondary">{comment.author}</p>
                </div>
                 <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${comment.userType === 'Player' ? 'bg-blue-900/80 text-blue-300' : 'bg-purple-900/80 text-purple-300'}`}>{comment.userType}</span>
            </div>
        </div>
    )
}