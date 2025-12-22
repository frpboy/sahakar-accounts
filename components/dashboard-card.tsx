import { ReactNode } from 'react';

interface DashboardCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    colorClass?: string;
}

export function DashboardCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    trendValue,
    colorClass = 'text-gray-900',
}: DashboardCardProps) {
    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend === 'up') return '↑';
        if (trend === 'down') return '↓';
        return '→';
    };

    const getTrendColor = () => {
        if (trend === 'up') return 'text-green-600';
        if (trend === 'down') return 'text-red-600';
        return 'text-gray-600';
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                    <p className={`text-3xl font-bold ${colorClass} mt-2`}>{value}</p>
                    {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
                    {trend && trendValue && (
                        <p className={`text-sm ${getTrendColor()} mt-2`}>
                            {getTrendIcon()} {trendValue}
                        </p>
                    )}
                </div>
                {icon && <div className="text-gray-400 ml-4">{icon}</div>}
            </div>
        </div>
    );
}
