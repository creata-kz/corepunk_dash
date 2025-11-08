import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { PostWithComments } from '../types';
import { CommentCard } from './CommentCard';
import { getPlatformIcon, getPlatformColor } from '../utils/platformIcons';

interface PostWithCommentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    postData: PostWithComments | null;
}

export const PostWithCommentsModal: React.FC<PostWithCommentsModalProps> = ({ isOpen, onClose, postData }) => {
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const modalRoot = document.getElementById('modal-root') || document.body;

    useEffect(() => {
        if (isOpen && postData) {
            requestAnimationFrame(() => {
                setShouldAnimate(true);
            });
        } else {
            setShouldAnimate(false);
        }
    }, [isOpen, postData]);

    // Обработка клавиши ESC для закрытия
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen || !postData) return null;

    const { post, comments, totalComments } = postData;

    return ReactDOM.createPortal(
        <>
            {/* Затемненный фон */}
            <div
                className={`fixed inset-0 bg-black/60 z-[20000] transition-opacity duration-300 ${shouldAnimate ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />
            {/* Модалка с деталями поста - центрированная */}
            <div 
                className={`fixed inset-0 z-[20001] flex items-center justify-center p-4 transition-opacity duration-300 ${shouldAnimate ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            >
                <div 
                    className={`glass-card w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-black/40 rounded-xl overflow-hidden transition-all duration-300 ease-out pointer-events-auto ${shouldAnimate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                {/* Header */}
                <div className="flex items-start justify-between p-4 border-b border-white/10 shrink-0">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded border flex items-center gap-1 ${getPlatformColor(post.source)}`}>
                                {getPlatformIcon(post.source, 'w-3 h-3')}
                                {post.source}
                            </span>
                            <span className="text-xs text-brand-text-secondary">
                                {new Date(post.timestamp).toLocaleDateString()}
                            </span>
                        </div>
                        <h2 className="text-base font-semibold text-brand-text-primary mb-1.5 break-words leading-snug">{post.text}</h2>
                        <div className="flex items-center gap-3 text-xs text-brand-text-secondary">
                            <span>By {post.author}</span>
                            {post.metadata?.score && <span>↑ {post.metadata.score} upvotes</span>}
                            <span>{totalComments} comments</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            {post.metadata?.url && (
                                <a
                                    href={post.metadata.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-brand-primary hover:text-brand-secondary transition-colors"
                                >
                                    View original post
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                            {post.metadata?.video_urls && post.metadata.video_urls.length > 0 && (
                                post.metadata.video_urls.map((videoUrl, index) => (
                                    <a
                                        key={index}
                                        href={videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Watch video {post.metadata.video_urls.length > 1 ? `#${index + 1}` : ''}
                                    </a>
                                ))
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-brand-text-secondary hover:text-brand-text-primary transition-colors p-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Comments */}
                <div className="flex-1 overflow-y-auto p-4 min-h-0 pr-2">
                    <h3 className="text-sm font-semibold text-brand-text-primary mb-3 shrink-0">
                        Comments ({comments.length})
                    </h3>
                    {comments.length > 0 ? (
                        <div className="space-y-2">
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
        </>,
        modalRoot
    );
};
