---
trigger: model_decision
description: guide on chatbot tool usage
---

## Dynamic Tools

When using dynamic tools (tools with unknown types at compile time), the UI parts use a generic `dynamic-tool` type instead of specific tool types:

```tsx filename='app/page.tsx'
{
  message.parts.map((part, index) => {
    switch (part.type) {
      // Static tools with specific (`tool-${toolName}`) types
      case 'tool-getWeatherInformation':
        return <WeatherDisplay part={part} />;

      // Dynamic tools use generic `dynamic-tool` type
      case 'dynamic-tool':
        return (
          <div key={index}>
            <h4>Tool: {part.toolName}</h4>
            {part.state === 'input-streaming' && (
              <pre>{JSON.stringify(part.input, null, 2)}</pre>
            )}
            {part.state === 'output-available' && (
              <pre>{JSON.stringify(part.output, null, 2)}</pre>
            )}
            {part.state === 'output-error' && (
              <div>Error: {part.errorText}</div>
            )}
          </div>
        );
    }
  });
}
```

Dynamic tools are useful when integrating with:

- MCP (Model Context Protocol) tools without schemas
- User-defined functions loaded at runtime
- External tool providers

## Tool call streaming

Tool call streaming is **enabled by default** in AI SDK 5.0, allowing you to stream tool calls while they are being generated. This provides a better user experience by showing tool inputs as they are generated in real-time.

```tsx filename='app/api/chat/route.ts'
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages: convertToModelMessages(messages),
    // toolCallStreaming is enabled by default in v5
    // ...
  });

  return result.toUIMessageStreamResponse();
}
```

With tool call streaming enabled, partial tool calls are streamed as part of the data stream.
They are available through the `useChat` hook.
The typed tool parts of assistant messages will also contain partial tool calls.
You can use the `state` property of the tool part to render the correct UI.

```tsx filename='app/page.tsx' highlight="9,10"
export default function Chat() {
  // ...
  return (
    <>
      {messages?.map(message => (
        <div key={message.id}>
          {message.parts.map(part => {
            switch (part.type) {
              case 'tool-askForConfirmation':
              case 'tool-getLocation':
              case 'tool-getWeatherInformation':
                switch (part.state) {
                  case 'input-streaming':
                    return <pre>{JSON.stringify(part.input, null, 2)}</pre>;
                  case 'input-available':
                    return <pre>{JSON.stringify(part.input, null, 2)}</pre>;
                  case 'output-available':
                    return <pre>{JSON.stringify(part.output, null, 2)}</pre>;
                  case 'output-error':
                    return <div>Error: {part.errorText}</div>;
                }
            }
          })}
        </div>
      ))}
    </>
  );
}
```

## Step start parts

When you are using multi-step tool calls, the AI SDK will add step start parts to the assistant messages.
If you want to display boundaries between tool calls, you can use the `step-start` parts as follows:

```tsx filename='app/page.tsx'
// ...
// where you render the message parts:
message.parts.map((part, index) => {
  switch (part.type) {
    case 'step-start':
      // show step boundaries as horizontal lines:
      return index > 0 ? (
        <div key={index} className="text-gray-500">
          <hr className="my-2 border-gray-300" />
        </div>
      ) : null;
    case 'text':
    // ...
    case 'tool-askForConfirmation':
    case 'tool-getLocation':
    case 'tool-getWeatherInformation':
    // ...
  }
});
// ...
```

## Server-side Multi-Step Calls

You can also use multi-step calls on the server-side with `streamText`.
This works when all invoked tools have an `execute` function on the server side.

```tsx filename='app/api/chat/route.ts' highlight="15-21,24"
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage, stepCountIs } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages: convertToModelMessages(messages),
    tools: {
      getWeatherInformation: {
        description: 'show the weather in a given city to the user',
        inputSchema: z.object({ city: z.string() }),
        // tool has execute function:
        execute: async ({}: { city: string }) => {
          const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
          return weatherOptions[
            Math.floor(Math.random() * weatherOptions.length)
          ];
        },
      },
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
```

## Errors

Language models can make errors when calling tools.
By default, these errors are masked for security reasons, and show up as "An error occurred" in the UI.

To surface the errors, you can use the `onError` function when calling `toUIMessageResponse`.

```tsx
export function errorHandler(error: unknown) {
  if (error == null) {
    return 'unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}
```

```tsx
const result = streamText({
  // ...
});

return result.toUIMessageStreamResponse({
  onError: errorHandler,
});
```

In case you are using `createUIMessageResponse`, you can use the `onError` function when calling `toUIMessageResponse`:

```tsx
const response = createUIMessageResponse({
  // ...
  async execute(dataStream) {
    // ...
  },
  onError: error => `Custom error: ${error.message}`,
});
```
