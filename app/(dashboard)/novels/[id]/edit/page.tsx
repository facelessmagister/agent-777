import { notFound, redirect } from 'next/navigation';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Novel } from '@/lib/db/novel-schema';
import { getServerSession } from '@/lib/auth';
import { NovelForm, type NovelFormValues } from '@/components/novels/novel-form';

export default async function EditNovelPage({ params }: { params: { id: string } }) {
  // In a real app, you would get the request and response objects from the page props
  // For now, we'll use empty objects as placeholders
  const req = {} as NextApiRequest;
  const res = {} as NextApiResponse;
  const session = await getServerSession(req, res);
  
  if (!session?.user?.id) {
    return notFound();
  }
  
  const userId = session.user.id;

  // Fetch the novel data
  let novel: Novel | null = null;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/novel/${params.id}?userId=${userId}`,
      {
        next: { tags: [`novel-${params.id}`] },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error('Failed to fetch novel');
    }

    novel = await response.json();

    // Ensure the user owns this novel
    if (novel?.userId !== session.user.id) {
      return notFound();
    }
  } catch (error) {
    console.error('Error in EditNovelPage:', error);
    throw error; // This will be caught by Next.js error boundary
  }

  const handleSubmit = async (data: NovelFormValues) => {
    'use server';
    
    try {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`/api/novel/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          id: params.id,
          userId: session.user.id,
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 'Failed to update novel. Please try again.'
        );
      }

      // No need to return anything since we're using redirect
    } catch (error) {
      console.error('Error updating novel:', error);
      throw error; // This will be caught by the form's error handling
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Novel</h1>
        <p className="text-muted-foreground">Make changes to your novel here</p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <NovelForm 
          defaultValues={{
            title: novel.title,
            description: novel.description || '',
            genre: novel.genre || [],
            status: novel.status || 'draft',
            coverImageUrl: novel.coverImageUrl || ''
          }}
          onSubmit={async (data) => {
            await handleSubmit(data);
            redirect(`/novels/${params.id}`);
          }}
          submitButtonText="Save Changes"
        />
      </div>
    </div>
  );
}
