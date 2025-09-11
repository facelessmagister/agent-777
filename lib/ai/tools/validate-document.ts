import { tool } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import { getDocumentById } from '@/lib/db/queries';

interface ValidateDocumentProps {
  session: Session;
}

// Define validation schemas for different document types
const textDocumentSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

const codeDocumentSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  // Could add more specific validation for code structure
});

const imageDocumentSchema = z.object({
  title: z.string().min(1),
  content: z.string().startsWith('data:image/'), // Base64 image validation
});

const sheetDocumentSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1), // Could add CSV format validation
});

export const validateDocument = ({ session }: ValidateDocumentProps) =>
  tool({
    description: 'Validate a document\'s structure and content based on its type. This tool checks if the document meets the required format and basic quality standards.',
    inputSchema: z.object({
      id: z.string().describe('The ID of the document to validate'),
    }),
    execute: async ({ id }) => {
      // Fetch the document from the database
      const document = await getDocumentById({ id });

      // Check if document exists
      if (!document) {
        return {
          valid: false,
          error: 'Document not found',
        };
      }

      // Check if the user has permission to validate this document
      if (document.userId !== session.user?.id) {
        return {
          valid: false,
          error: 'Unauthorized access to document',
        };
      }

      // Validate based on document kind
      try {
        switch (document.kind) {
          case 'text':
            textDocumentSchema.parse(document);
            return {
              valid: true,
              kind: document.kind,
              id: document.id,
              title: document.title,
              message: 'Text document is valid',
            };

          case 'code':
            codeDocumentSchema.parse(document);
            return {
              valid: true,
              kind: document.kind,
              id: document.id,
              title: document.title,
              message: 'Code document is valid',
            };

          case 'image':
            imageDocumentSchema.parse(document);
            return {
              valid: true,
              kind: document.kind,
              id: document.id,
              title: document.title,
              message: 'Image document is valid',
            };

          case 'sheet':
            sheetDocumentSchema.parse(document);
            return {
              valid: true,
              kind: document.kind,
              id: document.id,
              title: document.title,
              message: 'Sheet document is valid',
            };

          default:
            return {
              valid: false,
              error: `Unsupported document kind: ${document.kind}`,
            };
        }
      } catch (error: any) {
        return {
          valid: false,
          kind: document.kind,
          id: document.id,
          title: document.title,
          error: error.message || 'Document validation failed',
        };
      }
    },
  });