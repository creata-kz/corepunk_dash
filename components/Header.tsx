import React, { useState, useEffect, useRef } from 'react';
import { DateRange, CustomDateRange } from '../types';

interface HeaderProps {
    dateRange: DateRange;
    setDateRange: (range: DateRange) => void;
    customDateRange: CustomDateRange | null;
    setCustomDateRange: (range: CustomDateRange | null) => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    dataSource?: 'mock' | 'supabase';
    metricsCount?: number;
    onOpenAiBrief?: () => void;
    hasUnreadBrief?: boolean;
}

const DateRangePicker: React.FC<{
    value: DateRange,
    onChange: (value: DateRange) => void,
    customRange: CustomDateRange | null,
    onCustomRangeChange: (range: CustomDateRange | null) => void
}> = ({ value, onChange, customRange, onCustomRangeChange }) => {
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [tempStartDate, setTempStartDate] = useState('');
    const [tempEndDate, setTempEndDate] = useState('');

    const ranges: { id: DateRange, label: string }[] = [
        { id: 'today', label: 'Today' },
        { id: 'all', label: 'All' },
        { id: 'custom', label: 'Custom' },
    ];

    const handleRangeChange = (range: DateRange) => {
        console.log(`🎯 DateRangePicker: Changing from "${value}" to "${range}"`);
        onChange(range);
    };

    const handleCustomClick = () => {
        if (value !== 'custom') {
            onChange('custom');
            setShowCustomPicker(true);
        } else {
            setShowCustomPicker(!showCustomPicker);
        }
    };

    const handleApplyCustom = () => {
        if (tempStartDate && tempEndDate) {
            const start = new Date(tempStartDate);
            const end = new Date(tempEndDate);
            const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays > 90) {
                alert('Date range cannot exceed 90 days');
                return;
            }

            if (start > end) {
                alert('Start date must be before end date');
                return;
            }

            onCustomRangeChange({ startDate: tempStartDate, endDate: tempEndDate });
            setShowCustomPicker(false);
        }
    };

    return (
        <div className="relative">
            <div className="bg-brand-surface p-1 rounded-lg border border-brand-border flex items-center space-x-1">
                {ranges.map(range => (
                    <button
                        key={range.id}
                        onClick={() => range.id === 'custom' ? handleCustomClick() : handleRangeChange(range.id)}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                            value === range.id
                                ? 'bg-brand-primary text-white'
                                : 'text-brand-text-secondary hover:bg-brand-surface-2'
                        }`}
                    >
                        {range.label}
                    </button>
                ))}
            </div>

            {/* Custom Date Picker Dropdown */}
            {showCustomPicker && (
                <div className="absolute top-full mt-2 right-0 z-50 bg-brand-surface border border-brand-border rounded-lg p-4 shadow-xl min-w-[300px]">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-brand-text-secondary mb-1">Start Date</label>
                            <input
                                type="date"
                                value={tempStartDate || customRange?.startDate || ''}
                                onChange={(e) => setTempStartDate(e.target.value)}
                                className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-md text-brand-text-primary text-sm [color-scheme:dark]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-brand-text-secondary mb-1">End Date</label>
                            <input
                                type="date"
                                value={tempEndDate || customRange?.endDate || ''}
                                onChange={(e) => setTempEndDate(e.target.value)}
                                className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-md text-brand-text-primary text-sm [color-scheme:dark]"
                            />
                        </div>
                        <div className="text-xs text-brand-text-secondary">
                            Max 90 days range
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleApplyCustom}
                                className="flex-1 px-3 py-2 bg-brand-primary text-white rounded-md text-sm font-medium hover:bg-brand-secondary transition-colors"
                            >
                                Apply
                            </button>
                            <button
                                onClick={() => setShowCustomPicker(false)}
                                className="flex-1 px-3 py-2 bg-brand-surface-2 text-brand-text-secondary rounded-md text-sm font-medium hover:bg-brand-border transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const Header: React.FC<HeaderProps> = ({
    dateRange,
    setDateRange,
    customDateRange,
    setCustomDateRange,
    onRefresh,
    isRefreshing = false,
    dataSource = 'mock',
    metricsCount = 0,
    onOpenAiBrief,
    hasUnreadBrief = false
}) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [showSourceTooltip, setShowSourceTooltip] = useState(false);
    const sourceRefCompact = useRef<HTMLDivElement>(null);
    const sourceRefFull = useRef<HTMLDivElement>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        const handleScroll = () => {
            const scrollThreshold = 100; // Порог скролла для переключения
            setIsScrolled(window.scrollY > scrollThreshold);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSourceMouseEnter = (ref: React.RefObject<HTMLDivElement>) => {
        const currentRef = ref.current;
        if (currentRef && metricsCount > 0) {
            const rect = currentRef.getBoundingClientRect();
            setTooltipPosition({
                top: rect.bottom + 8,
                left: rect.left
            });
            setShowSourceTooltip(true);
        }
    };

    const handleSourceMouseLeave = () => {
        setShowSourceTooltip(false);
    };

    return (
        <header className={`fixed top-0 left-20 right-0 z-40 bg-brand-surface/80 backdrop-blur-lg border-b border-brand-border shadow-lg transition-all duration-500 ease-in-out ${isScrolled ? 'py-2' : 'py-4'}`}>
            <style>{`
                @keyframes gradientShift {
                    0% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                    100% {
                        background-position: 0% 50%;
                    }
                }
                .source-gradient-animation {
                    background: linear-gradient(90deg, rgba(74, 222, 128, 0.25), rgba(34, 197, 94, 0.2), rgba(74, 222, 128, 0.25), rgba(34, 197, 94, 0.2), rgba(74, 222, 128, 0.25));
                    background-size: 200% 100%;
                    animation: gradientShift 3s ease-in-out infinite;
                    will-change: background-position;
                }
            `}</style>
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                {isScrolled ? (
                    // Компактная версия
                    <div className="flex items-center justify-between gap-4 transition-all duration-500">
                        <div className="flex items-center gap-3">
                            <img src="https://storage.googleapis.com/corepunk-static/pages/logos/game-logo.webp" alt="Corepunk Logo" className="h-8 w-auto transition-all duration-500" />
                            <div className="flex items-center gap-3 flex-wrap">
                                <div 
                                    ref={sourceRefCompact}
                                    onMouseEnter={() => handleSourceMouseEnter(sourceRefCompact)}
                                    onMouseLeave={handleSourceMouseLeave}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1.5 transition-all duration-300 relative cursor-pointer ${
                                        dataSource === 'supabase'
                                            ? 'text-green-400 border border-green-500/30'
                                            : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                    } ${dataSource === 'supabase' && showSourceTooltip ? 'source-gradient-animation' : 'bg-green-500/20'}`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full ${dataSource === 'supabase' ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`}></div>
                                    <span>Source: {dataSource === 'supabase' ? 'Supabase (Live)' : 'Demo Data'}</span>
                                    {showSourceTooltip && metricsCount > 0 && (
                                        <div 
                                            className="fixed z-[9999] bg-brand-surface border border-brand-border rounded-lg px-3 py-2 shadow-xl text-xs text-brand-text-primary whitespace-nowrap"
                                            style={{
                                                top: `${tooltipPosition.top}px`,
                                                left: `${tooltipPosition.left}px`
                                            }}
                                        >
                                            {metricsCount} days of data
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {onOpenAiBrief && (
                                <button
                                    onClick={onOpenAiBrief}
                                    className="relative px-3 py-1 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 hover:border-purple-500/50 rounded-lg transition-colors flex items-center justify-center gap-1.5 group h-[34px]"
                                    title="AI Strategic Brief"
                                >
                                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    <span className="text-xs font-medium text-purple-400">AI Brief</span>
                                    {hasUnreadBrief && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-purple-500/30 animate-pulse"></span>
                                    )}
                                </button>
                            )}
                            {onRefresh && (
                                <button
                                    onClick={onRefresh}
                                    disabled={isRefreshing}
                                    className="px-3 py-1 bg-brand-surface hover:bg-brand-surface-2 disabled:opacity-50 disabled:cursor-not-allowed border border-brand-border rounded-lg transition-colors flex items-center justify-center h-[34px]"
                                    title="Refresh data"
                                >
                                    <svg
                                        className={`w-4 h-4 text-brand-text-secondary ${isRefreshing ? 'animate-spin' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                </button>
                            )}
                            <DateRangePicker
                                value={dateRange}
                                onChange={setDateRange}
                                customRange={customDateRange}
                                onCustomRangeChange={setCustomDateRange}
                            />
                        </div>
                    </div>
                ) : (
                    // Полная версия
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-500">
                        <div className="flex items-center gap-3">
                            <img src="https://storage.googleapis.com/corepunk-static/pages/logos/game-logo.webp" alt="Corepunk Logo" className="h-10 w-auto transition-all duration-500" />
                            <div className="overflow-hidden">
                                <h1 className="text-2xl font-bold text-brand-text-primary transition-all duration-500">Corepunk Command Center</h1>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    <p className="text-xs text-brand-text-secondary transition-all duration-500">Analytics & Community Pulse</p>
                                    <div 
                                        ref={sourceRefFull}
                                        onMouseEnter={() => handleSourceMouseEnter(sourceRefFull)}
                                        onMouseLeave={handleSourceMouseLeave}
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1.5 transition-all duration-300 relative cursor-pointer ${
                                            dataSource === 'supabase'
                                                ? 'text-green-400 border border-green-500/30'
                                                : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                        } ${dataSource === 'supabase' && showSourceTooltip ? 'source-gradient-animation' : 'bg-green-500/20'}`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${dataSource === 'supabase' ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`}></div>
                                        <span>Source: {dataSource === 'supabase' ? 'Supabase (Live)' : 'Demo Data'}</span>
                                        {showSourceTooltip && metricsCount > 0 && (
                                            <div 
                                                className="fixed z-[9999] bg-brand-surface border border-brand-border rounded-lg px-3 py-2 shadow-xl text-xs text-brand-text-primary whitespace-nowrap"
                                                style={{
                                                    top: `${tooltipPosition.top}px`,
                                                    left: `${tooltipPosition.left}px`
                                                }}
                                            >
                                                {metricsCount} days of data
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {onOpenAiBrief && (
                                <button
                                    onClick={onOpenAiBrief}
                                    className="relative px-3 py-1 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 hover:border-purple-500/50 rounded-lg transition-colors flex items-center gap-2 group h-[34px]"
                                    title="AI Strategic Brief"
                                >
                                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    <span className="text-xs font-medium text-purple-400 hidden sm:inline">AI Brief</span>
                                    {hasUnreadBrief && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-purple-500/30 animate-pulse"></span>
                                    )}
                                </button>
                            )}
                            {onRefresh && (
                                <button
                                    onClick={onRefresh}
                                    disabled={isRefreshing}
                                    className="px-3 py-1 bg-brand-surface hover:bg-brand-surface-2 disabled:opacity-50 disabled:cursor-not-allowed border border-brand-border rounded-lg transition-colors flex items-center gap-2 h-[34px]"
                                    title="Refresh data"
                                >
                                    <svg
                                        className={`w-4 h-4 text-brand-text-secondary ${isRefreshing ? 'animate-spin' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                    <span className="text-xs font-medium text-brand-text-secondary">
                                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                                    </span>
                                </button>
                            )}
                            <DateRangePicker
                                value={dateRange}
                                onChange={setDateRange}
                                customRange={customDateRange}
                                onCustomRangeChange={setCustomDateRange}
                            />
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};
