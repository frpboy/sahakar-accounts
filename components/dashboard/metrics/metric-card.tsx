'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    icon?: React.ReactNode;
    loading?: boolean;
    className?: string;
}

export function MetricCard({
    title,
    value,
    subtitle,
    trend,
    trendValue,
    icon,
    loading,
    className
}: MetricCardProps) {
    const getTrendIcon = () => {
        if (!trend) return null;
        switch (trend) {
            case 'up':
                return <TrendingUp className="h-4 w-4 text-green-600" />;
            case 'down':
                return <TrendingDown className="h-4 w-4 text-red-600" />;
            case 'neutral':
                return <Minus className="h-4 w-4 text-gray-600" />;
        }
    };

    const getTrendColor = () => {
        switch (trend) {
            case 'up':
                return 'text-green-600';
            case 'down':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    if (loading) {
        return (
            <div className={cn("bg-white dark:bg-slate-900 rounded-lg shadow-sm border dark:border-slate-800 p-6 animate-pulse", className)}>
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-1/3"></div>
            </div>
        );
    }

    return (
        <div className={cn("bg-white dark:bg-slate-900 rounded-lg shadow-sm border dark:border-slate-800 p-6 hover:shadow-md transition-shadow", className)}>
            <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{title}</p>
                {icon && (
                    <div className="p-2 bg-blue-50 dark:bg-slate-800 rounded-lg">
                        {icon}
                    </div>
                )}
            </div>

            <div className="mb-2">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {value}
                </h3>
            </div>

            <div className="flex items-center gap-2">
                {trend && getTrendIcon()}
                {trendValue && (
                    <span className={cn("text-xs font-medium", getTrendColor())}>
                        {trendValue}
                    </span>
                )}
                {subtitle && (
                    <span className="text-xs text-gray-500 dark:text-slate-500">
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
    );
}
