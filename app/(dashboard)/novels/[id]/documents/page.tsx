import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText } from 'lucide-react';
import { QuickCreateCards } from '@/components/novels/QuickCreateCards';

async function getDocuments(novelId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/novels/${novelId}/documents`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data?.success ? data.data : [];
}

export default async function DocumentsPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const docs = await getDocuments(params.id);

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Documents</h1>
        <Button asChild>
          <Link href={`/novels/${params.id}/documents/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Document
          </Link>
        </Button>
      </div>

      <QuickCreateCards novelId={params.id} />

      {!docs?.length ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-10 text-center">
          <FileText className="h-10 w-10 text-gray-400 mb-3" />
          <p className="text-gray-600">No documents yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc: any) => (
            <Card key={doc.id} className="hover:shadow-sm transition-shadow">
              <CardHeader>
                <CardTitle className="truncate text-base">{doc.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-3 capitalize">{doc.type}</div>
                <div className="text-xs text-muted-foreground">Version: {doc.version}</div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/novels/${params.id}/documents/${doc.id}`}>Open</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
