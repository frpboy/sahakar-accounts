'use client';

interface SkeletonProps {
    variant?: 'card' | 'table' | 'list' | 'chart' | 'text';
    count?: number;
}

export function Skeleton({ variant = 'card', count = 1 }: SkeletonProps) {
    if (variant === 'card') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-6 w-6 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'table') {
        return (
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <th key={i} className="px-6 py-3">
                                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {Array.from({ length: count || 5 }).map((_, i) => (
                            <tr key={i}>
                                {Array.from({ length: 4 }).map((_, j) => (
                                    <td key={j} className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (variant === 'list') {
        return (
            <div className="space-y-3">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'chart') {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
                <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
            </div>
        );
    }

    // Text variant
    return (
        <div className="space-y-2 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
        </div>
    );
}

// Specific skeleton components for common use cases
export function DashboardSkeleton() {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>

            {/* Cards */}
            <Skeleton variant="card" count={4} />

            {/* Content */}
            <div className="mt-8 animate-pulse">
                <div className="h-64 bg-gray-100 rounded-lg"></div>
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return <Skeleton variant="table" count={rows} />;
}

export function ChartSkeleton() {
    return <Skeleton variant="chart" />;
}
