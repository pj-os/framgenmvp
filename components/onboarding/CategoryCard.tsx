import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Category } from '@/lib/types';
import { Briefcase, Rocket, TrendingUp, Cpu, Code, Megaphone, PenTool, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface CategoryCardProps {
    category: Category;
    selected: boolean;
    onClick: () => void;
    index: number;
}

const icons: Record<Category, React.ElementType> = {
    'Business': Briefcase,
    'Startup': Rocket,
    'Finance': TrendingUp,
    'AI': Cpu,
    'Software Development': Code,
    'Marketing': Megaphone,
    'Design': PenTool,
    'Productivity': Zap,
};

export function CategoryCard({ category, selected, onClick, index }: CategoryCardProps) {
    const Icon = icons[category];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                duration: 0.3,
                delay: index * 0.05,
                ease: "easeOut"
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <Card
                onClick={onClick}
                className={cn(
                    "cursor-pointer transition-all duration-300 flex flex-col items-center justify-center p-6 gap-4 border h-full backdrop-blur-sm relative overflow-hidden group",
                    selected
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 ring-1 ring-primary/50"
                        : "border-primary/5 bg-background/40 hover:bg-background/60 hover:border-primary/20 hover:shadow-md"
                )}
            >
                {/* Decorative background glow for selected state */}
                {selected && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                )}

                <div className={cn(
                    "p-4 rounded-2xl transition-all duration-300 relative z-10",
                    selected
                        ? "bg-primary text-primary-foreground shadow-sm scale-110"
                        : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                    <Icon size={28} strokeWidth={1.5} />
                </div>
                <span className={cn(
                    "font-medium text-sm text-center relative z-10 transition-colors duration-300",
                    selected ? "text-primary font-semibold" : "text-muted-foreground group-hover:text-foreground"
                )}>
                    {category}
                </span>
            </Card>
        </motion.div>
    );
}
