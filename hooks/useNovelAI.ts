import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export function useNovelAI(novelId?: string) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!session?.user?.id) {
        setError(new Error('User not authenticated'));
        return;
      }

      setIsLoading(true);
      setError(null);

      // Add user message to the UI immediately
      const userMessage: Message = { role: 'user', content };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages: [{ role: 'user', content }], novelId }),
        });

        const contentType = response.headers.get('content-type') || '';

        // JSON fallback (e.g., intent actions might return JSON or errors)
        if (contentType.includes('application/json')) {
          const data = await response.json();
          const text = data?.message || data?.data?.message || data?.error || 'Action completed.';
          setMessages((prev) => [...prev, { role: 'assistant', content: String(text) }]);
          setIsLoading(false);
          return;
        }

        if (!response.ok || !response.body) throw new Error('Failed to stream response');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantBuffer = '';

        // Push placeholder assistant message, then update progressively
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantBuffer += chunk;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'assistant') {
              next[next.length - 1] = { ...last, content: assistantBuffer };
            }
            return next;
          });
        }
      } catch (err) {
        console.error('Error sending message:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user?.id, novelId]
  );

  return {
    messages,
    sendMessage,
    isLoading,
    error,
  };
}

