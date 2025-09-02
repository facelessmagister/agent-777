import { tool } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import { searchDocumentsAdvanced } from '@/lib/db/queries'; // Updated to use the new database function
import type { ArtifactKind } from '@/components/artifact';
import { ChatSDKError } from '@/lib/errors';

interface DocumentFinderProps {
  session: Session;
}

// Helper function to parse relative dates
const parseRelativeDate = (dateString: string): Date | null => {
  const now = new Date();
  
  if (dateString === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  
  if (dateString === 'yesterday') {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  }
  
  if (dateString === 'last week') {
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    return lastWeek;
  }
  
  if (dateString === 'last month') {
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return lastMonth;
  }
  
  // Try to parse as ISO date
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

export const documentFinder = ({ session }: DocumentFinderProps) =>
  tool({
    description: 'Search for documents by title, content, kind, and date range. This tool allows users to find documents using natural language descriptions with fuzzy matching capabilities.',
    inputSchema: z.object({
      titleQuery: z.string().optional().describe('Text to search in document titles (fuzzy matching)'),
      contentQuery: z.string().optional().describe('Text to search in document content (fuzzy matching)'),
      kind: z.enum(['text', 'code', 'image', 'sheet']).optional().describe('Filter by document type'),
      dateFrom: z.string().optional().describe('Start date for date range filtering (YYYY-MM-DD or relative like "last week")'),
      dateTo: z.string().optional().describe('End date for date range filtering (YYYY-MM-DD or relative like "today")'),
      limit: z.number().optional().default(20).describe('Maximum number of documents to return'),
      offset: z.number().optional().default(0).describe('Pagination offset'),
    }),
    execute: async ({ titleQuery, contentQuery, kind, dateFrom, dateTo, limit = 20, offset = 0 }) => {
      try {
        // Parse date range conditions
        let fromDate: Date | undefined = undefined;
        let toDate: Date | undefined = undefined;
        
        if (dateFrom) {
          fromDate = parseRelativeDate(dateFrom) || undefined;
        }
        
        if (dateTo) {
          toDate = parseRelativeDate(dateTo) || undefined;
          if (toDate) {
            // Set to end of day for "to" date
            const endOfDay = new Date(toDate);
            endOfDay.setHours(23, 59, 59, 999);
            toDate = endOfDay;
          }
        }
        
        // Execute the query using the new database function
        const documents = await searchDocumentsAdvanced({
          userId: session.user?.id || '',
          titleQuery,
          contentQuery,
          kind,
          dateFrom: fromDate,
          dateTo: toDate,
          limit,
          offset
        });
        
        return {
          query: {
            titleQuery,
            contentQuery,
            kind,
            dateFrom,
            dateTo,
            limit,
            offset
          },
          count: documents.length,
          documents: documents
        };
      } catch (error) {
        console.error('Document finder error:', error);
        return {
          error: 'Failed to search documents',
        };
      }
    },
  });