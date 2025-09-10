---
trigger: model_decision
description: guideline for vercel ui sdk chatbot creation
---

### Usage Information

Track token consumption and resource usage with [message metadata](/docs/ai-sdk-ui/message-metadata):

1. Define a custom metadata type with usage fields (optional, for type safety)
2. Attach usage data using `messageMetadata` in your response
3. Display usage metrics in your UI components

Usage data is attached as metadata to messages and becomes available once the model completes its response generation.

```ts
import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  streamText,
  UIMessage,
  type LanguageModelUsage,
} from 'ai';

// Create a new metadata type (optional for type-safety)
type MyMetadata = {
  totalUsage: LanguageModelUsage;
};

// Create a new custom message type with your own metadata
export type MyUIMessage = UIMessage<MyMetadata>;

export async function POST(req: Request) {
  const { messages }: { messages: MyUIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    messageMetadata: ({ part }) => {
      // Send total usage when generation is finished
      if (part.type === 'finish') {
        return { totalUsage: part.totalUsage };
      }
    },
  });
}
```

Then, on the client, you can access the message-level metadata.

```tsx
'use client';

import { useChat } from '@ai-sdk/react';
import type { MyUIMessage } from './api/chat/route';
import { DefaultChatTransport } from 'ai';

export default function Chat() {
  // Use custom message type defined on the server (optional for type-safety)
  const { messages } = useChat<MyUIMessage>({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(m => (
        <div key={m.id} className="whitespace-pre-wrap">
          {m.role === 'user' ? 'User: ' : 'AI: '}
          {m.parts.map(part => {
            if (part.type === 'text') {
              return part.text;
            }
          })}
          {/* Render usage via metadata */}
          {m.metadata?.totalUsage && (
            <div>Total usage: {m.metadata?.totalUsage.totalTokens} tokens</div>
          )}
        </div>
      ))}
    </div>
  );
}
```

You can also access your metadata from the `onFinish` callback of `useChat`:

```tsx
'use client';

import { useChat } from '@ai-sdk/react';
import type { MyUIMessage } from './api/chat/route';
import { DefaultChatTransport } from 'ai';

export default function Chat() {
  // Use custom message type defined on the server (optional for type-safety)
  const { messages } = useChat<MyUIMessage>({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    onFinish: ({ message }) => {
      // Access message metadata via onFinish callback
      console.log(message.metadata?.totalUsage);
    },
  });
}
```

### Text Streams

`useChat` can handle plain text streams by setting the `streamProtocol` option to `text`:

```tsx filename="app/page.tsx" highlight="7"
'use client';

import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';

export default function Chat() {
  const { messages } = useChat({
    transport: new TextStreamChatTransport({
      api: '/api/chat',
    }),
  });

  return <>...</>;
}
```

This configuration also works with other backend servers that stream plain text.
Check out the [stream protocol guide](/docs/ai-sdk-ui/stream-protocol) for more information.

<Note>
  When using `TextStreamChatTransport`, tool calls, usage information and finish
  reasons are not available.
</Note>

## Reasoning

Some models such as as DeepSeek `deepseek-reasoner`
and Anthropic `claude-3-7-sonnet-20250219` support reasoning tokens.
These tokens are typically sent before the message content.
You can forward them to the client with the `sendReasoning` option:

```ts filename="app/api/chat/route.ts" highlight="13"
import { deepseek } from '@ai-sdk/deepseek';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: deepseek('deepseek-reasoner'),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
  });
}
```

On the client side, you can access the reasoning parts of the message object.

Reasoning parts have a `text` property that contains the reasoning content.

```tsx filename="app/page.tsx"
messages.map(message => (
  <div key={message.id}>
    {message.role === 'user' ? 'User: ' : 'AI: '}
    {message.parts.map((part, index) => {
      // text parts:
      if (part.type === 'text') {
        return <div key={index}>{part.text}</div>;
      }

      // reasoning parts:
      if (part.type === 'reasoning') {
        return <pre key={index}>{part.text}</pre>;
      }
    })}
  </div>
));
```

## Sources

Some providers such as [Perplexity](/providers/ai-sdk-providers/perplexity#sources) and
[Google Generative AI](/providers/ai-sdk-providers/google-generative-ai#sources) include sources in the response.

Currently sources are limited to web pages that ground the response.
You can forward them to the client with the `sendSources` option:

```ts filename="app/api/chat/route.ts" highlight="13"
import { perplexity } from '@ai-sdk/perplexity';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: perplexity('sonar-pro'),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    sendSources: true,
  });
}
```

On the client side, you can access source parts of the message object.
There are two types of sources: `source-url` for web pages and `source-document` for documents.
Here is an example that renders both types of sources:

```tsx filename="app/page.tsx"
messages.map(message => (
  <div key={message.id}>
    {message.role === 'user' ? 'User: ' : 'AI: '}

    {/* Render URL sources */}
    {message.parts
      .filter(part => part.type === 'source-url')
      .map(part => (
        <span key={`source-${part.id}`}>
          [
          <a href={part.url} target="_blank">
            {part.title ?? new URL(part.url).hostname}
          </a>
          ]
        </span>
      ))}

    {/* Render document sources */}
    {message.parts
      .filter(part => part.type === 'source-document')
      .map(part => (
        <span key={`source-${part.id}`}>
          [<span>{part.title ?? `Document ${part.id}`}</span>]
        </span>
      ))}
  </div>
));
```

## Image Generation

Some models such as Google `gemini-2.0-flash-exp` support image generation.
When images are generated, they are exposed as files to the client.
On the client side, you can access file parts of the message object
and render them as images.

```tsx filename="app/page.tsx"
messages.map(message => (
  <div key={message.id}>
    {message.role === 'user' ? 'User: ' : 'AI: '}
    {message.parts.map((part, index) => {
      if (part.type === 'text') {
        return <div key={index}>{part.text}</div>;
      } else if (part.type === 'file' && part.mediaType.startsWith('image/')) {
        return <img key={index} src={part.url} alt="Generated image" />;
      }
    })}
  </div>
));
```