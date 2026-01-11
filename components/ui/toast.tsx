"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    return <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col p-4 sm:right-0 md:max-w-[420px]">{children}</div>
}

const ToastViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
))
ToastViewport.displayName = "ToastViewport"

const Toast = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" }>(({ className, variant, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
                variant === "destructive" ? "destructive group border-destructive bg-destructive text-destructive-foreground" : "border bg-background text-foreground",
                className
            )}
            {...props}
        />
    )
})
Toast.displayName = "Toast"

const ToastClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ className, ...props }, ref) => (
    <button
        ref={ref}
        className={cn(
            "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-100 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
            className
        )}
        toast-close=""
        {...props}
    >
        <X className="h-4 w-4" />
    </button>
))
ToastClose.displayName = "ToastClose"

const ToastTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("text-sm font-semibold", className)}
        {...props}
    />
))
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("text-sm opacity-90", className)}
        {...props}
    />
))
ToastDescription.displayName = "ToastDescription"

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
type ToastActionElement = React.ReactElement

export {
    type ToastProps,
    type ToastActionElement,
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastDescription,
    ToastClose,
    ToastAction,
}

// Dummy Action component if needed
const ToastAction = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ className, ...props }, ref) => (
    <button ref={ref} className={className} {...props} />
))
ToastAction.displayName = "ToastAction"
