'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/toast';

export function QuickCreateCards({ novelId }: { novelId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function createCharacter(form: HTMLFormElement) {
    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    const role = String(formData.get('role') || 'protagonist');
    if (!name) return toast({ type: 'error', description: 'Please enter a character name.' });
    try {
      setLoading('character');
      const res = await fetch('/api/agents/character/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId, name, role, traits: [], goals: [], flaws: [], backstory: '', relationships: [] }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      toast({ type: 'success', description: `Character “${data?.data?.title ?? name}” created.` });
      router.push(`/novels/${novelId}/documents/${data?.data?.id}`);
    } catch (e) {
      toast({ type: 'error', description: 'Failed to create character.' });
    } finally {
      setLoading(null);
    }
  }

  async function createPlot(form: HTMLFormElement) {
    const formData = new FormData(form);
    const title = String(formData.get('title') || '').trim();
    const premise = String(formData.get('premise') || '');
    const acts = Number(formData.get('acts') || 3);
    if (!title) return toast({ type: 'error', description: 'Please enter a title for the plot outline.' });
    try {
      setLoading('plot');
      const res = await fetch('/api/agents/plot/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId, title, premise, acts, keyBeats: [] }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      toast({ type: 'success', description: `Plot outline “${data?.data?.title ?? title}” created.` });
      router.push(`/novels/${novelId}/documents/${data?.data?.id}`);
    } catch (e) {
      toast({ type: 'error', description: 'Failed to create plot outline.' });
    } finally {
      setLoading(null);
    }
  }

  async function createChapter(form: HTMLFormElement) {
    const formData = new FormData(form);
    const title = String(formData.get('chapterTitle') || '').trim();
    const synopsis = String(formData.get('synopsis') || '');
    if (!title) return toast({ type: 'error', description: 'Please enter a chapter title.' });
    try {
      setLoading('chapter');
      const res = await fetch('/api/agents/chapter/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId, title, synopsis, scenes: [] }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      toast({ type: 'success', description: `Chapter “${data?.data?.title ?? title}” created.` });
      router.push(`/novels/${novelId}/documents/${data?.data?.id}`);
    } catch (e) {
      toast({ type: 'error', description: 'Failed to create chapter draft.' });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Create — Character</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => { e.preventDefault(); createCharacter(e.currentTarget); }}
            className="grid gap-2"
          >
            <input name="name" placeholder="Name" className="w-full rounded-md border px-3 py-2 text-sm" />
            <input name="role" placeholder="Role (e.g., protagonist)" className="w-full rounded-md border px-3 py-2 text-sm" />
            <Button type="submit" size="sm" className="w-full" disabled={loading === 'character'}>
              {loading === 'character' ? 'Creating…' : 'Create'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Create — Plot Outline</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => { e.preventDefault(); createPlot(e.currentTarget); }}
            className="grid gap-2"
          >
            <input name="title" placeholder="Title" className="w-full rounded-md border px-3 py-2 text-sm" />
            <input name="premise" placeholder="Premise (optional)" className="w-full rounded-md border px-3 py-2 text-sm" />
            <input name="acts" type="number" min={1} max={5} defaultValue={3} className="w-full rounded-md border px-3 py-2 text-sm" />
            <Button type="submit" size="sm" className="w-full" disabled={loading === 'plot'}>
              {loading === 'plot' ? 'Creating…' : 'Create'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Create — Chapter Draft</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => { e.preventDefault(); createChapter(e.currentTarget); }}
            className="grid gap-2"
          >
            <input name="chapterTitle" placeholder="Title" className="w-full rounded-md border px-3 py-2 text-sm" />
            <input name="synopsis" placeholder="Synopsis (optional)" className="w-full rounded-md border px-3 py-2 text-sm" />
            <Button type="submit" size="sm" className="w-full" disabled={loading === 'chapter'}>
              {loading === 'chapter' ? 'Creating…' : 'Create'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
