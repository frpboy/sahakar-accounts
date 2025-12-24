'use client';

import { Shield, AlertCircle } from 'lucide-react';

interface AuditorBannerProps {
    accessEndDate: string | null;
    userName: string;
}

export function AuditorBanner({ accessEndDate, userName }: AuditorBannerProps) {
    if (!accessEndDate) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-red-600" />
                    <div className="flex-1">
                        <h3 className="font-bold text-red-900 flex items-center gap-2">
                            READ-ONLY AUDITOR MODE
                            <span className="text-xs px-2 py-1 bg-red-600 text-white rounded">ACTIVE</span>
                        </h3>
                        <p className="text-sm text-red-700 mt-1">
                            Logged in as: <strong>{userName}</strong> | Access: Indefinite
                        </p>
                        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            ⚠️ No modifications allowed. All actions are logged for audit compliance.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const expiryDate = new Date(accessEndDate);
    const today = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = daysRemaining <= 7;
    const isExpired = daysRemaining < 0;

    const bgColor = isExpired ? 'bg-gray-100' : isExpiringSoon ? 'bg-orange-50' : 'bg-red-50';
    const borderColor = isExpired ? 'border-gray-500' : isExpiringSoon ? 'border-orange-500' : 'border-red-500';
    const textColor = isExpired ? 'text-gray-900' : isExpiringSoon ? 'text-orange-900' : 'text-red-900';
    const subTextColor = isExpired ? 'text-gray-700' : isExpiringSoon ? 'text-orange-700' : 'text-red-700';

    return (
        <div className={`${bgColor} border-l-4 ${borderColor} p-4 mb-6`}>
            <div className="flex items-center gap-3">
                <Shield className={`w-6 h-6 ${isExpired ? 'text-gray-600' : isExpiringSoon ? 'text-orange-600' : 'text-red-600'}`} />
                <div className="flex-1">
                    <h3 className={`font-bold ${textColor} flex items-center gap-2`}>
                        READ-ONLY AUDITOR MODE
                        {isExpired && (
                            <span className="text-xs px-2 py-1 bg-gray-600 text-white rounded">EXPIRED</span>
                        )}
                        {isExpiringSoon && !isExpired && (
                            <span className="text-xs px-2 py-1 bg-orange-600 text-white rounded">EXPIRING SOON</span>
                        )}
                        {!isExpired && !isExpiringSoon && (
                            <span className="text-xs px-2 py-1 bg-red-600 text-white rounded">ACTIVE</span>
                        )}
                    </h3>
                    <p className={`text-sm ${subTextColor} mt-1`}>
                        Logged in as: <strong>{userName}</strong>
                    </p>
                    <p className={`text-sm ${subTextColor} mt-1`}>
                        Access expires on: <strong>{expiryDate.toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</strong>
                        {!isExpired && (
                            <span className="ml-2">
                                ({daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining)
                            </span>
                        )}
                        {isExpired && (
                            <span className="ml-2 text-red-600 font-semibold">
                                (Access Expired - Contact Administrator)
                            </span>
                        )}
                    </p>
                    <p className={`text-xs mt-2 flex items-center gap-1 ${isExpired ? 'text-gray-600' : subTextColor}`}>
                        <AlertCircle className="w-4 h-4" />
                        ⚠️ No modifications allowed. All actions are logged for audit compliance.
                    </p>
                </div>
            </div>
        </div>
    );
}
