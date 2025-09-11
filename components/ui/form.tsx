import * as React from 'react';
import { FormProvider, Controller } from 'react-hook-form';
import { cn } from '@/lib/utils';

// Shadcn/ui compatible helpers with relaxed types to avoid generics friction

export function Form(props: any) {
  const { children, ...form } = props || {};
  return <FormProvider {...(form || {})}>{children}</FormProvider>;
}

export function FormField(props: any) {
  const { control, name, render } = props;
  return <Controller control={control} name={name} render={({ field, fieldState }) => render({ field, fieldState })} />;
}

export function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-2', className)} {...props} />;
}

export function FormLabel({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)} {...props} />;
}

export function FormControl({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-2', className)} {...props} />;
}

export function FormDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-[0.8rem] text-muted-foreground', className)} {...props} />;
}

export function FormMessage({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return (
    <p className={cn('text-[0.8rem] font-medium text-destructive', className)} {...props}>
      {children}
    </p>
  );
}
