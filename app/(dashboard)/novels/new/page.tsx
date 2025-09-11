import { redirect } from 'next/navigation';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from '@/lib/auth';
import { NovelForm, type NovelFormValues } from '@/components/novels/novel-form';

export default async function NewNovelPage() {
  // In a real app, you would get the request and response objects from the page props
  // For now, we'll use empty objects as placeholders
  const req = {} as NextApiRequest;
  const res = {} as NextApiResponse;
  const session = await getServerSession(req, res);
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const handleSubmit = async (data: NovelFormValues) => {
    'use server';
    
    try {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch('/api/novels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 'Failed to create novel. Please try again.'
        );
      }

      const result = await response.json();
      const novel = result?.success ? result.data : null;
      if (!novel?.id) {
        throw new Error('Unexpected response from server.');
      }
      redirect(`/novels/${novel.id}`);
    } catch (error) {
      console.error('Error creating novel:', error);
      throw error; // This will be caught by the form's error handling
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Novel</h1>
        <p className="text-muted-foreground">
          Fill in the details below to start your new novel
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <NovelForm 
          onSubmit={async (data) => {
            await handleSubmit(data);
            redirect('/novels');
          }}
          submitButtonText="Create Novel"
          defaultValues={{
            title: '',
            description: '',
            genre: [],
            status: 'draft',
            coverImageUrl: ''
          }}
        />
      </div>
    </div>
  );
}
