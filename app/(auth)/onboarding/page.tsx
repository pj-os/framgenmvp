'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CategoryCard } from '@/components/onboarding/CategoryCard';
import { Category } from '@/lib/types';

const CATEGORIES: Category[] = [
    'Business', 'Startup', 'Finance', 'AI',
    'Software Development', 'Marketing', 'Design', 'Productivity'
];

export default function OnboardingPage() {
    const router = useRouter();
    const [selected, setSelected] = useState<Category[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load from local storage if exists
        const saved = localStorage.getItem('framgen_categories');
        if (saved) {
            try {
                setSelected(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved categories");
            }
        }
    }, []);

    const toggleCategory = (cat: Category) => {
        if (selected.includes(cat)) {
            setSelected(selected.filter(c => c !== cat));
        } else {
            if (selected.length < 5) {
                setSelected([...selected, cat]);
            }
        }
    };

    const handleContinue = () => {
        localStorage.setItem('framgen_categories', JSON.stringify(selected));
        localStorage.setItem('framgen_onboarded', 'true');
        router.push('/dashboard');
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-20 px-4">
            <div className="max-w-4xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                        What interests you?
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Choose up to 5 categories to personalize your content trend feed.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 w-full max-w-5xl">
                    {CATEGORIES.map((cat, i) => (
                        <CategoryCard
                            key={cat}
                            category={cat}
                            index={i}
                            selected={selected.includes(cat)}
                            onClick={() => toggleCategory(cat)}
                        />
                    ))}
                </div>

                <div className="flex flex-col items-center gap-6 mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-forwards">
                    <div className="flex flex-col items-center gap-2">
                        <div className="text-sm font-medium text-muted-foreground bg-secondary/50 px-4 py-1 rounded-full border border-border">
                            {selected.length} / 5 selected
                        </div>
                        {selected.length === 0 && (
                            <p className="text-xs text-muted-foreground opacity-70">Pick at least one to continue</p>
                        )}
                    </div>

                    <Button
                        size="lg"
                        className="w-full md:w-auto min-w-[240px] text-lg h-14 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
                        disabled={selected.length === 0}
                        onClick={handleContinue}
                    >
                        Continue to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
}
