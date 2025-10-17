import React, { useState } from 'react';
import { DateRange, CustomDateRange } from '../types';

interface HeaderProps {
    dateRange: DateRange;
    setDateRange: (range: DateRange) => void;
    customDateRange: CustomDateRange | null;
    setCustomDateRange: (range: CustomDateRange | null) => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
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
                        onClick={() => range.id === 'custom' ? handleCustomClick() : onChange(range.id)}
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
                                className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-md text-brand-text-primary text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-brand-text-secondary mb-1">End Date</label>
                            <input
                                type="date"
                                value={tempEndDate || customRange?.endDate || ''}
                                onChange={(e) => setTempEndDate(e.target.value)}
                                className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-md text-brand-text-primary text-sm"
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
    isRefreshing = false
}) => {
    return (
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex items-center gap-4">
                <img src="https://storage.googleapis.com/corepunk-static/pages/logos/game-logo.webp" alt="Corepunk Logo" className="h-16 w-auto" />
                <div>
                    <h1 className="text-5xl font-bold text-brand-text-primary">Corepunk Command Center</h1>
                    <p className="text-brand-text-secondary mt-1">Analytics & Community Pulse</p>
                </div>
            </div>
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="px-4 py-2 bg-brand-surface hover:bg-brand-surface-2 disabled:opacity-50 disabled:cursor-not-allowed border border-brand-border rounded-lg transition-colors flex items-center gap-2"
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
                        <span className="text-sm font-medium text-brand-text-secondary">
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
        </header>
    );
};
