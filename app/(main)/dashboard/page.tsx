'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Post, Category, Platform } from '@/lib/types';
import { PostCard } from '@/components/feed/PostCard';
import { getTopPosts } from '@/lib/ranking';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Filter } from 'lucide-react';
import { RefreshButton } from '@/components/RefreshButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from '@/lib/supabase/client';


interface DashboardProps {
    // We'll pass initial posts from Server Component wrapper if needed
}


export default function Dashboard() {
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [userCategories, setUserCategories] = useState<Category[]>([]);
    const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'All'>('All');

    // Simple automated fetch since we are in Client Component
    useEffect(() => {
        const loadData = async () => {
            const supabase = createClient();

            // 1. Get user profile for categories
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('selected_categories')
                .eq('id', user.id)
                .single();

            if (!profile || !profile.selected_categories || profile.selected_categories.length === 0) {
                router.push('/onboarding');
                return;
            }

            setUserCategories(profile.selected_categories as Category[]);

            // 2. Fetch posts
            try {
                const res = await fetch('/api/posts');
                const data = await res.json();

                // Handle new response format { posts, lastUpdated }
                if (data.posts) {
                    setPosts(data.posts);
                    setLastUpdated(data.lastUpdated);
                } else if (Array.isArray(data)) {
                    // Fallback for array response if API hasn't updated in build
                    setPosts(data);
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };

        loadData();
    }, [router]);

    useEffect(() => {
        if (posts.length === 0 || userCategories.length === 0) return;

        // Filter by categories (using simple string match for MVP categories)
        // The inferCategory in data.ts returns specific strings.
        let relevant = posts.filter(p => userCategories.includes(p.category as Category) || p.category === 'Business'); // Fallback to Business if relevant

        let finalSelection: Post[] = [];

        if (selectedPlatform === 'All') {
            // Take Top 12 from LinkedIn and Top 12 from X
            const linkedinPosts = relevant.filter(p => p.source === 'LinkedIn');
            const xPosts = relevant.filter(p => p.source === 'X');

            const topLinkedin = getTopPosts(linkedinPosts, 12);
            const topX = getTopPosts(xPosts, 12);

            // Merge and sort by performance score to interleave them naturally based on quality
            finalSelection = [...topLinkedin, ...topX].sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0));
        } else {
            // Filter by selected platform
            const sourcePosts = relevant.filter(p => p.source === selectedPlatform);
            // Rank and take Top 12 (or slightly more for single view if desired, but 12 is consistent)
            finalSelection = getTopPosts(sourcePosts, 12);
        }

        setFilteredPosts(finalSelection);

    }, [posts, userCategories, selectedPlatform]);

    const handleUseFramework = (post: Post) => {
        // Navigate to create page with post ID or content passed
        // We can use query param
        const encoded = encodeURIComponent(post.content);
        const encodedId = encodeURIComponent(post.id);
        router.push(`/create?sourceId=${encodedId}`);
    };

    if (loading) {
        return <LoadingScreen categories={userCategories} />;
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                <header className="space-y-4 md:space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-bold tracking-tight">Trending Now</h1>
                                <RefreshButton />
                            </div>
                            {lastUpdated && (
                                <p className="text-xs text-muted-foreground w-full">
                                    Last updated: {new Date(lastUpdated).toLocaleString()}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Filter size={14} />
                                        {selectedPlatform === 'All' ? 'All Sources' : selectedPlatform}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setSelectedPlatform('All')}>
                                        All Sources
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedPlatform('LinkedIn')}>
                                        LinkedIn
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedPlatform('X')}>
                                        X (Twitter)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                        <span className="text-muted-foreground mr-2 text-sm">Monitoring:</span>
                        {userCategories.map(cat => (
                            <Badge key={cat} variant="outline" className="text-xs">
                                {cat}
                            </Badge>
                        ))}
                        <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => router.push('/onboarding')}>
                            Edit
                        </Button>
                    </div>
                </header>

                <section className="space-y-6">
                    {filteredPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                            {filteredPosts.map((post, index) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    rank={index + 1}
                                    index={index}
                                    onUseFramework={handleUseFramework}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-muted-foreground">
                            No trending posts found for your categories right now.
                        </div>
                    )}
                </section>
            </div >
        </div >
    );
}
