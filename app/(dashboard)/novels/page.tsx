import { Suspense } from 'react';
import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { NovelList } from '@/components/novels/novel-list';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function NovelsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Novels</h1>
        <Button asChild>
          <Link href="/novels/new">
            <Plus className="mr-2 h-4 w-4" />
            New Novel
          </Link>
        </Button>
      </div>
      
      <Suspense fallback={<NovelListSkeleton />}>
        <NovelList userId={session.user.id} />
      </Suspense>
    </div>
  );
}

function NovelListSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`novel-skeleton-${index}-${Math.random().toString(36).substr(2, 9)}`} className="h-48 rounded-lg border bg-card animate-pulse" />
      ))}
    </div>
  );
}
