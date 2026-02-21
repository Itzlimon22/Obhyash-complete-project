'use client';

import { useToast } from '@/hooks/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

/* ── Per-variant icon badges ───────────────────────────────────────────── */
function SuccessIcon() {
  return (
    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-700 text-white">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-4 h-4"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

function ErrorIcon() {
  return (
    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-red-600 text-white">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-4 h-4"
        aria-hidden="true"
      >
        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
      </svg>
    </div>
  );
}

function WarningIcon() {
  return (
    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-red-700 text-white">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-4 h-4"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

function InfoIcon() {
  return (
    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-4 h-4"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

type ToastVariant = 'default' | 'destructive' | 'success' | 'warning';

function ToastIcon({ variant }: { variant?: ToastVariant | null }) {
  switch (variant) {
    case 'destructive':
      return <ErrorIcon />;
    case 'success':
      return <SuccessIcon />;
    case 'warning':
      return <WarningIcon />;
    default:
      return <InfoIcon />;
  }
}

/* ── Toaster ───────────────────────────────────────────────────────────── */
export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <Toast key={id} variant={variant as ToastVariant} {...props}>
          {/* Icon badge */}
          <ToastIcon variant={variant as ToastVariant} />

          {/* Text content */}
          <div className="flex-1 min-w-0 pl-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
            {action && <div className="mt-2">{action}</div>}
          </div>

          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
