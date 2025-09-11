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

export class CharacterBuilderAgent extends BaseAgent {
  constructor() {
    super({
      systemPrompt:
        'You are CharacterBuilder. You help authors design compelling characters with rich backstories, arcs, motivations, and relationships. Favor concise, actionable suggestions and structured output.',
    });

    // Register tools
    this.registerTools([
      this.createCharacterSheetTool(),
      this.refineCharacterSheetTool(),
    ]);
  }

  private createCharacterSheetTool() {
    const schema = z.object({
      novelId: z.string().uuid(),
      name: z.string().min(1),
      role: z.string().default('protagonist'),
      traits: z.array(z.string()).default([]),
      backstory: z.string().default(''),
      goals: z.array(z.string()).default([]),
      flaws: z.array(z.string()).default([]),
      relationships: z.array(z.object({ name: z.string(), relation: z.string() })).default([]),
      userId: z.string().uuid(),
    });

    return this.createTool(
      'createCharacterSheet',
      'Create a new character sheet document for the provided novel and user.',
      schema,
      async ({ novelId, name, role, traits, backstory, goals, flaws, relationships, userId }) => {
        // Ensure ownership
        const [owned] = await db
          .select({ id: novel.id })
          .from(novel)
          .where(and(eq(novel.id, novelId), eq(novel.userId, userId)))
          .limit(1);
        if (!owned) throw new Error('Novel not found or not owned by user');

        const content = pmDoc([
          heading(`${name} — ${role}`, 2),
          heading('Core Traits', 3),
          bulletList(traits),
          heading('Backstory', 3),
          paragraph(backstory),
          heading('Goals', 3),
          bulletList(goals),
          heading('Flaws', 3),
          bulletList(flaws),
          heading('Relationships', 3),
          ...relationships.map((r) => paragraph(`${r.name}: ${r.relation}`)),
        ]);

        const [doc] = await db
          .insert(novelDocument)
          .values({
            novelId,
            type: 'character',
            title: name,
            content,
            metadata: { role },
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

  private refineCharacterSheetTool() {
    const schema = z.object({
      docId: z.string().uuid(),
      novelId: z.string().uuid(),
      userId: z.string().uuid(),
      instructions: z.string().min(1),
      notes: z.string().optional(),
    });

    return this.createTool(
      'refineCharacterSheet',
      'Refine an existing character sheet by appending a Notes section with the given instructions.',
      schema,
      async ({ docId, novelId, userId, instructions, notes }) => {
        // Fetch and own-check
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
            heading('Notes', 3),
            paragraph(instructions),
            ...(notes ? [paragraph(notes)] : []),
          ],
        };

        // Store as a normal update; versioning occurs in API route but this helper can be used directly too
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
