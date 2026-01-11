'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, User as UserIcon, FileText, LayoutDashboard } from "lucide-react"

export function GlobalHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full px-4 md:px-8">
                <div className="flex h-16 items-center justify-between max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2">
                            <Image
                                src="/framgen-logo-full.png"
                                alt="Framgen"
                                width={150}
                                height={40}
                                className="h-8 w-auto object-contain"
                                priority
                            />
                        </Link>

                        {user && (
                            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                                <Link
                                    href="/dashboard"
                                    className={`flex items-center gap-2 transition-colors hover:text-foreground/80 ${pathname === '/dashboard' ? 'text-foreground' : 'text-foreground/60'}`}
                                >
                                    <LayoutDashboard size={16} />
                                    Dashboard
                                </Link>
                                <Link
                                    href="/drafts"
                                    className={`flex items-center gap-2 transition-colors hover:text-foreground/80 ${pathname === '/drafts' ? 'text-foreground' : 'text-foreground/60'}`}
                                >
                                    <FileText size={16} />
                                    Drafts
                                </Link>
                            </nav>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                                            <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">Account</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        <span>Dashboard</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push('/drafts')}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        <span>Drafts</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <UserIcon className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button size="sm" onClick={() => router.push('/login')}>Sign In</Button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
