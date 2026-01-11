import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Post } from '@/lib/types';
import { MessageCircle, Share2, ThumbsUp, ArrowRight, Sparkles, Linkedin, Twitter, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function formatDate(isoString: string) {
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
        return 'Recently';
    }
}

const XLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const PlatformIcon = ({ platform, className }: { platform: string, className?: string }) => {
    if (platform === 'LinkedIn') return <Linkedin className={className} size={14} />;
    if (platform === 'X') return <XLogo className={className} />;
    return <FileText className={className} size={14} />;
};

interface PostCardProps {
    post: Post;
    onUseFramework: (post: Post) => void;
    rank?: number;
    index: number;
}

export function PostCard({ post, onUseFramework, rank, index }: PostCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="h-full"
        >
            <Card className="h-full flex flex-col border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-xl hover:shadow-2xl transition-all duration-300 dark:border-white/5 dark:hover:border-primary/20 hover:border-primary/20 group relative overflow-hidden">

                {/* Decorative rank gradient */}
                {rank && (
                    <div className="absolute top-0 right-0 p-3 z-10">
                        <Badge variant="outline" className="bg-background/50 backdrop-blur border-primary/20 text-primary font-mono text-xs shadow-sm">
                            #{rank}
                        </Badge>
                    </div>
                )}

                <CardHeader className="pb-3 flex flex-row items-start space-y-0 pt-5 px-5">
                    <div className="flex gap-3 items-center w-full">
                        <div className="relative">
                            <a href={post.authorUrl || "#"} target="_blank" rel="noopener noreferrer" className="block cursor-pointer transition-transform hover:scale-105">
                                <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                                    <AvatarImage src={post.authorImage} alt={post.author} className="object-cover" />
                                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                                        {post.author[0]}
                                    </AvatarFallback>
                                </Avatar>
                            </a>
                            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm border border-border">
                                <PlatformIcon platform={post.source} className="text-muted-foreground w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                                <a href={post.authorUrl || "#"} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-primary/50 underline-offset-2">
                                    <span className="font-semibold text-sm truncate leading-tight">{post.author}</span>
                                </a>

                            </div>
                            <span className="text-[11px] text-muted-foreground font-medium flex gap-1.5 items-center mt-0.5">
                                {post.authorFollowers && (
                                    <>
                                        <span className="text-foreground/80 font-semibold">{new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(post.authorFollowers)} followers</span>
                                        <span className="text-[9px] opacity-50">•</span>
                                    </>
                                )}
                                <span>{post.source}</span>
                                <span className="text-[9px] opacity-50">•</span>
                                <span>{formatDate(post.date)}</span>
                            </span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pb-3 flex-grow px-5 pt-0">
                    <div className="relative group/text cursor-pointer" onClick={() => document.getElementById(`dialog-${post.id}`)?.click()}>
                        <div className="bg-gradient-to-br from-muted/50 to-transparent p-3 rounded-lg border border-primary/5 hover:border-primary/10 transition-colors">
                            <p className="text-sm leading-relaxed line-clamp-6 text-foreground/90 whitespace-pre-line font-normal">
                                {post.content}
                            </p>
                        </div>
                        {/* Gradient Mask for text */}
                        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-muted/10 to-transparent pointer-events-none rounded-b-lg" />
                    </div>

                    {/* Dialog Trigger Hidden/Custom - using ID as trigger mechanism is a bit hacky but works for keeping trigger separate */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button id={`dialog-${post.id}`} variant="ghost" className="hidden">Open</Button>
                        </DialogTrigger>
                        <DialogTrigger asChild>
                            <Button variant="link" className="px-0 h-auto text-[11px] font-medium text-primary/80 hover:text-primary mt-2 ml-1">
                                Read full post
                                <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto sm:rounded-2xl border-primary/10 bg-background/95 backdrop-blur-3xl shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={post.authorImage} />
                                        <AvatarFallback>{post.author[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-base">{post.author}</span>
                                        <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                                            {formatDate(post.date)} on <Badge variant="outline" className="text-[10px] h-4 py-0 px-1">{post.source}</Badge>
                                        </span>
                                    </div>
                                </DialogTitle>
                            </DialogHeader>
                            <div className="mt-4 whitespace-pre-line leading-relaxed text-sm md:text-base border-l-2 border-primary/20 pl-4 py-1">
                                {post.content}
                            </div>
                            <div className="flex gap-6 mt-6 pt-4 border-t text-muted-foreground text-sm font-medium">
                                <div className="flex items-center gap-2 transition-colors hover:text-foreground">
                                    <ThumbsUp size={18} className="text-blue-500/80" />
                                    {post.likes} <span className="hidden sm:inline text-xs font-normal">Likes</span>
                                </div>
                                <div className="flex items-center gap-2 transition-colors hover:text-foreground">
                                    <MessageCircle size={18} className="text-green-500/80" />
                                    {post.comments} <span className="hidden sm:inline text-xs font-normal">Comments</span>
                                </div>
                                <div className="flex items-center gap-2 transition-colors hover:text-foreground">
                                    <Share2 size={18} className="text-orange-500/80" />
                                    {post.shares} <span className="hidden sm:inline text-xs font-normal">Shares</span>
                                </div>
                            </div>
                            <DialogFooter className="mt-6 md:mt-8">
                                <Button
                                    onClick={() => onUseFramework(post)}
                                    className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300"
                                    size="lg"
                                >
                                    <Sparkles size={18} />
                                    Generate Content from this Idea
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <div className="flex gap-4 mt-4 text-muted-foreground text-xs font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1.5" title="Likes">
                            <ThumbsUp size={14} className="group-hover:text-blue-500 transition-colors" />
                            {post.likes}
                        </div>
                        <div className="flex items-center gap-1.5" title="Comments">
                            <MessageCircle size={14} className="group-hover:text-green-500 transition-colors" />
                            {post.comments}
                        </div>
                        <div className="flex items-center gap-1.5" title="Shares">
                            <Share2 size={14} className="group-hover:text-orange-500 transition-colors" />
                            {post.shares}
                        </div>
                        {post.performanceLabel && (
                            <Badge variant="outline" className={cn(
                                "text-[9px] h-4 px-1 py-0 border-0 font-medium ml-auto",
                                post.performanceLabel === 'High' ? "bg-green-500/10 text-green-500" :
                                    post.performanceLabel === 'Medium' ? "bg-yellow-500/10 text-yellow-500" :
                                        "bg-red-500/10 text-red-500"
                            )}>
                                {post.performanceLabel} Perf.
                            </Badge>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="pt-0 px-5 pb-5">
                    <Button
                        onClick={() => onUseFramework(post)}
                        className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md hover:shadow-primary/20 hover:scale-[1.02] transition-all duration-300 rounded-lg group/btn h-10"
                        size="sm"
                    >
                        <Sparkles size={14} className="transition-transform group-hover/btn:rotate-12" />
                        Use Framework
                        <ArrowRight size={14} className="ml-auto opacity-70 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
