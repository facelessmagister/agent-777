type ToastOptions = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
};

export function toast({ title, description, variant }: ToastOptions) {
  // Minimal no-op toast shim for development. Replace with your UI toast system.
  const prefix = variant === 'destructive' ? '[Error]' : variant ? `[${variant}]` : '[Toast]';
  if (title) console.log(prefix, title);
  if (description) console.log(description);
}
