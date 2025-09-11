import { tool } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import { getDocumentById } from '@/lib/db/queries';

interface ReadDocumentProps {
  session: Session;
}

export const readDocument = ({ session }: ReadDocumentProps) =>
  tool({
    description: 'Read a document\'s content by its ID. This tool allows AI agents to verify document content after creation.',
    inputSchema: z.object({
      id: z.string().describe('The ID of the document to read'),
    }),
    execute: async ({ id }) => {
      // Fetch the document from the database
      const document = await getDocumentById({ id });

      // Check if document exists
      if (!document) {
        return {
          error: 'Document not found',
        };
      }

      // Check if the user has permission to read this document
      if (document.userId !== session.user?.id) {
        return {
          error: 'Unauthorized access to document',
        };
      }

      // Return the document content
      return {
        id: document.id,
        title: document.title,
        content: document.content || '',
        kind: document.kind,
        createdAt: document.createdAt,
      };
    },
  });