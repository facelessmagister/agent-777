'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function NovelCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="p-6 pt-0 space-y-2">
        <div className="flex flex-wrap gap-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-32 mt-2" />
      </div>
      <div className="p-6 pt-0 flex justify-between">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-9 w-16" />
      </div>
    </div>
  );
}

export default NovelCardSkeleton;
