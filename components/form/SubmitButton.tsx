'use client';

import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';

export function SubmitButton({
  children,
  pendingText,
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
        'bg-primary text-primary-foreground hover:opacity-90',
        className,
      )}
    >
      {pending ? pendingText ?? 'Please wait…' : children}
    </button>
  );
}
