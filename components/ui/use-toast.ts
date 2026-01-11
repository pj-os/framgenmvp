"use client"

import * as React from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = any

let count = 0

function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER
    return count.toString()
}

type ActionType = {
    ADD_TOAST: "ADD_TOAST"
    UPDATE_TOAST: "UPDATE_TOAST"
    DISMISS_TOAST: "DISMISS_TOAST"
    REMOVE_TOAST: "REMOVE_TOAST"
}

let memoryState: any = { toasts: [] }

export function toast({ ...props }: any) {
    // Simplified console-log fallback if component not mounted or just for this MVP step
    // But we will implement the hook properly below
    const id = genId()
    const update = (props: any) => dispatch({
        type: "UPDATE_TOAST",
        toast: { ...props, id },
    })
    const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

    dispatch({
        type: "ADD_TOAST",
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open: boolean) => {
                if (!open) dismiss()
            },
        },
    })

    return {
        id: id,
        dismiss,
        update,
    }
}

function dispatch(action: any) {
    memoryState = reducer(memoryState, action)
    listeners.forEach((listener) => {
        listener(memoryState)
    })
}

const listeners: Array<(state: any) => void> = []

function reducer(state: any, action: any) {
    switch (action.type) {
        case "ADD_TOAST":
            return {
                ...state,
                toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
            }
        case "UPDATE_TOAST":
            return {
                ...state,
                toasts: state.toasts.map((t: any) =>
                    t.id === action.toast.id ? { ...t, ...action.toast } : t
                ),
            }
        case "DISMISS_TOAST":
            // For MVP we just remove
            return {
                ...state,
                toasts: state.toasts.filter((t: any) => t.id !== action.toastId),
            }
        case "REMOVE_TOAST":
            return {
                ...state,
                toasts: state.toasts.filter((t: any) => t.id !== action.toastId),
            }
    }
}

export function useToast() {
    const [state, setState] = React.useState<any>(memoryState)

    React.useEffect(() => {
        listeners.push(setState)
        return () => {
            const index = listeners.indexOf(setState)
            if (index > -1) {
                listeners.splice(index, 1)
            }
        }
    }, [state])

    return {
        ...state,
        toast,
        dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
    }
}
