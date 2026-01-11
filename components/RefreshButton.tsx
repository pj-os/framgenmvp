'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { refreshTrendingPosts } from '@/actions/refresh';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export function RefreshButton() {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const result = await refreshTrendingPosts();
            if (result.success) {
                toast({
                    title: "Success",
                    description: result.message,
                    variant: "default",
                });
            } else {
                toast({
                    title: "Info",
                    description: result.message,
                    variant: "default", // Using default/blue for info, destructive for errors
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong while refreshing.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-8 w-8 p-0 ml-2"
        >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span className="sr-only">Refresh Data</span>
        </Button>
    );
}
