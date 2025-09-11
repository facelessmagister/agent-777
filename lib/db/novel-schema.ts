import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  text,
  integer,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { user } from './schema';

// Novel table schema
export const novel = pgTable('novel', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  genre: varchar('genre', { length: 50 }).array(),
  status: varchar('status', { 
    enum: ['draft', 'in_progress', 'completed', 'published'] 
  }).notNull().default('draft'),
  coverImageUrl: text('cover_image_url'),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Novel = InferSelectModel<typeof novel>;

// Novel Document table schema
export const novelDocument = pgTable('novel_document', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  novelId: uuid('novel_id')
    .notNull()
    .references(() => novel.id, { onDelete: 'cascade' }),
  type: varchar('type', { 
    enum: ['chapter', 'character', 'world', 'note'] 
  }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: jsonb('content'),
  metadata: jsonb('metadata').default({}),
  version: integer('version').notNull().default(1),
  isCurrent: boolean('is_current').notNull().default(true),
  previousVersionId: uuid('previous_version_id'),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type NovelDocument = InferSelectModel<typeof novelDocument>;

// Document Version table schema
export const documentVersion = pgTable('document_version', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  documentId: uuid('document_id')
    .notNull()
    .references(() => novelDocument.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  content: jsonb('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type DocumentVersion = InferSelectModel<typeof documentVersion>;

// Schema validation with zod
export const novelSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  genre: z.array(z.string()).optional(),
  status: z.enum(['draft', 'in_progress', 'completed', 'published']).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  userId: z.string().uuid()
});

export const novelDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  type: z.enum(['chapter', 'character', 'world', 'note']),
  content: z.any().optional(),
  metadata: z.any().optional(),
  novelId: z.string().uuid(),
  userId: z.string().uuid()
});

// For database operations
export const insertNovelSchema = novelSchema;
export const insertNovelDocumentSchema = novelDocumentSchema;
