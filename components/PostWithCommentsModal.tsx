import React from 'react';
import { PostWithComments } from '../types';
import { CommentCard } from './CommentCard';

interface PostWithCommentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    postData: PostWithComments | null;
}

export const PostWithCommentsModal: React.FC<PostWithCommentsModalProps> = ({ isOpen, onClose, postData }) => {
    if (!isOpen || !postData) return null;

    const { post, comments, totalComments } = postData;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-brand-border flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
                                post.source === 'Reddit' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                post.source === 'Youtube' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                post.source === 'Tiktok' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' :
                                'bg-gray-500/20 text-gray-400 border-gray-500/30'
                            }`}>
                                {post.source}
                            </span>
                            <span className="text-xs text-brand-text-secondary">
                                {new Date(post.timestamp).toLocaleDateString()}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-brand-text-primary mb-2">{post.text}</h2>
                        <div className="flex items-center gap-4 text-sm text-brand-text-secondary">
                            <span>By {post.author}</span>
                            {post.metadata?.score && <span>↑ {post.metadata.score} upvotes</span>}
                            <span>{totalComments} comments</span>
                        </div>
                        {post.metadata?.url && (
                            <a
                                href={post.metadata.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-3 text-sm text-brand-primary hover:text-brand-secondary transition-colors"
                            >
                                View original post
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-brand-text-secondary hover:text-brand-text-primary transition-colors p-2"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Comments */}
                <div className="flex-1 overflow-y-auto p-6">
                    <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
                        Comments ({comments.length})
                    </h3>
                    {comments.length > 0 ? (
                        <div className="space-y-3">
                            {comments.map((comment) => (
                                <CommentCard key={comment.id} comment={comment} withBorder={true} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-brand-text-secondary text-center py-8">No comments yet</p>
                    )}
                </div>
            </div>
        </div>
    );
};
