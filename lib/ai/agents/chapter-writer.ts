import { z } from 'zod';
import { BaseAgent } from '../base-agent';
import { db, novel, novelDocument } from '@/lib/db';
import { and, eq } from 'drizzle-orm';

function pmDoc(children: any[] = []) {
  return { type: 'doc', content: children };
}

function heading(text: string, level = 2) {
  return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] };
}

function paragraph(text: string) {
  return { type: 'paragraph', content: text ? [{ type: 'text', text }] : [] };
}

function sceneBlock(title: string, content: string) {
  return [heading(title, 3), paragraph(content)];
}

export class ChapterWriterAgent extends BaseAgent {
  constructor() {
    super({
      systemPrompt:
        'You are ChapterWriter. You help authors draft, iterate, and polish chapters. Maintain voice and continuity, ask clarifying questions, and produce structured scenes.',
    });

    this.registerTools([
      this.createChapterDraftTool(),
      this.rewriteChapterSectionTool(),
    ]);
  }

  private createChapterDraftTool() {
    const schema = z.object({
      novelId: z.string().uuid(),
      title: z.string().min(1),
      synopsis: z.string().default(''),
      scenes: z.array(z.object({ title: z.string(), summary: z.string().default('') })).default([]),
      userId: z.string().uuid(),
    });

    return this.createTool(
      'createChapterDraft',
      'Create a new chapter draft with a synopsis and initial scenes.',
      schema,
      async ({ novelId, title, synopsis, scenes, userId }) => {
        const [owned] = await db
          .select({ id: novel.id })
          .from(novel)
          .where(and(eq(novel.id, novelId), eq(novel.userId, userId)))
          .limit(1);
        if (!owned) throw new Error('Novel not found or not owned by user');

        const content = pmDoc([
          heading(title, 2),
          heading('Synopsis', 3),
          paragraph(synopsis),
          ...scenes.flatMap((s) => sceneBlock(s.title, s.summary)),
        ]);

        const [doc] = await db
          .insert(novelDocument)
          .values({
            novelId,
            type: 'chapter',
            title,
            content,
            metadata: { kind: 'chapter-draft' },
            version: 1,
            isCurrent: true,
            previousVersionId: null,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        return { id: doc.id, title: doc.title };
      }
    );
  }

  private rewriteChapterSectionTool() {
    const schema = z.object({
      novelId: z.string().uuid(),
      docId: z.string().uuid(),
      userId: z.string().uuid(),
      sectionTitle: z.string().min(1),
      newText: z.string().min(1),
      note: z.string().optional(),
    });

    return this.createTool(
      'rewriteChapterSection',
      'Rewrite or append a specific chapter section by section title.',
      schema,
      async ({ novelId, docId, userId, sectionTitle, newText, note }) => {
        const [doc] = await db
          .select()
          .from(novelDocument)
          .where(and(eq(novelDocument.id, docId), eq(novelDocument.novelId, novelId), eq(novelDocument.userId, userId)))
          .limit(1);
        if (!doc) throw new Error('Document not found or not owned by user');

        const current = (doc.content as any) ?? pmDoc([paragraph('')]);
        const existing = Array.isArray(current.content) ? current.content : [];

        // Simple approach: append a rewritten section block (non-destructive)
        const next = {
          ...current,
          content: [
            ...existing,
            heading(`Rewritten — ${sectionTitle}`, 3),
            paragraph(newText),
            ...(note ? [paragraph(note)] : []),
          ],
        };

        const [updated] = await db
          .update(novelDocument)
          .set({ content: next, updatedAt: new Date(), version: (doc.version ?? 1) + 1 })
          .where(and(eq(novelDocument.id, docId), eq(novelDocument.novelId, novelId), eq(novelDocument.userId, userId)))
          .returning({ id: novelDocument.id, version: novelDocument.version });

        return { id: updated.id, version: updated.version };
      }
    );
  }
}
