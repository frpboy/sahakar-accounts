'use client';

import { useEffect, useState } from 'react';
import { Moon, Star, Coffee, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MESSAGES = [
    { title: "Your duty time is over for today", body: "Go and take rest for now. We will continue fresh after 7 AM." },
    { title: "Great work today!", body: "You've earned this rest. Sleep well and recharge for tomorrow." },
    { title: "Health is wealth", body: "Taking time to disconnect is just as important as working hard. Have a good night." },
    { title: "The stars are out", body: "It's time to sign off. The system is sleeping too. See you in the morning!" },
    { title: "Mission Accomplished", body: "Today's chapter is closed. Rest up to write a great new one tomorrow." },
    { title: "Sweet Dreams", body: "Leave the work for tomorrow. Tonight is for you." },
    { title: "Recharge Your Batteries", body: "You can't pour from an empty cup. Take care of yourself." },
    { title: "Pause and Breathe", body: "Inhale peace, exhale stress. You did good today." },
    { title: "Tomorrow is a New Day", body: "Reset, refresh, and restart. Good night!" },
    { title: "Silence is Golden", body: "Listen to the quiet of the night. It's time to rest." },
    { title: "You Are Appreciated", body: "Thank you for your hard work. Now, go relax." },
    { title: "Disconnect to Reconnect", body: "Unplug from the system and plug into your dreams." },
    { title: "Sleep is the Best Meditation", body: "Clear your mind and let sleep take over." },
    { title: "Well Done!", body: "Another day, another victory. Time to celebrate with some sleep." },
    { title: "Night Mode: ON", body: "The world is sleeping, and so should you." },
    { title: "Peace of Mind", body: "Let go of today's worries. Tomorrow will handle itself." },
    { title: "Rest is Productive", body: "Recovery is part of the process. Don't skip it." },
    { title: "Good Night, Team!", body: "We are stronger when we are well-rested. See you at 7 AM." },
    { title: "Time to Unwind", body: "Kick back, relax, and enjoy your evening." },
    { title: "Dream Big", body: "Close your eyes and let your imagination soar." },
    { title: "A Well-Deserved Break", body: "You've worked hard. Now, rest easy." },
    { title: "Tranquility Awaits", body: "Step away from the screen and into the calm." },
    { title: "Log Out and Chill Out", body: "The best login is a good night's sleep." },
    { title: "Refresh Your Mind", body: "A rested mind is a sharp mind. Sleep tight." },
    { title: "Balance is Key", body: "Work hard, rest harder. Maintain your balance." },
    { title: "See You Tomorrow", body: "The work will be here. Make sure you are ready for it." },
    { title: "Moonlight Serenade", body: "Let the night sky bring you peace." },
    { title: "Keep Calm and Sleep On", body: "Stress less, sleep more." },
    { title: "Your Health Matters", body: "Prioritize your sleep. It's the foundation of health." },
    { title: "Good Vibes Only", body: "End your day on a positive note. You did great." },
    { title: "Serenity Now", body: "Find your inner peace before you sleep." },
    { title: "Midnight Motivation", body: "The best preparation for tomorrow is doing your best today... and resting tonight." },
    { title: "Sleep Tight", body: "May your dreams be sweet and your rest be deep." },
    { title: "Offline Mode", body: "You are now offline. Enjoy your real life." },
    { title: "Be Kind to Yourself", body: "Give yourself the gift of a good night's sleep." },
    { title: "Rest & Recover", body: "Your body needs this time. Honor it." },
    { title: "Until Tomorrow", body: "Signing off. Have a wonderful night." },
    { title: "Quiet Time", body: "Embrace the silence. It heals." },
    { title: "Nighty Night", body: "Time to tuck in. Sleep well." },
    { title: "Fresh Start Ahead", body: "Tomorrow brings new opportunities. Be ready." },
    { title: "Mindfulness Moment", body: "Be present in your rest. Enjoy the relaxation." },
    { title: "Let It Go", body: "Release the day. Embrace the night." },
    { title: "Stay Healthy", body: "Sleep is the best medicine. Take your dose." },
    { title: "You Make a Difference", body: "Your work matters. Start fresh tomorrow." },
    { title: "Calm Waters", body: "Let your mind be as still as a calm lake." },
    { title: "Restful Thoughts", body: "Think happy thoughts as you drift off." },
    { title: "Energy Saving Mode", body: "Conserve your energy for a bright tomorrow." },
    { title: "Good Night, Sleep Tight", body: "Don't let the bed bugs bite!" },
    { title: "A Job Well Done", body: "Be proud of what you achieved today." },
    { title: "Reset Button", body: "Sleep is nature's reset button. Press it." },
    { title: "Peaceful Slumber", body: "May your sleep be uninterrupted and restful." },
    { title: "Dreamland Awaits", body: "Your ticket to dreamland is ready. Board now." },
    { title: "Sign Off", body: "Officially signing off. Over and out." },
    { title: "Night Owl No More", body: "Even night owls need to rest sometime." },
    { title: "Early to Rise", body: "Makes you healthy, wealthy, and wise. But first, sleep." },
    { title: "Wrap Up", body: "That's a wrap for today. Good night." },
    { title: "Comfort Zone", body: "Get comfortable and drift away." },
    { title: "Starlight, Starbright", body: "Wish I may, wish I might, have a good sleep tonight." },
    { title: "Rest Assured", body: "Everything is under control. You can rest now." },
    { title: "Daily Detox", body: "Sleep is the ultimate detox for your brain." },
    { title: "Positive Endings", body: "End the day with gratitude." },
    { title: "Self Care", body: "Sleeping is the highest form of self-care." },
    { title: "Deep Breaths", body: "Breathe in relaxation, breathe out tension." },
    { title: "Night Watch", body: "Your watch is ended. Rest now." },
    { title: "Soft Pillows", body: "May your pillow be cool and your blanket warm." },
    { title: "Golden Slumber", body: "Sleep is more precious than gold right now." },
    { title: "Counting Sheep", body: "1, 2, 3... zzz..." },
    { title: "Drift Away", body: "Let yourself drift into a deep sleep." },
    { title: "Silent Night", body: "All is calm, all is bright (in your dreams)." },
    { title: "Power Down", body: "System shutdown initiated. Good night." },
    { title: "Rebooting...", body: "System update in progress (aka sleeping)." },
    { title: "Battery Low", body: "Please connect to charger (bed)." },
    { title: "Blanket Fort", body: "Build a fort and hide from the world tonight." },
    { title: "Cozy Up", body: "Get cozy. It's rest time." },
    { title: "Sweet Repose", body: "Enjoy your repose. You deserve it." },
    { title: "Natures Cure", body: "Sleep cures what medicine implies." },
    { title: "Dreams of Success", body: "Visualize your success in your dreams." },
    { title: "Mental Break", body: "Give your brain a break. It worked hard today." },
    { title: "Physical Rest", body: "Your body is a temple. Let it rest." },
    { title: "Emotional Reset", body: "Clear your heart for a happy tomorrow." },
    { title: "Review & Rest", body: "Reflect briefly, then let it go." },
    { title: "The Day is Done", body: "Whatever happened, happened. It's over now." },
    { title: "Tomorrow's Promise", body: "Tomorrow holds new promise. Sleep to see it." },
    { title: "Quiet the Noise", body: "Turn down the volume of the world." },
    { title: "Inner Stillness", body: "Find the stillness within you." },
    { title: "Grateful Heart", body: "Sleep with a grateful heart." },
    { title: "Peaceful Night", body: "Wishing you a peaceful and restful night." },
    { title: "Restorative Sleep", body: "May your sleep restore your spirit." },
    { title: "Morning Glory", body: "Sleep for the glory of the morning." },
    { title: "Night Sky", body: "Look at the stars and feel small (in a good way)." },
    { title: "Universe at Rest", body: "The universe is resting with you." },
    { title: "Safe & Sound", body: "You are safe. You can let go." },
    { title: "Heavy Eyelids", body: "Let those eyelids close. They are heavy." },
    { title: "Snuggle Time", body: "Time to snuggle up." },
    { title: "Warm Wishes", body: "Sending you warm wishes for a good night." },
    { title: "Dream Catcher", body: "Catch good dreams only." },
    { title: "Night Whisper", body: "Listen to the whisper of the night." },
    { title: "Sleepy Head", body: "Go to bed, sleepy head." },
    { title: "Bedtime Story", body: "Your life is a story. Use sleep to turn the page." },
    { title: "Rest is Resistance", body: "Resting is an act of resistance against burnout." },
    { title: "Slow Down", body: "Life is fast. Sleep is slow. Enjoy the slow." },
    { title: "Deep Dive", body: "Dive deep into the ocean of sleep." },
    { title: "Night Rhythm", body: "Sync with the rhythm of the night." },
    { title: "Sleep Sanctuary", body: "Make your bed your sanctuary." },
    { title: "Peace Out", body: "Peace out for the night." },
    { title: "Do Not Disturb", body: "Put your internal sign to 'Do Not Disturb'." },
    { title: "Hibernate", body: "A mini-hibernation for the night." },
    { title: "Snooze Button", body: "Tonight, you don't need a snooze button. Just sleep." },
    { title: "Dream Team", body: "Join the dream team in your sleep." },
    { title: "Cloud Nine", body: "Float on cloud nine tonight." },
    { title: "Restful warrior", body: "Even warriors need to rest their swords." },
    { title: "Night Patrol", body: "The night patrol is on duty. You can sleep." },
    { title: "Safe Harbor", body: "Your bed is your safe harbor." },
    { title: "Anchor Down", body: "Drop anchor and rest for the night." },
    { title: "Sailing Dreams", body: "Sail away to the land of nod." }
];

export default function RestPage() {
    const router = useRouter();
    const [message, setMessage] = useState(MESSAGES[0]);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        // Pick random message
        const random = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
        setMessage(random);
    }, []);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const target = new Date();

            // Set target to 7 AM
            target.setHours(7, 0, 0, 0);

            // If it's already past 7 AM, target is tomorrow 7 AM
            if (now > target) {
                target.setDate(target.getDate() + 1);
            }

            const diff = target.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('00:00:00');
                return;
            }

            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTimeLeft(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
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

                <div className="space-y-2">
                    <div className="text-slate-500 text-sm">
                        Access re-opens at 07:00 AM
                    </div>
                    {timeLeft && (
                        <div className="text-2xl font-mono text-blue-400 font-bold tracking-wider">
                            {timeLeft}
                        </div>
                    )}
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
