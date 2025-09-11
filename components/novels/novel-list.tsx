'use client';

import { useEffect, useState } from 'react';
import type { Novel } from '@/lib/db/novel-schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import NovelCardSkeleton from '@/components/novels/novel-card-skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Edit, FileText, Plus } from 'lucide-react';

export function NovelList({ userId }: { userId: string }) {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Stable keys for loading skeletons to avoid using array indices as keys
  const skeletonKeys = ['novel-skeleton-1', 'novel-skeleton-2', 'novel-skeleton-3', 'novel-skeleton-4'];

  useEffect(() => {
    async function fetchNovels() {
      try {
        const response = await fetch(`/api/novels`, {
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch novels');
        }
        const data = await response.json();
        setNovels(data?.success ? (data.data ?? []) : []);
      } catch (err) {
        console.error('Error fetching novels:', err);
        setError('Failed to load novels. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchNovels();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {skeletonKeys.map((key) => (
          <NovelCardSkeleton key={key} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
        <p>{error}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!novels?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <FileText className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No novels yet</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new novel.</p>
        <Button className="mt-4" asChild>
          <Link href="/novels/new">
            <Plus className="mr-2 h-4 w-4" />
            New Novel
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {novels.map((novel) => (
        <NovelCard key={novel.id} novel={novel} />
      ))}
    </div>
  );
}

function NovelCard({ novel }: { novel: Novel }) {
  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="truncate text-lg">{novel.title}</CardTitle>
        <CardDescription className="line-clamp-2 h-10">
          {novel.description || 'No description'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex flex-wrap gap-1 mb-2">
          {novel.genre?.slice(0, 3).map((genre) => (
            <span 
              key={genre} 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {genre}
            </span>
          ))}
          {novel.genre && novel.genre.length > 3 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              +{novel.genre.length - 3} more
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date(novel.updatedAt).toLocaleDateString()}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/novels/${novel.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/novels/${novel.id}`}>
            <FileText className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

