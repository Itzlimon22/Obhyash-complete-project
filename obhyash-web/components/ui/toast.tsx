import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitives.Provider;

/* ── Viewport ──────────────────────────────────────────────────────────── */
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      // Position: top on mobile, bottom-right on desktop
      'fixed top-4 left-4 right-4 z-[100] flex flex-col gap-2',
      'sm:top-auto sm:bottom-5 sm:right-5 sm:left-auto sm:max-w-[400px] sm:w-full',
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

/* ── Variants ──────────────────────────────────────────────────────────── */
const toastVariants = cva(
  [
    // Base layout
    'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden',
    'rounded-2xl border px-4 py-3.5 pr-10 shadow-xl',
    // Transitions
    'transition-all duration-300',
    // Swipe-to-dismiss
    'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
    'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
    // Enter/leave animations
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-80',
    'data-[state=open]:slide-in-from-top-full sm:data-[state=open]:slide-in-from-bottom-full',
    'data-[state=closed]:slide-out-to-right-full',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          // Surface
          'bg-white dark:bg-neutral-950',
          'border-neutral-200 dark:border-neutral-800',
          // Left accent stripe — deep green
          'before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:rounded-l-2xl before:bg-emerald-700',
        ].join(' '),

        destructive: [
          // Surface
          'bg-white dark:bg-neutral-950',
          'border-neutral-200 dark:border-neutral-800',
          // Left accent stripe — red
          'before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:rounded-l-2xl before:bg-red-600',
        ].join(' '),

        success: [
          'bg-white dark:bg-neutral-950',
          'border-neutral-200 dark:border-neutral-800',
          'before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:rounded-l-2xl before:bg-emerald-700',
        ].join(' '),

        warning: [
          'bg-white dark:bg-neutral-950',
          'border-neutral-200 dark:border-neutral-800',
          'before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:rounded-l-2xl before:bg-red-700',
        ].join(' '),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
));
Toast.displayName = ToastPrimitives.Root.displayName;

/* ── Action button ─────────────────────────────────────────────────────── */
const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-7 shrink-0 items-center justify-center rounded-lg border border-neutral-300 dark:border-neutral-700',
      'bg-transparent px-3 text-xs font-semibold text-neutral-700 dark:text-neutral-300',
      'transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800',
      'focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:ring-offset-1',
      'disabled:pointer-events-none disabled:opacity-50',
      // Destructive context
      'group-[.destructive]:border-red-300 dark:group-[.destructive]:border-red-800',
      'group-[.destructive]:text-red-700 dark:group-[.destructive]:text-red-400',
      'group-[.destructive]:hover:bg-red-50 dark:group-[.destructive]:hover:bg-red-950',
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

/* ── Close button ──────────────────────────────────────────────────────── */
const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-2.5 top-2.5 rounded-lg p-1',
      'text-neutral-400 opacity-0 transition-all',
      'hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800',
      'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-emerald-800',
      'group-hover:opacity-100',
      // Destructive close
      'group-[.destructive]:text-red-500 group-[.destructive]:hover:text-red-700',
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

/* ── Title ─────────────────────────────────────────────────────────────── */
const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      'text-sm font-bold leading-snug text-neutral-900 dark:text-white',
      className,
    )}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

/* ── Description ───────────────────────────────────────────────────────── */
const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(
      'text-xs leading-relaxed text-neutral-500 dark:text-neutral-400 mt-0.5',
      className,
    )}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastActionElement = React.ReactElement<
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>;

export {
  type ToastActionElement,
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
};
