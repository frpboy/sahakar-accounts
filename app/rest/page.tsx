'use client';

import { useEffect, useState } from 'react';
import { Moon, Star, Coffee, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MESSAGES = [
    {
        title: "Your duty time is over for today",
        body: "Go and take rest for now. We will continue fresh after 7 AM."
    },
    {
        title: "Great work today!",
        body: "You've earned this rest. Sleep well and recharge for tomorrow."
    },
    {
        title: "Health is wealth",
        body: "Taking time to disconnect is just as important as working hard. Have a good night."
    },
    {
        title: "The stars are out",
        body: "It's time to sign off. The system is sleeping too. See you in the morning!"
    },
    {
        title: "Mission Accomplished",
        body: "Today's chapter is closed. Rest up to write a great new one tomorrow."
    }
];

export default function RestPage() {
    const router = useRouter();
    const [message, setMessage] = useState(MESSAGES[0]);

    useEffect(() => {
        // Pick random message
        const random = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
        setMessage(random);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-10 left-10 text-slate-800 animate-pulse">
                <Star className="w-8 h-8" />
            </div>
            <div className="absolute top-20 right-20 text-slate-800 animate-pulse delay-75">
                <Star className="w-6 h-6" />
            </div>
            <div className="absolute bottom-32 left-1/4 text-slate-800 animate-pulse delay-150">
                <Star className="w-4 h-4" />
            </div>
            <div className="absolute top-1/3 right-10 text-slate-800 animate-pulse">
                <Star className="w-5 h-5" />
            </div>

            <div className="z-10 bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-8 rounded-2xl max-w-lg w-full shadow-2xl space-y-8">
                {/* Icon Animation */}
                <div className="relative flex justify-center mb-8">
                    <div className="bg-blue-950/50 p-6 rounded-full ring-4 ring-blue-900/30 shadow-lg shadow-blue-900/20">
                        <Moon className="w-16 h-16 text-blue-200" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-slate-900 rounded-full p-2 border border-slate-700 animate-bounce">
                        <Coffee className="w-6 h-6 text-amber-200" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        {message.title}
                    </h1>
                    <p className="text-slate-300 text-lg leading-relaxed">
                        {message.body}
                    </p>
                </div>

                {/* Divider with Heart */}
                <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-slate-800"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-600">
                        <Heart className="w-5 h-5 text-red-900/80 fill-red-900/50" />
                    </span>
                    <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <div className="text-slate-500 text-sm">
                    Access re-opens at 07:00 AM
                </div>

                <div className="pt-4">
                    <button
                        onClick={() => router.push('/login')}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                        Back to Login
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 text-slate-700 text-xs">
                Sahakar Hyper Pharmacy &copy; {new Date().getFullYear()}
            </div>
        </div>
    );
}
