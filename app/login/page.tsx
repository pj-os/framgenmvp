'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Mail, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

function LoginPageContent() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const supabase = createClient()
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        })

        if (error) {
            setMessage(`Error: ${error.message}`)
        } else {
            setMessage('Check your email for the magic link!')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 translate-y-1/2 translate-x-1/2" />
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl -z-10 -translate-y-1/2 -translate-x-1/2" />

            <div className="w-full max-w-lg space-y-8">
                <div className="text-center flex flex-col items-center space-y-2">
                    <Image
                        src="/framgen-logo-full.png"
                        alt="Framgen"
                        width={200}
                        height={60}
                        className="h-12 w-auto mb-6"
                        priority
                    />
                    <h1 className="text-3xl font-bold tracking-tight">
                        Unlock Viral Insights
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-sm">
                        Join the top 1% of creators using data-driven frameworks to dominate LinkedIn & X.
                    </p>
                </div>

                <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl">
                    <CardContent className="pt-6 pb-8 px-8">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Work Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        placeholder="founder@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-background/50 pl-10 h-10 border-foreground/10 focus-visible:ring-primary/20"
                                    />
                                </div>
                            </div>

                            {message && (
                                <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${message.startsWith('Error') ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                    {message.startsWith('Error') ? null : <CheckEmailIcon />}
                                    {message}
                                </div>
                            )}
                            {error && (
                                <div className="p-3 rounded-md text-sm bg-red-500/10 text-red-500">
                                    Authentication error. Please try again.
                                </div>
                            )}

                            <Button type="submit" className="w-full gap-2 h-10 font-semibold shadow-lg shadow-primary/20" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
                                Send Magic Link
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    )
}

function CheckEmailIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
            <LoginPageContent />
        </Suspense>
    )
}
