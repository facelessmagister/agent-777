import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { Button } from '@/components/ui/button';

async function createDocument(novelId: string, payload: { title: string; type: 'chapter'|'character'|'world'|'note' }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/novels/${novelId}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to create document');
  }
  const data = await res.json();
  return data?.success ? data.data : null;
}

export default async function NewDocumentPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  async function createAction(formData: FormData) {
    'use server';
    const title = String(formData.get('title') || '').trim();
    const type = String(formData.get('type') || 'note') as 'chapter'|'character'|'world'|'note';
    if (!title) throw new Error('Title is required');
    const created = await createDocument(params.id, { title, type });
    if (!created?.id) throw new Error('Unexpected response from server');
    redirect(`/novels/${params.id}/documents/${created.id}`);
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <form action={createAction} className="space-y-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold">New Document</h1>
        <div className="grid gap-2">
          <label htmlFor="title" className="text-sm font-medium">Title</label>
          <input id="title" name="title" className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Document title" />
        </div>
        <div className="grid gap-2">
          <label htmlFor="type" className="text-sm font-medium">Type</label>
          <select id="type" name="type" className="w-full rounded-md border px-3 py-2 text-sm capitalize">
            <option value="chapter">Chapter</option>
            <option value="character">Character</option>
            <option value="world">World</option>
            <option value="note">Note</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="submit">Create</Button>
          <Button type="button" variant="outline" onClick={() => history.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
