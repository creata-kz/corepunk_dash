import React, { useState, useEffect, useRef } from 'react';
import { supabaseService } from '../services/supabaseService';
import type { PlatformFilter } from '../types';

interface AiStrategicBriefProps {
    platformFilter?: PlatformFilter;
}

// A simple hook to detect when an element is in view
const useInView = (options: IntersectionObserverInit = { threshold: 0.6 }) => {
    const [isInView, setIsInView] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        const observer = new IntersectionObserver(([entry]) => {
            // Trigger only once
            if (entry.isIntersecting) {
                setIsInView(true);
                if (element) {
                    observer.unobserve(element);
                }
            }
        }, options);

        if (element) {
            observer.observe(element);
        }

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [options]);

    return [ref, isInView] as const;
};

export const AiStrategicBrief: React.FC<AiStrategicBriefProps> = ({ platformFilter = 'all' }) => {
    const [ref, isInView] = useInView();
    const [displayedText, setDisplayedText] = useState('');
    const [fullText, setFullText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [briefDate, setBriefDate] = useState<string>('');
    const typingSpeed = 15; // ms

    // Загрузка брифа из базы данных
    useEffect(() => {
        const loadBrief = async () => {
            setIsLoading(true);
            try {
                const brief = await supabaseService.getLatestStrategicBrief(platformFilter);

                if (brief) {
                    setFullText(brief.brief_text);
                    setBriefDate(brief.date);
                } else {
                    // Fallback текст если нет брифа в базе
                    setFullText(`Стратегический бриф пока не сгенерирован. <br/><br/>Запустите скрипт <span class="font-mono text-brand-primary">generate_strategic_brief.py</span> для создания брифа на основе текущих метрик и активности сообщества.`);
                    setBriefDate('');
                }
            } catch (error) {
                console.error('Error loading brief:', error);
                setFullText('Ошибка загрузки стратегического брифа.');
            } finally {
                setIsLoading(false);
            }
        };

        loadBrief();
    }, [platformFilter]);

    // Эффект печатающего текста
    useEffect(() => {
        if (isInView && fullText && !isLoading) {
            let i = 0;
            setDisplayedText(''); // Reset displayed text

            const interval = setInterval(() => {
                if (i < fullText.length) {
                    setDisplayedText(fullText.substring(0, i + 1));
                    i++;
                } else {
                    clearInterval(interval);
                    setDisplayedText(fullText);
                }
            }, typingSpeed);

            return () => clearInterval(interval);
        }
    }, [isInView, fullText, isLoading]);

    // Show a cursor only while typing
    const isTyping = displayedText.length < fullText.length && !isLoading;
    const textWithCursor = isTyping
        ? displayedText + '<span class="inline-block w-2 h-4 bg-brand-text-secondary ml-1 animate-pulse" style="animation-duration: 0.7s;"></span>'
        : displayedText;

    return (
        <div
            ref={ref}
            className="glass-card p-4 rounded-xl text-left w-full h-full flex flex-col"
        >
            <div className="flex items-center justify-between mb-2 shrink-0">
                <h3 className="text-3xl font-semibold text-brand-text-primary">AI Strategic Brief</h3>
                {briefDate && (
                    <span className="text-xs text-brand-text-secondary">
                        {new Date(briefDate).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </span>
                )}
            </div>

            <div className="flex-1 flex items-center justify-center min-h-[170px]">
                {isLoading ? (
                    <div className="flex items-center gap-2 text-brand-text-secondary">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-primary"></div>
                        <span>Загрузка брифа...</span>
                    </div>
                ) : (
                    <p
                        className="text-sm text-brand-text-secondary leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: isInView ? textWithCursor : '' }}
                    />
                )}
            </div>
        </div>
    );
};
