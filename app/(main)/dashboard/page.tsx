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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface DashboardProps {
    // We'll pass initial posts from Server Component wrapper if needed
}


export default function Dashboard() {
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [userCategories, setUserCategories] = useState<Category[]>([]);
    const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'All'>('All');

    // Simple automated fetch since we are in Client Component
    useEffect(() => {
        // 1. Get user preferences
        const savedCats = localStorage.getItem('framgen_categories');
        if (!savedCats) {
            router.push('/onboarding');
            return;
        }
        const categories: Category[] = JSON.parse(savedCats);
        setUserCategories(categories);

        // 2. Fetch posts (from an API route we need to create, or just filtering a server-passed prop? 
        // Since we need to read the JSON file, we MUST use a Server Action or API Route.
        // Let's assume we created /api/posts route or use a server action. 
        // For simplicity, let's create a server action in a separate file or use fetch to an API.
        // I will use fetch('/api/posts').

        fetch('/api/posts')
            .then(res => res.json())
            .then((data: Post[]) => {
                setPosts(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
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
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                <header className="space-y-4 md:space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">Trending Now</h1>
                            <RefreshButton />
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
            </div>
        </div>
    );
}
