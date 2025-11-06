import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import type { PlatformFilter } from '../types';

interface AiStrategicBriefProps {
    platformFilter?: PlatformFilter;
}

export const AiStrategicBrief: React.FC<AiStrategicBriefProps> = ({ platformFilter = 'all' }) => {
    const [fullText, setFullText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [briefDate, setBriefDate] = useState<string>('');

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

    return (
        <div
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
                        dangerouslySetInnerHTML={{ __html: fullText }}
                    />
                )}
            </div>
        </div>
    );
};
