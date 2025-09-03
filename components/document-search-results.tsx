'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { FileIcon, CodeIcon, FileTextIcon, TableIcon, ImageIcon } from 'lucide-react';
import { useArtifact } from '@/hooks/use-artifact';
import type { ArtifactKind } from './artifact';

interface DocumentSearchResult {
  id: string;
  title: string;
  kind: ArtifactKind;
  createdAt: Date;
  contentPreview: string;
}

interface DocumentSearchResultsProps {
  results: DocumentSearchResult[];
  query: {
    titleQuery?: string;
    contentQuery?: string;
    kind?: ArtifactKind;
    dateFrom?: string;
    dateTo?: string;
  };
  isReadonly: boolean;
}

const getKindIcon = (kind: ArtifactKind) => {
  switch (kind) {
    case 'code':
      return <CodeIcon className="size-4" />;
    case 'text':
      return <FileTextIcon className="size-4" />;
    case 'sheet':
      return <TableIcon className="size-4" />;
    case 'image':
      return <ImageIcon className="size-4" />;
    default:
      return <FileIcon className="size-4" />;
  }
};

const getKindLabel = (kind: ArtifactKind) => {
  switch (kind) {
    case 'code':
      return 'Code';
    case 'text':
      return 'Text';
    case 'sheet':
      return 'Spreadsheet';
    case 'image':
      return 'Image';
    default:
      return 'Document';
  }
};

export function DocumentSearchResults({ results, query, isReadonly }: DocumentSearchResultsProps) {
  const { setArtifact } = useArtifact();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Pagination logic
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = results.slice(startIndex, endIndex);

  const handleDocumentClick = (document: DocumentSearchResult, event: React.MouseEvent) => {
    if (isReadonly) {
      // In readonly mode, we might want to show a toast or handle differently
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    const boundingBox = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };

    setArtifact({
      documentId: document.id,
      kind: document.kind,
      content: '',
      title: document.title,
      isVisible: true,
      status: 'idle',
      boundingBox,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Document Search Results</span>
            <Badge variant="secondary">{results.length} found</Badge>
          </CardTitle>
          <CardDescription>
            {query.titleQuery && `Title: "${query.titleQuery}"`}
            {query.contentQuery && ` Content: "${query.contentQuery}"`}
            {query.kind && ` Type: ${getKindLabel(query.kind)}`}
            {query.dateFrom && ` From: ${query.dateFrom}`}
            {query.dateTo && ` To: ${query.dateTo}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentResults.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No documents found matching your search criteria.
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {currentResults.map((document) => (
                  <Card 
                    key={document.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={(e) => handleDocumentClick(document, e)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 text-muted-foreground">
                          {getKindIcon(document.kind)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{document.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {getKindLabel(document.kind)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                            {document.contentPreview}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(document.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}