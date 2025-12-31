'use client';

import React from 'react';
import { useApp } from '@/components/providers/app-provider';
import { Share2 } from 'lucide-react';

export function TopBar({ title }: { title: string }) {
    const { isOffline } = useApp();

    return (
        <header className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-10">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            
            <div className="flex items-center gap-4">
                {/* Status Badge */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isOffline ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                }`}>
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${isOffline ? 'bg-gray-400' : 'bg-green-400'}`}></span>
                    {isOffline ? 'Offline' : 'Online'}
                </span>

                <button className="p-2 text-gray-400 hover:text-gray-500">
                    <Share2 className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
