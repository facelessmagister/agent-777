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

function bulletList(items: string[]) {
  return {
    type: 'bullet_list',
    content: items.map((t) => ({ type: 'list_item', content: [paragraph(t)] })),
  };
}

export class PlotManagerAgent extends BaseAgent {
  constructor() {
    super({
      systemPrompt:
        'You are PlotManager. You help authors craft coherent plots, beats, and pacing. Return structured outputs and actionable suggestions.',
    });

    this.registerTools([
      this.createPlotOutlineTool(),
      this.refinePlotBeatsTool(),
    ]);
  }

  private createPlotOutlineTool() {
    const schema = z.object({
      novelId: z.string().uuid(),
      title: z.string().min(1),
      premise: z.string().default(''),
      acts: z.number().int().min(1).max(5).default(3),
      keyBeats: z.array(z.string()).default([]),
      userId: z.string().uuid(),
    });

    return this.createTool(
      'createPlotOutline',
      'Create a plot outline document with acts and key beats.',
      schema,
      async ({ novelId, title, premise, acts, keyBeats, userId }) => {
        const [owned] = await db
          .select({ id: novel.id })
          .from(novel)
          .where(and(eq(novel.id, novelId), eq(novel.userId, userId)))
          .limit(1);
        if (!owned) throw new Error('Novel not found or not owned by user');

        const actHeadings = Array.from({ length: acts }).map((_, i) => heading(`Act ${i + 1}`, 3));
        const content = pmDoc([
          heading(`${title} — Plot Outline`, 2),
          heading('Premise', 3),
          paragraph(premise),
          heading('Key Beats', 3),
          bulletList(keyBeats),
          ...actHeadings,
        ]);

        const [doc] = await db
          .insert(novelDocument)
          .values({
            novelId,
            type: 'world',
            title: `${title} — Plot Outline`,
            content,
            metadata: { kind: 'plot-outline', acts },
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

  private refinePlotBeatsTool() {
    const schema = z.object({
      novelId: z.string().uuid(),
      docId: z.string().uuid(),
      userId: z.string().uuid(),
      beats: z.array(z.string()).min(1),
      notes: z.string().optional(),
    });

    return this.createTool(
      'refinePlotBeats',
      'Append or revise plot beats in a plot outline document.',
      schema,
      async ({ novelId, docId, userId, beats, notes }) => {
        const [doc] = await db
          .select()
          .from(novelDocument)
          .where(and(eq(novelDocument.id, docId), eq(novelDocument.novelId, novelId), eq(novelDocument.userId, userId)))
          .limit(1);
        if (!doc) throw new Error('Document not found or not owned by user');

        const current = (doc.content as any) ?? pmDoc([paragraph('')]);
        const next = {
          ...current,
          content: [
            ...(current.content ?? []),
            heading('Revised Beats', 3),
            ...beats.map((b) => paragraph(`• ${b}`)),
            ...(notes ? [paragraph(notes)] : []),
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
