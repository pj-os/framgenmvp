'use client'

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, ArrowRight, Trash2, Calendar } from 'lucide-react';

interface Draft {
    id: string;
    topic: string;
    framework: string;
    content: string;
    title: string;
    updated_at: string;
}

export default function DraftsPage() {
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchDrafts = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('drafts')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (data) {
                setDrafts(data);
            }
            setLoading(false);
        };

        fetchDrafts();
    }, [router, supabase]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent card click
        if (!confirm('Are you sure you want to delete this draft?')) return;

        setDrafts(d => d.filter(x => x.id !== id));
        await supabase.from('drafts').delete().eq('id', id);
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
            <div className="max-w-6xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">My Drafts</h1>
                    <p className="text-muted-foreground">Continue working on your saved ideas.</p>
                </header>

                {drafts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {drafts.map(draft => (
                            <Card
                                key={draft.id}
                                className="group cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
                                onClick={() => router.push(`/create?draftId=${draft.id}`)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <CardTitle className="text-lg line-clamp-2 leading-tight">
                                            {draft.title || draft.topic || "Untitled Draft"}
                                        </CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => handleDelete(e, draft.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar size={12} />
                                        {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-muted/10 p-3 rounded-md border border-border/50 h-24 overflow-hidden relative">
                                        <p className="text-sm text-foreground/80 line-clamp-3 whitespace-pre-line">
                                            {draft.content || "Empty draft..."}
                                        </p>
                                        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-background/10 to-transparent" />
                                    </div>
                                    {draft.framework && (
                                        <p className="mt-3 text-xs text-muted-foreground line-clamp-1">
                                            <span className="font-semibold text-primary">Framework:</span> {draft.framework}
                                        </p>
                                    )}
                                </CardContent>
                                <CardFooter className="pt-0 justify-end">
                                    <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary group-hover:underline">
                                        Continue Editing <ArrowRight size={12} />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/5">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground/20 mb-4" />
                        <h3 className="text-lg font-medium">No drafts yet</h3>
                        <p className="text-muted-foreground mb-6">Start creating content to save your first draft.</p>
                        <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
