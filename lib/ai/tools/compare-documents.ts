import { tool } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import { getDocumentById } from '@/lib/db/queries';

interface CompareDocumentsProps {
  session: Session;
}

export const compareDocuments = ({ session }: CompareDocumentsProps) =>
  tool({
    description: 'Compare two document versions and return structured information about their differences. This tool is useful for tracking changes between document versions.',
    inputSchema: z.object({
      id1: z.string().describe('The ID of the first document to compare'),
      id2: z.string().describe('The ID of the second document to compare'),
    }),
    execute: async ({ id1, id2 }) => {
      // Fetch both documents from the database
      const [document1, document2] = await Promise.all([
        getDocumentById({ id: id1 }),
        getDocumentById({ id: id2 }),
      ]);

      // Check if documents exist
      if (!document1) {
        return {
          error: 'First document not found',
        };
      }

      if (!document2) {
        return {
          error: 'Second document not found',
        };
      }

      // Check if the user has permission to read these documents
      if (document1.userId !== session.user?.id || document2.userId !== session.user?.id) {
        return {
          error: 'Unauthorized access to one or both documents',
        };
      }

      // Check if documents are of the same kind
      if (document1.kind !== document2.kind) {
        return {
          error: 'Cannot compare documents of different kinds',
        };
      }

      // Simple comparison - in a real implementation, you might want to use
      // a more sophisticated diff algorithm
      const areIdentical = document1.content === document2.content;
      
      // Calculate basic statistics
      const length1 = document1.content?.length || 0;
      const length2 = document2.content?.length || 0;
      const lengthDifference = length2 - length1;

      return {
        documents: {
          id1: document1.id,
          title1: document1.title,
          id2: document2.id,
          title2: document2.title,
        },
        kind: document1.kind,
        areIdentical,
        statistics: {
          length1,
          length2,
          lengthDifference,
        },
        summary: areIdentical 
          ? 'Documents are identical' 
          : `Documents differ by ${Math.abs(lengthDifference)} characters`,
      };
    },
  });