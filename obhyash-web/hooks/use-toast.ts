// Simple implementation of the shadcn toast hook
import * as React from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 10000

type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToasterToast[]>([])

  const toast = ({ ...props }: Omit<ToasterToast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [{ id, ...props }, ...prev].slice(0, TOAST_LIMIT))
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, TOAST_REMOVE_DELAY)
  }

  return {
    toast,
    toasts,
  }
}