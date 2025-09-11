"use client";

import { useEffect, useRef, useState } from "react";
import { ProseMirrorEditor } from "./ProseMirrorEditor";

interface EditorFieldProps {
  name: string;
  initialValue?: any; // ProseMirror JSON
  placeholder?: string;
  className?: string;
}

export function EditorField({ name, initialValue, placeholder, className }: EditorFieldProps) {
  const [value, setValue] = useState<any>(
    initialValue ?? { type: "doc", content: [{ type: "paragraph" }] }
  );
  const hiddenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hiddenRef.current) {
      hiddenRef.current.value = JSON.stringify(value);
    }
  }, [value]);

  return (
    <div className={className}>
      <ProseMirrorEditor
        value={value}
        onChange={setValue}
        placeholder={placeholder}
        className="min-h-[300px]"
      />
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={JSON.stringify(value)} />
    </div>
  );
}
