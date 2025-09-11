import { z } from 'zod';
import { BaseAgent } from './base-agent';
import { db, novel, novelDocument } from '../db';
import { eq, and } from 'drizzle-orm';
import type { Novel, NovelDocument } from '../db/novel-schema';
import { TRPCError } from '@trpc/server';

// Define types for database operations
type NovelInsert = Omit<Novel, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
};

type NovelDocumentInsert = Omit<NovelDocument, 'id' | 'version' | 'isCurrent' | 'createdAt' | 'updatedAt'> & {
  version: number;
  isCurrent: boolean;
  previousVersionId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Define schemas for validation
const insertNovelSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  genre: z.array(z.string()).optional(),
  status: z.enum(['draft', 'in_progress', 'completed', 'published']).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  userId: z.string().uuid()
});

const insertNovelDocumentSchema = z.object({
  novelId: z.string().uuid(),
  type: z.enum(['chapter', 'character', 'world', 'note']),
  title: z.string(),
  content: z.any().optional(),
  metadata: z.any().optional(),
  userId: z.string().uuid()
});

// Define tool schemas with proper parameter objects
const createNovelSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  genre: z.array(z.string()).optional(),
  status: z.enum(['draft', 'in_progress', 'completed', 'published']).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  userId: z.string().uuid()
});

const updateNovelSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  description: z.string().optional(),
  genre: z.array(z.string()).optional(),
  status: z.enum(['draft', 'in_progress', 'completed', 'published']).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  userId: z.string().uuid()
});

const createDocumentSchema = z.object({
  novelId: z.string().uuid(),
  type: z.enum(['chapter', 'character', 'world', 'note']),
  title: z.string(),
  content: z.any().optional(),
  metadata: z.any().optional(),
  userId: z.string().uuid()
});

export class NovelOrchestrator extends BaseAgent {
  constructor() {
    super({
      systemPrompt: `You are a helpful AI assistant specialized in novel writing. 
      You help authors with world-building, character development, plot creation, and chapter writing.
      Be creative, supportive, and provide constructive feedback.`,
    });

    // Register tools
    this.registerTools([
      this.createTool(
        'createNovel',
        'Create a new novel with the given details',
        createNovelSchema,
        this.createNovel.bind(this)
      ),
      this.createTool(
        'updateNovel',
        'Update an existing novel',
        updateNovelSchema,
        this.updateNovel.bind(this)
      ),
      this.createTool(
        'createDocument',
        'Create a new document (chapter, character, world, or note)',
        createDocumentSchema,
        this.createDocument.bind(this)
      ),
    ]);
  }

  public async createNovel(args: z.infer<typeof createNovelSchema>): Promise<Novel> {
    try {
      // Validate input
      const validatedData = insertNovelSchema.parse(args);
      
      const newNovel: NovelInsert = {
        title: validatedData.title,
        description: validatedData.description || '',
        genre: validatedData.genre || [],
        status: validatedData.status || 'draft',
        coverImageUrl: validatedData.coverImageUrl || '',
        userId: validatedData.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert into database
      const [createdNovel] = await db
        .insert(novel)
        .values(newNovel)
        .returning()
        .catch((error) => {
          console.error('Database error when creating novel:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database error while creating novel',
            cause: error,
          });
        });

      if (!createdNovel) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create novel: No data returned from database',
        });
      }

      return createdNovel;
    } catch (error) {
      console.error('Error creating novel:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create novel',
        cause: error,
      });
    }
  }

  public async updateNovel(args: z.infer<typeof updateNovelSchema>): Promise<Novel> {
    try {
      // Validate input
      const validatedData = insertNovelSchema.partial().parse(args);
      
      // Check if novel exists and user has permission
      const [existingNovel] = await db
        .select()
        .from(novel)
        .where(
          and(
            eq(novel.id, args.id),
            eq(novel.userId, args.userId)
          )
        )
        .limit(1);

      if (!existingNovel) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Novel not found or access denied',
        });
      }

      // Prepare update data
      const updateData = {
        ...validatedData,
        updatedAt: new Date(),
      };

      // Update in database
      const [updatedNovel] = await db
        .update(novel)
        .set(updateData)
        .where(eq(novel.id, args.id))
        .returning()
        .catch((error) => {
          console.error('Database error when updating novel:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database error while updating novel',
            cause: error,
          });
        });

      if (!updatedNovel) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Novel not found after update',
        });
      }

      return updatedNovel;
    } catch (error) {
      console.error('Error updating novel:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update novel',
        cause: error,
      });
    }
  }

  public async createDocument(args: z.infer<typeof createDocumentSchema>): Promise<NovelDocument> {
    try {
      // Validate input
      const validatedData = insertNovelDocumentSchema.parse(args);
      
      // Check if novel exists and user has permission
      const [existingNovel] = await db
        .select()
        .from(novel)
        .where(
          and(
            eq(novel.id, args.novelId),
            eq(novel.userId, args.userId)
          )
        )
        .limit(1);

      if (!existingNovel) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Novel not found or access denied',
        });
      }

      const newDocument: NovelDocumentInsert = {
        novelId: validatedData.novelId,
        type: validatedData.type,
        title: validatedData.title,
        content: validatedData.content || {},
        metadata: validatedData.metadata || {},
version: 1,
        isCurrent: true,
        previousVersionId: null,
        userId: validatedData.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert into database
      const [createdDocument] = await db
        .insert(novelDocument)
        .values(newDocument)
        .returning()
        .catch((error) => {
          console.error('Database error when creating document:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database error while creating document',
            cause: error,
          });
        });

      if (!createdDocument) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create document: No data returned from database',
        });
      }

      return createdDocument;
    } catch (error) {
      console.error('Error creating document:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create document',
        cause: error,
      });
    }
  }

  // Process a user message (for chat functionality)
  public async processUserMessage(message: string, userId: string): Promise<void> {
    // This is a placeholder - in a real implementation, this would process the message
    // and update the agent's state
    console.log(`Processing message from user ${userId}:`, message);
  }

  // Clean up resources
  public cleanup(): void {
    // Clean up any resources here
  }

  // Document operations
  public async getNovelById(id: string, userId: string): Promise<Novel | null> {
    try {
      const [result] = await db
        .select()
        .from(novel)
        .where(
          and(
            eq(novel.id, id),
            eq(novel.userId, userId)
          )
        )
        .limit(1);
      return result || null;
    } catch (error) {
      console.error('Error getting novel by ID:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve novel',
        cause: error,
      });
    }
  }

  public async listNovelsByUser(userId: string): Promise<Novel[]> {
    try {
      return await db
        .select()
        .from(novel)
        .where(eq(novel.userId, userId));
    } catch (error) {
      console.error('Error listing novels:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to list novels',
        cause: error,
      });
    }
  }
}
