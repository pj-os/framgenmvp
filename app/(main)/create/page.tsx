'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Post } from '@/lib/types';
import { analyzePost, generateIdeas } from '@/lib/gemini';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, ArrowLeft, Wand2, Copy, PenLine, Quote, Lightbulb, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { createClient } from '@/lib/supabase/client';
import { Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { rewritePost } from '@/lib/gemini';
import { AlignLeft, Maximize2, Zap, ChevronDown } from 'lucide-react';

function CreatePageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sourceId = searchParams.get('sourceId');
    const draftId = searchParams.get('draftId'); // Check for draftId
    const { toast } = useToast();

    const [sourcePost, setSourcePost] = useState<Post | null>(null);
    const [framework, setFramework] = useState<string>("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [topic, setTopic] = useState("");
    const [generatedIdeas, setGeneratedIdeas] = useState<Array<{ title: string, content: string }>>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const [draft, setDraft] = useState("");
    const [copied, setCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isRewriting, setIsRewriting] = useState(false);

    const supabase = createClient();

    const formatText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="text-foreground">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    // Load Source Post
    useEffect(() => {
        if (sourceId) {
            fetch('/api/posts')
                .then(res => res.json())
                .then((data: Post[]) => {
                    const found = data.find(p => p.id === sourceId);
                    if (found) {
                        setSourcePost(found);
                        // Auto analyze
                        setIsAnalyzing(true);
                        analyzePost(found.content)
                            .then(res => {
                                setFramework(res);
                                setIsAnalyzing(false);
                            })
                            .catch(() => setIsAnalyzing(false));
                    }
                });
        }
    }, [sourceId]);

    // Load Draft
    useEffect(() => {
        if (draftId) {
            const loadDraft = async () => {
                const { data, error } = await supabase.from('drafts').select('*').eq('id', draftId).single();
                if (data) {
                    setDraft(data.content || "");
                    setTopic(data.topic || "");
                    setFramework(data.framework || "");
                    // Ideally we should also try to load the source post if we saved its ID, but for now this is good
                }
            };
            loadDraft();
        }
    }, [draftId, supabase]);

    const handleGenerate = async () => {
        if (!framework || !topic) return;
        setIsGenerating(true);
        setGeneratedIdeas([]);
        try {
            // Pass the source platform to generateIdeas
            const platform = sourcePost?.source || 'LinkedIn';
            // Pass source content for style matching
            const jsonStr = await generateIdeas(framework, topic, platform, sourcePost?.content);
            const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (parsed.ideas && Array.isArray(parsed.ideas)) {
                setGeneratedIdeas(parsed.ideas);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRewrite = async (instruction: 'concise' | 'detailed' | 'punchier') => {
        if (!draft) return;
        setIsRewriting(true);
        try {
            const rewritten = await rewritePost(draft, instruction);
            setDraft(rewritten);
            toast({ title: "Draft rewritten!" });
        } catch (e) {
            toast({ title: "Failed to rewrite", variant: "destructive" });
        } finally {
            setIsRewriting(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(draft);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveDraft = async () => {
        setIsSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast({ title: "Please login to save drafts" });
            setIsSaving(false);
            return;
        }

        const draftData = {
            user_id: user.id,
            content: draft,
            topic: topic,
            framework: framework,
            title: topic || "Untitled Draft",
            updated_at: new Date().toISOString(),
        };

        let result;
        if (draftId) {
            result = await supabase.from('drafts').update(draftData).eq('id', draftId);
        } else {
            // For insert, we don't include ID so it autogenerates, BUT we want to update the URL after saving 
            // so subsequent saves update the same draft.
            result = await supabase.from('drafts').insert(draftData).select().single();
            if (result.data) {
                // Update URL without reload
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('draftId', result.data.id);
                window.history.pushState({}, '', newUrl);
            }
        }

        if (result.error) {
            toast({ title: "Failed to save draft", variant: "destructive" });
        } else {
            toast({ title: "Draft saved!" });
        }
        setIsSaving(false);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
            {/* Left Panel: Inspiration & Framework - Glassmorphic / Sticky */}
            <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full md:w-[40%] lg:w-[35%] bg-muted/20 border-r border-border h-full md:h-screen overflow-y-auto p-6 md:p-8 backdrop-blur-3xl relative"
            >
                {/* Decorative background blobs */}
                <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 rounded-full blur-3xl -z-10 -translate-y-1/2 pointer-events-none" />

                <div className="space-y-8">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-primary/10 -ml-2">
                            <ArrowLeft size={20} />
                        </Button>
                        <h1 className="text-xl font-bold tracking-tight">Strategy Space</h1>
                    </div>

                    {sourcePost ? (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                                    <Sparkles size={14} />
                                    <span>Analyzed Framework</span>
                                </div>

                                {isAnalyzing ? (
                                    <div className="space-y-3 p-4 border border-dashed rounded-lg bg-background/30">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                        <Skeleton className="h-4 w-4/6" />
                                        <p className="text-xs text-center text-muted-foreground pt-2 animate-pulse">Extracting viral pattern...</p>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-gradient-to-br from-primary/10 to-transparent p-5 rounded-xl border border-primary/10 text-sm leading-relaxed shadow-sm"
                                    >
                                        {framework}
                                    </motion.div>
                                )}
                            </div>

                            <Card className="border-0 bg-background/50 shadow-lg backdrop-blur-sm ring-1 ring-border/50">
                                <CardHeader className="pb-3 border-b border-border/10">
                                    <CardTitle className="flex items-center gap-3 text-base">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={sourcePost.authorImage} />
                                            <AvatarFallback>{sourcePost.author[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span>{sourcePost.author}</span>
                                            <span className="text-xs font-normal text-muted-foreground">{sourcePost.source} Inspiration</span>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 text-sm leading-relaxed text-muted-foreground relative">
                                    <Quote className="absolute top-4 left-4 h-8 w-8 text-primary/10 -z-10 transform -scale-x-100" />
                                    <div className="whitespace-pre-wrap pl-2 italic">
                                        {sourcePost.content}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                            {draftId ? (
                                <p>Editing Draft</p>
                            ) : (
                                <>
                                    <p>No source selected.</p>
                                    <Button variant="link" onClick={() => router.push('/dashboard')}>Go back to Dashboard</Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Right Panel: Creation Studio */}
            <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex-1 h-full md:h-screen overflow-y-auto bg-background p-6 md:p-8 relative"
            >
                <div className="max-w-3xl mx-auto space-y-10 pb-20">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight mb-2">Creator Analysis Studio</h2>
                                <p className="text-muted-foreground">Turn insights into your own viral content.</p>
                            </div>
                            {/* Saved Draft button removed from here */}
                        </div>

                        <Card className="border-0 shadow-none bg-secondary/20">
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Lightbulb size={16} className="text-amber-500" />
                                        What's your topic?
                                    </label>
                                    <div className="relative">
                                        <Textarea
                                            placeholder="e.g. My experience transitioning from Senior dev to PM..."
                                            value={topic}
                                            onChange={e => setTopic(e.target.value)}
                                            className="resize-none min-h-[100px] bg-background border-transparent shadow-sm focus-visible:ring-primary/20 text-lg p-4"
                                        />
                                        <div className="absolute bottom-3 right-3">
                                            <Button
                                                onClick={handleGenerate}
                                                disabled={!topic || !framework || isGenerating}
                                                size="sm"
                                                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 rounded-full px-6"
                                            >
                                                {isGenerating ? (
                                                    <span className="flex items-center gap-2">
                                                        <Wand2 className="h-3 w-3 animate-spin" />
                                                        Thinking...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        <Sparkles size={14} />
                                                        Generate Ideas
                                                    </span>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Generated Ideas Column */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-4">
                                Generated Angles
                            </h3>

                            <AnimatePresence>
                                {generatedIdeas.length > 0 ? (
                                    <div className="space-y-4">
                                        {generatedIdeas.map((idea, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="group"
                                            >
                                                <div
                                                    className={`p-5 rounded-xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${draft === idea.content
                                                        ? 'bg-primary/5 border-primary shadow-md ring-1 ring-primary/20'
                                                        : 'bg-card border-border hover:border-primary/30 hover:shadow-sm'
                                                        }`}
                                                    onClick={() => setDraft(idea.content)}
                                                >
                                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm border-0 font-normal">
                                                            Option {i + 1}
                                                        </Badge>
                                                        {draft === idea.content && (
                                                            <CheckCircle2 size={16} className="text-primary animate-in zoom-in" />
                                                        )}
                                                    </div>
                                                    <h4 className="text-sm font-bold mb-2 pr-4">{idea.title}</h4>
                                                    <p className="text-xs text-muted-foreground line-clamp-3">
                                                        {idea.content}
                                                    </p>

                                                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground/40 border-2 border-dashed rounded-xl p-8 bg-muted/5">
                                        <Wand2 size={32} className="mb-4 opacity-20" />
                                        <p className="text-sm text-center">Ideas will appear here after you generate.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Editor Column */}
                        <div className={`space-y-4 transition-all duration-500 ${draft ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4 grayscale blur-[1px]'}`}>
                            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-4 flex items-center justify-between">
                                Editor
                                {draft && <span className="text-[10px] normal-case bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">Active</span>}
                            </h3>

                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-violet-600/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <div className="relative bg-card rounded-xl border shadow-sm flex flex-col h-[500px]">
                                    <div className="flex items-center justify-between p-3 border-b bg-muted/10">
                                        <div className="flex gap-1">
                                            <div className="h-3 w-3 rounded-full bg-red-400/20"></div>
                                            <div className="h-3 w-3 rounded-full bg-yellow-400/20"></div>
                                            <div className="h-3 w-3 rounded-full bg-green-400/20"></div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" disabled={isRewriting || !draft}>
                                                        {isRewriting ? <Loader2 className="animate-spin" size={12} /> : <Zap size={12} />}
                                                        Rewrite <ChevronDown size={10} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleRewrite('concise')}>
                                                        <AlignLeft className="mr-2 h-4 w-4" /> Make it Concise
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleRewrite('detailed')}>
                                                        <Maximize2 className="mr-2 h-4 w-4" /> Make it Detailed
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleRewrite('punchier')}>
                                                        <Zap className="mr-2 h-4 w-4" /> Make it Punchier
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs gap-1.5"
                                                onClick={handleSaveDraft}
                                                disabled={isSaving || !draft}
                                            >
                                                {isSaving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                                                Save
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs gap-1.5 hover:bg-primary/5"
                                                onClick={handleCopy}
                                            >
                                                {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                                                {copied ? "Copied!" : "Copy"}
                                            </Button>
                                        </div>
                                    </div>
                                    <Textarea
                                        value={draft}
                                        onChange={e => setDraft(e.target.value)}
                                        className="flex-1 resize-none border-0 focus-visible:ring-0 p-6 font-mono text-sm leading-7"
                                        placeholder="Select an idea to start editing..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function CreatePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Sparkles className="animate-spin text-primary" /></div>}>
            <CreatePageContent />
        </Suspense>
    );
}
