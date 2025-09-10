---
trigger: model_decision
description: vercel ai sdk tool calling guide
---

## Tool Execution Options

When tools are called, they receive additional options as a second parameter.

### Tool Call ID

The ID of the tool call is forwarded to the tool execution.
You can use it e.g. when sending tool-call related information with stream data.

```ts highlight="14-20"
import {
  streamText,
  tool,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const result = streamText({
        // ...
        messages,
        tools: {
          myTool: tool({
            // ...
            execute: async (args, { toolCallId }) => {
              // return e.g. custom status for tool call
              writer.write({
                type: 'data-tool-status',
                id: toolCallId,
                data: {
                  name: 'myTool',
                  status: 'in-progress',
                },
              });
              // ...
            },
          }),
        },
      });

      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
}
```

### Messages

The messages that were sent to the language model to initiate the response that contained the tool call are forwarded to the tool execution.
You can access them in the second parameter of the `execute` function.
In multi-step calls, the messages contain the text, tool calls, and tool results from all previous steps.

```ts highlight="8-9"
import { generateText, tool } from 'ai';

const result = await generateText({
  // ...
  tools: {
    myTool: tool({
      // ...
      execute: async (args, { messages }) => {
        // use the message history in e.g. calls to other language models
        return { ... };
      },
    }),
  },
});
```

### Abort Signals

The abort signals from `generateText` and `streamText` are forwarded to the tool execution.
You can access them in the second parameter of the `execute` function and e.g. abort long-running computations or forward them to fetch calls inside tools.

```ts highlight="6,11,14"
import { z } from 'zod';
import { generateText, tool } from 'ai';

const result = await generateText({
  model: 'openai/gpt-4.1',
  abortSignal: myAbortSignal, // signal that will be forwarded to tools
  tools: {
    weather: tool({
      description: 'Get the weather in a location',
      inputSchema: z.object({ location: z.string() }),
      execute: async ({ location }, { abortSignal }) => {
        return fetch(
          `https://api.weatherapi.com/v1/current.json?q=${location}`,
          { signal: abortSignal }, // forward the abort signal to fetch
        );
      },
    }),
  },
  prompt: 'What is the weather in San Francisco?',
});
```

### Context (experimental)

You can pass in arbitrary context from `generateText` or `streamText` via the `experimental_context` setting.
This context is available in the `experimental_context` tool execution option.

```ts
const result = await generateText({
  // ...
  tools: {
    someTool: tool({
      // ...
      execute: async (input, { experimental_context: context }) => {
        const typedContext = context as { example: string }; // or use type validation library
        // ...
      },
    }),
  },
  experimental_context: { example: '123' },
});
```

## Types

Modularizing your code often requires defining types to ensure type safety and reusability.
To enable this, the AI SDK provides several helper types for tools, tool calls, and tool results.

You can use them to strongly type your variables, function parameters, and return types
in parts of the code that are not directly related to `streamText` or `generateText`.

Each tool call is typed with `ToolCall<NAME extends string, ARGS>`, depending
on the tool that has been invoked.
Similarly, the tool results are typed with `ToolResult<NAME extends string, ARGS, RESULT>`.

The tools in `streamText` and `generateText` are defined as a `ToolSet`.
The type inference helpers `TypedToolCall<TOOLS extends ToolSet>`
and `TypedToolResult<TOOLS extends ToolSet>` can be used to
extract the tool call and tool result types from the tools.

```ts highlight="18-19,23-24"
import { openai } from '@ai-sdk/openai';
import { TypedToolCall, TypedToolResult, generateText, tool } from 'ai';
import { z } from 'zod';

const myToolSet = {
  firstTool: tool({
    description: 'Greets the user',
    inputSchema: z.object({ name: z.string() }),
    execute: async ({ name }) => `Hello, ${name}!`,
  }),
  secondTool: tool({
    description: 'Tells the user their age',
    inputSchema: z.object({ age: z.number() }),
    execute: async ({ age }) => `You are ${age} years old!`,
  }),
};

type MyToolCall = TypedToolCall<typeof myToolSet>;
type MyToolResult = TypedToolResult<typeof myToolSet>;

async function generateSomething(prompt: string): Promise<{
  text: string;
  toolCalls: Array<MyToolCall>; // typed tool calls
  toolResults: Array<MyToolResult>; // typed tool results
}> {
  return generateText({
    model: openai('gpt-4.1'),
    tools: myToolSet,
    prompt,
  });
}
```