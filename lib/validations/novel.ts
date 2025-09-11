import { z } from 'zod';

export const NovelCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  genre: z.string().min(1, 'Genre is required').max(100, 'Genre is too long'),
  tone: z.string().min(1, 'Tone is required').max(100, 'Tone is too long'),
  synopsis: z.string().min(1, 'Synopsis is required'),
  targetChapterCount: z.number().int().positive({ message: 'Chapter count must be positive' }),
});

export const NovelUpdateSchema = NovelCreateSchema.partial();

export const DocumentUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  content: z.record(z.any()),
});

export const ChapterCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  summary: z.string().optional(),
  position: z.number().int().nonnegative({ message: 'Position must be non-negative' }),
});

export const ChapterUpdateSchema = ChapterCreateSchema.partial().extend({
  status: z.enum(['draft', 'in_review', 'final', 'published']).optional(),
});
