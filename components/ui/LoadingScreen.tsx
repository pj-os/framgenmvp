'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category } from '@/lib/types';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
    categories?: Category[];
}

export function LoadingScreen({ categories = [] }: LoadingScreenProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        "Initializing secure connection to social feeds...",
        "Scouting X (Twitter) and LinkedIn for viral signals...",
        categories.length > 0
            ? `Analyzing engagement metrics for ${categories.slice(0, 2).join(', ')}${categories.length > 2 ? '...' : ''}`
            : "Analyzing engagement metrics for your niche...",
        "Filtering noise to extract high-performing trends...",
        "Synthesizing insights into actionable frameworks...",
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev + 1) % steps.length);
        }, 2000); // Change text every 2 seconds

        return () => clearInterval(interval);
    }, [steps.length]);

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
            <div className="bg-card w-full max-w-md p-8 rounded-xl shadow-2xl border border-border/50 relative overflow-hidden">
                {/* Background ambient glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

                <div className="flex flex-col items-center text-center space-y-6">
                    {/* Animated Icon */}
                    <motion.div
                        animate={{
                            rotate: 360,
                            scale: [1, 1.1, 1]
                        }}
                        transition={{
                            rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
                        <Sparkles className="w-12 h-12 text-primary relative z-10" />
                    </motion.div>

                    {/* Text Carousel */}
                    <div className="h-16 w-full flex items-center justify-center relative">
                        <AnimatePresence mode='wait'>
                            <motion.p
                                key={currentStep}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="text-lg font-medium text-foreground absolute w-full"
                            >
                                {steps[currentStep]}
                            </motion.p>
                        </AnimatePresence>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-secondary/50 h-1.5 rounded-full overflow-hidden">
                        <motion.div
                            className="bg-primary h-full rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{
                                duration: 8, // Roughly total estimated load time
                                ease: "easeInOut"
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
