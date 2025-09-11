import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { EditorField } from '@/components/editor/EditorField';
import { Button } from '@/components/ui/button';

async function getDocument(novelId: string, docId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/novels/${novelId}/documents/${docId}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.success ? data.data : null;
}

async function updateDocument(novelId: string, docId: string, payload: { title?: string; content?: any; metadata?: any }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/novels/${novelId}/documents/${docId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update document');
  const data = await res.json();
  return data?.success ? data.data : null;
}

async function getVersions(novelId: string, docId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/novels/${novelId}/documents/${docId}/versions`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data?.success ? data.data : [];
}

async function restoreVersion(novelId: string, docId: string, version: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/novels/${novelId}/documents/${docId}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version }),
  });
  if (!res.ok) throw new Error('Failed to restore version');
  const data = await res.json();
  return data?.success ? data.data : null;
}

export default async function DocumentEditorPage({ params }: { params: { id: string; docId: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const doc = await getDocument(params.id, params.docId);
  if (!doc) redirect(`/novels/${params.id}/documents`);

  const versions = await getVersions(params.id, params.docId);

  async function saveAction(formData: FormData) {
    'use server';
    const title = String(formData.get('title') || doc.title);
    const contentJSON = String(formData.get('content') || '');
    const content = contentJSON ? JSON.parse(contentJSON) : doc.content;
    await updateDocument(params.id, params.docId, { title, content });
  }

  async function restoreAction(formData: FormData) {
    'use server';
    const version = Number(formData.get('version'));
    await restoreVersion(params.id, params.docId, version);
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <form action={saveAction} className="space-y-4">
        <input
          name="title"
          defaultValue={doc.title}
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Document title"
        />

        <EditorField
          name="content"
          initialValue={doc.content ?? { type: 'doc', content: [{ type: 'paragraph' }] }}
          placeholder="Start writing..."
        />

        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          <Button type="button" variant="outline" onClick={() => history.back()}>
            Cancel
          </Button>
        </div>
      </form>

      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-2">Versions</h2>
        {!versions?.length ? (
          <div className="text-sm text-muted-foreground">No versions yet.</div>
        ) : (
          <ul className="divide-y rounded-md border">
            {versions.map((v: any) => (
              <li key={`${v.version}-${v.createdAt}`} className="p-3 flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">Version {v.version}</div>
                  <div className="text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</div>
                </div>
                <form action={restoreAction}>
                  <input type="hidden" name="version" value={v.version} />
                  <Button type="submit" size="sm" variant="outline">Restore</Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
