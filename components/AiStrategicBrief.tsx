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

    // Функция для очистки текста от HTML тегов, кавычек и markdown
    const cleanText = (text: string): string => {
        return text
            // Убираем markdown code blocks (```html, ```json, ``` и т.д.)
            .replace(/```[\w]*\n?/g, '')
            // Убираем HTML entities
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            // Убираем HTML теги
            .replace(/<[^>]*>/g, '')
            // Убираем лишние кавычки в начале и конце
            .replace(/^["']+|["']+$/g, '')
            // Убираем двойные кавычки внутри текста
            .replace(/\\"/g, '"')
            // Убираем escaped символы
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, ' ')
            .replace(/\\r/g, '')
            // Убираем множественные пробелы
            .replace(/\s+/g, ' ')
            // Убираем пробелы перед и после переносов строк
            .replace(/ \n /g, '\n')
            .replace(/\n /g, '\n')
            .replace(/ \n/g, '\n')
            .trim();
    };

    // Загрузка брифа из базы данных
    useEffect(() => {
        const loadBrief = async () => {
            setIsLoading(true);
            try {
                const brief = await supabaseService.getLatestStrategicBrief(platformFilter);

                if (brief) {
                    // Очищаем текст от HTML и кавычек
                    setFullText(cleanText(brief.brief_text));
                    setBriefDate(brief.date);
                } else {
                    // Fallback text if no brief in database
                    setFullText('Strategic brief has not been generated yet. Run the script generate_strategic_brief.py to create a brief based on current metrics and community activity.');
                    setBriefDate('');
                }
            } catch (error) {
                console.error('Error loading brief:', error);
                setFullText('Error loading strategic brief.');
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
                <h3 className="text-xl font-semibold text-brand-text-primary">AI Strategic Brief</h3>
                {briefDate && (
                    <span className="text-xs text-brand-text-secondary">
                        {new Date(briefDate).toLocaleDateString('en-US', {
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
                        <span>Loading brief...</span>
                    </div>
                ) : (
                    <p className="text-sm text-brand-text-secondary leading-relaxed whitespace-pre-wrap">
                        {fullText}
                    </p>
                )}
            </div>
        </div>
    );
};
