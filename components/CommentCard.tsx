import React from 'react';
import { Comment } from '../types';

const SourceIcon: React.FC<{ source: string }> = ({ source }) => {
    const iconMap: Record<string, string> = {
        'YouTube': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path></svg>`,
        'Twitter': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616v.064c0 2.296 1.634 4.208 3.803 4.649-.6.164-1.249.2-1.916.084.608 1.923 2.363 3.243 4.444 3.28-1.72 1.34-3.873 2.066-6.21 2.066-.407 0-.808-.024-1.207-.07 2.22 1.424 4.857 2.25 7.699 2.25 9.23 0 14.288-7.66 13.996-14.619.977-.704 1.825-1.58 2.5-2.59z"></path></svg>`,
        'Reddit': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 12.11c0 .5-.4 1-.9 1-.2 0-.4-.1-.5-.2-.1 0-.2-.1-.2-.2 0-.2.1-.4.2-.5 0 0 0-.1.1-.1.1 0 .3-.1.4-.1.5 0 1 .4 1 .9zm-1.8 2.8c.6 0 1 .4 1 1 0 .5-.4 1-1 1s-1-.4-1-1 .4-1 1-1zm-1-6.1c-.5-.5-1.2-.8-2-.8s-1.5.3-2 .8c-.5.5-.8 1.2-.8 2 0 .8.3 1.5.8 2s1.2.8 2 .8 1.5-.3 2-.8.8-1.2.8-2c0-.8-.3-1.5-.8-2zm-6.8-1.2c0-.5.4-1 .9-1 .2 0 .4.1.5.2.1 0 .2.1.2.2 0 .2-.1.4-.2.5 0 0 0 .1-.1.1-.1 0-.3.1-.4.1-.5 0-.9-.4-.9-.9zm1.8-2.8c-.6 0-1-.4-1-1 0-.5.4-1 1-1s1 .4 1 1-.4 1-1 1zm8.3 10.1c-1.1 1.1-2.7 1.8-4.4 1.8s-3.3-.6-4.4-1.8c-.2-.2-.5-.2-.7 0s-.2.5 0 .7c1.3 1.3 3.1 2.1 5.1 2.1s3.8-.8 5.1-2.1c.2-.2.2-.5 0-.7s-.5-.2-.7 0z"></path></svg>`,
        'Vk': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.441 0 .61.203.78.678.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.711 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"></path></svg>`,
        'Tiktok': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"></path></svg>`,
    };
    return <div className="shrink-0" dangerouslySetInnerHTML={{ __html: iconMap[source] || '' }} />;
};

export const CommentCard: React.FC<{ comment: Comment, withBorder?: boolean }> = ({ comment, withBorder = true }) => {
    const sentimentColor = {
        Positive: 'border-green-500/50',
        Negative: 'border-red-500/50',
        Neutral: 'border-gray-500/50',
    }[comment.sentiment];

    // Platform badge colors
    const platformColor = {
        'Reddit': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        'Youtube': 'bg-red-500/20 text-red-400 border-red-500/30',
        'Vk': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'Twitter': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
        'Discord': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        'Tiktok': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    }[comment.source] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

    return (
        <div className={`bg-white/5 p-3 rounded-lg ${withBorder ? `border-l-4 ${sentimentColor}` : ''}`}>
           <div className="flex items-start justify-between">
              <blockquote className="text-sm text-brand-text-primary pr-4 italic">"{comment.text}"</blockquote>
           </div>
            <div className="flex items-center justify-between mt-3 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-brand-text-secondary">{comment.author}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${platformColor} whitespace-nowrap`}>
                        {comment.source}
                    </span>
                </div>
                 <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${comment.userType === 'Player' ? 'bg-blue-900/80 text-blue-300' : 'bg-purple-900/80 text-purple-300'}`}>{comment.userType}</span>
            </div>
        </div>
    )
}