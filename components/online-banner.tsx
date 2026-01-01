'use client';

import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';

interface OnlineBannerProps {
    isOnline: boolean;
}

export function OnlineBanner({ isOnline }: OnlineBannerProps) {
    if (isOnline) {
        return null; // Don't show banner when online
    }

    return (
        <div className="bg-red-600 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
            <WifiOff className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
                <p className="font-medium">You're offline</p>
                <p className="text-sm text-red-100">Entries will be saved as drafts only.</p>
            </div>
        </div>
    );
}
