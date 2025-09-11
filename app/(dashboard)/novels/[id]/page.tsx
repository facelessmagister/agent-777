import { notFound } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Button } from '@/components/ui/button';
import { Edit, FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { Novel } from '@/lib/db/novel-schema';

export default async function NovelDetailPage({ params }: { params: { id: string } }) {
  const req = { headers: {} } as NextApiRequest;
  const res = {} as NextApiResponse;
  const session = await getServerSession(req, res);
  if (!session?.user?.id) return notFound();

  // Fetch novel details via API
  const novelRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/novels?novelId=${params.id}`, { cache: 'no-store' });
  // Fallback if GET /api/novels?novelId is not supported: use /api/novels/[id]
  let novel: Novel | null = null;
  if (novelRes.ok) {
    const data = await novelRes.json();
    novel = data?.success ? data.data : null;
  }
  if (!novel) {
    const res2 = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/novels/${params.id}`, { cache: 'no-store' });
    if (!res2.ok) return notFound();
    const data2 = await res2.json();
    novel = data2?.success ? data2.data : null;
  }
  if (!novel) return notFound();

  // Fetch documents list
  const docsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/novels/${params.id}/documents`, { cache: 'no-store' });
  const documents: any[] = docsRes.ok ? (await docsRes.json())?.data ?? [] : [];

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: 'Draft', variant: 'outline' as const },
      in_progress: { label: 'In Progress', variant: 'default' as const },
      completed: { label: 'Completed', variant: 'secondary' as const },
      published: { label: 'Published', variant: 'default' as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'chapter':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'character':
        return <User className="h-5 w-5 text-purple-500" />;
      case 'world':
        return <Globe className="h-5 w-5 text-green-500" />;
      case 'note':
        return <FileText className="h-5 w-5 text-yellow-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column - Novel Info */}
        <div className="md:w-1/3 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold">{novel.title}</h1>
                <div className="mt-1">{getStatusBadge(novel.status)}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" asChild>
                  <Link href={`/novels/${novel.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="aspect-[2/3] w-full rounded-lg overflow-hidden bg-gray-100">
              <img
                src={novel.coverImageUrl || 'https://via.placeholder.com/300x450?text=Novel+Cover'}
                alt={`${novel.title} cover`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/300x450?text=Cover+Not+Found';
                }}
              />
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 text-gray-900">
                {novel.description || 'No description provided.'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Genres</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {novel.genre?.length ? (
                  novel.genre.map((genre: string) => (
                    <Badge key={genre} variant="secondary">
                      {genre}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No genres added</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Documents */}
        <div className="md:w-2/3">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Documents</h2>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/novels/${novel.id}/documents`}>
                  <FileText className="mr-2 h-4 w-4" />
                  View All
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/novels/${novel.id}/documents/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Document
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {documents.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new document.
                </p>
                <div className="mt-6">
                  <Button asChild>
                    <Link href={`/novels/${novel.id}/documents/new`}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Document
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <li key={doc.id}>
                      <Link
                        href={`/novels/${novel.id}/documents/${doc.id}`}
                        className="block hover:bg-gray-50"
                      >
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {getDocumentIcon(doc.type)}
                              <p className="ml-3 text-sm font-medium text-indigo-600 truncate">
                                {doc.title}
                              </p>
                            </div>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                Last updated {new Date(doc.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components for icons
function User(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function Globe(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
