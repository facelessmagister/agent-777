'use client';

import React, { useEffect, useRef } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { exampleSetup } from 'prosemirror-example-setup';

export type ProseMirrorEditorProps = {
  value: any; // ProseMirror JSON document
  onChange: (next: any) => void; // Emits ProseMirror JSON
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
};

export function ProseMirrorEditor({ value, onChange, readOnly = false, className = '', placeholder }: ProseMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Helper: Create PM Node from JSON, fallback to paragraph
  const createDocFromJSON = (json: any) => {
    try {
      if (json) {
        return basicSchema.nodeFromJSON(json);
      }
    } catch (_) {
      // ignore and fallback
    }
    return (
      basicSchema.topNodeType.createAndFill(
        undefined,
        basicSchema.nodes.paragraph.createAndFill()
      ) || undefined
    );
  };

  // Initialize PM view
  useEffect(() => {
    if (!containerRef.current) return;
    if (viewRef.current) return; // already initialized

    const doc = createDocFromJSON(value);
    const state = EditorState.create({
      doc: doc as any,
      schema: basicSchema,
      plugins: exampleSetup({ schema: basicSchema })
    });

    const view = new EditorView(containerRef.current, {
      state,
      editable: () => !readOnly,
      dispatchTransaction(tr) {
        const newState = view.state.apply(tr);
        view.updateState(newState);
        // Emit ProseMirror JSON
        onChange(view.state.doc.toJSON());
      },
      attributes: {
        class: 'pm-editor min-h-[240px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
        role: 'textbox',
        'aria-multiline': 'true',
      },
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [readOnly]);

  // Sync external value -> editor when it changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    try {
      const currentJSON = view.state.doc.toJSON();
      const nextJSON = value ?? null;
      if (JSON.stringify(currentJSON) !== JSON.stringify(nextJSON)) {
        const nextDoc = createDocFromJSON(nextJSON);
        view.updateState(
          EditorState.create({
            doc: nextDoc as any,
            schema: basicSchema,
            plugins: exampleSetup({ schema: basicSchema }),
          })
        );
      }
    } catch (_) {
      // ignore
    }
  }, [value]);

  return (
    <div className={`relative ${className}`}>
      {!value && placeholder ? (
        <div className="pointer-events-none absolute left-3 top-2 text-sm text-muted-foreground">{placeholder}</div>
      ) : null}
      <div ref={containerRef} />
      <div className="h-2" />
    </div>
  );
}
