---
trigger: model_decision
description: vercel ai sdk tool calling guide
---

# Tool Calling

As covered under Foundations, [tools](/docs/foundations/tools) are objects that can be called by the model to perform a specific task.
AI SDK Core tools contain three elements:

- **`description`**: An optional description of the tool that can influence when the tool is picked.
- **`inputSchema`**: A [Zod schema](/docs/foundations/tools#schemas) or a [JSON schema](/docs/reference/ai-sdk-core/json-schema) that defines the input parameters. The schema is consumed by the LLM, and also used to validate the LLM tool calls.
- **`execute`**: An optional async function that is called with the inputs from the tool call. It produces a value of type `RESULT` (generic type). It is optional because you might want to forward tool calls to the client or to a queue instead of executing them in the same process.

<Note className="mb-2">
  You can use the [`tool`](/docs/reference/ai-sdk-core/tool) helper function to
  infer the types of the `execute` parameters.
</Note>

The `tools` parameter of `generateText` and `streamText` is an object that has the tool names as keys and the tools as values:

```ts highlight="6-17"
import { z } from 'zod';
import { generateText, tool } from 'ai';

const result = await generateText({
  model: 'openai/gpt-4o',
  tools: {
    weather: tool({
      description: 'Get the weather in a location',
      inputSchema: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
      }),
    }),
  },
  prompt: 'What is the weather in San Francisco?',
});
```

<Note>
  When a model uses a tool, it is called a "tool call" and the output of the
  tool is called a "tool result".
</Note>

Tool calling is not restricted to only text generation.
You can also use it to render user interfaces (Generative UI).

## Multi-Step Calls (using stopWhen)

With the `stopWhen` setting, you can enable multi-step calls in `generateText` and `streamText`. When `stopWhen` is set and the model generates a tool call, the AI SDK will trigger a new generation passing in the tool result until there are no further tool calls or the stopping condition is met.

<Note>
  The `stopWhen` conditions are only evaluated when the last step contains tool
  results.
</Note>

By default, when you use `generateText` or `streamText`, it triggers a single generation. This works well for many use cases where you can rely on the model's training data to generate a response. However, when you provide tools, the model now has the choice to either generate a normal text response, or generate a tool call. If the model generates a tool call, it's generation is complete and that step is finished.

You may want the model to generate text after the tool has been executed, either to summarize the tool results in the context of the users query. In many cases, you may also want the model to use multiple tools in a single response. This is where multi-step calls come in.

You can think of multi-step calls in a similar way to a conversation with a human. When you ask a question, if the person does not have the requisite knowledge in their common knowledge (a model's training data), the person may need to look up information (use a tool) before they can provide you with an answer. In the same way, the model may need to call a tool to get the information it needs to answer your question where each generation (tool call or text generation) is a step.

### Example

In the following example, there are two steps:

1. **Step 1**
   1. The prompt `'What is the weather in San Francisco?'` is sent to the model.
   1. The model generates a tool call.
   1. The tool call is executed.
1. **Step 2**
   1. The tool result is sent to the model.
   1. The model generates a response considering the tool result.

```ts highlight="18-19"
import { z } from 'zod';
import { generateText, tool, stepCountIs } from 'ai';

const { text, steps } = await generateText({
  model: 'openai/gpt-4o',
  tools: {
    weather: tool({
      description: 'Get the weather in a location',
      inputSchema: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
      }),
    }),
  },
  stopWhen: stepCountIs(5), // stop after a maximum of 5 steps if tools were called
  prompt: 'What is the weather in San Francisco?',
});
```

<Note>You can use `streamText` in a similar way.</Note>

### Steps

To access intermediate tool calls and results, you can use the `steps` property in the result object
or the `streamText` `onFinish` callback.
It contains all the text, tool calls, tool results, and more from each step.

#### Example: Extract tool results from all steps

```ts highlight="3,9-10"
import { generateText } from 'ai';

const { steps } = await generateText({
  model: openai('gpt-4o'),
  stopWhen: stepCountIs(10),
  // ...
});

// extract all tool calls from the steps:
const allToolCalls = steps.flatMap(step => step.toolCalls);
```

### `onStepFinish` callback

When using `generateText` or `streamText`, you can provide an `onStepFinish` callback that
is triggered when a step is finished,
i.e. all text deltas, tool calls, and tool results for the step are available.
When you have multiple steps, the callback is triggered for each step.

```tsx highlight="5-7"
import { generateText } from 'ai';

const result = await generateText({
  // ...
  onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
    // your own logic, e.g. for saving the chat history or recording usage
  },
});
```

### `prepareStep` callback

The `prepareStep` callback is called before a step is started.

It is called with the following parameters:

- `model`: The model that was passed into `generateText`.
- `stopWhen`: The stopping condition that was passed into `generateText`.
- `stepNumber`: The number of the step that is being executed.
- `steps`: The steps that have been executed so far.
- `messages`: The messages that will be sent to the model for the current step.

You can use it to provide different settings for a step, including modifying the input messages.

```tsx highlight="5-7"
import { generateText } from 'ai';

const result = await generateText({
  // ...
  prepareStep: async ({ model, stepNumber, steps, messages }) => {
    if (stepNumber === 0) {
      return {
        // use a different model for this step:
        model: modelForThisParticularStep,
        // force a tool choice for this step:
        toolChoice: { type: 'tool', toolName: 'tool1' },
        // limit the tools that are available for this step:
        activeTools: ['tool1'],
      };
    }

    // when nothing is returned, the default settings are used
  },
});
```

#### Message Modification for Longer Agentic Loops

In longer agentic loops, you can use the `messages` parameter to modify the input messages for each step. This is particularly useful for prompt compression:

```tsx
prepareStep: async ({ stepNumber, steps, messages }) => {
  // Compress conversation history for longer loops
  if (messages.length > 20) {
    return {
      messages: messages.slice(-10),
    };
  }

  return {};
},
```

## Response Messages

Adding the generated assistant and tool messages to your conversation history is a common task,
especially if you are using multi-step tool calls.

Both `generateText` and `streamText` have a `response.messages` property that you can use to
add the assistant and tool messages to your conversation history.
It is also available in the `onFinish` callback of `streamText`.

The `response.messages` property contains an array of `ModelMessage` objects that you can add to your conversation history:

```ts
import { generateText, ModelMessage } from 'ai';

const messages: ModelMessage[] = [
  // ...
];

const { response } = await generateText({
  // ...
  messages,
});

// add the response messages to your conversation history:
messages.push(...response.messages); // streamText: ...((await response).messages)
```

## Dynamic Tools

AI SDK Core supports dynamic tools for scenarios where tool schemas are not known at compile time. This is useful for:

- MCP (Model Context Protocol) tools without schemas
- User-defined functions at runtime
- Tools loaded from external sources

### Using dynamicTool

The `dynamicTool` helper creates tools with unknown input/output types:

```ts
import { dynamicTool } from 'ai';
import { z } from 'zod';

const customTool = dynamicTool({
  description: 'Execute a custom function',
  inputSchema: z.object({}),
  execute: async input => {
    // input is typed as 'unknown'
    // You need to validate/cast it at runtime
    const { action, parameters } = input as any;

    // Execute your dynamic logic
    return { result: `Executed ${action}` };
  },
});
```

### Type-Safe Handling

When using both static and dynamic tools, use the `dynamic` flag for type narrowing:

```ts
const result = await generateText({
  model: 'openai/gpt-4o',
  tools: {
    // Static tool with known types
    weather: weatherTool,
    // Dynamic tool
    custom: dynamicTool({
      /* ... */
    }),
  },
  onStepFinish: ({ toolCalls, toolResults }) => {
    // Type-safe iteration
    for (const toolCall of toolCalls) {
      if (toolCall.dynamic) {
        // Dynamic tool: input is 'unknown'
        console.log('Dynamic:', toolCall.toolName, toolCall.input);
        continue;
      }

      // Static tool: full type inference
      switch (toolCall.toolName) {
        case 'weather':
          console.log(toolCall.input.location); // typed as string
          break;
      }
    }
  },
});
```

## Preliminary Tool Results

You can return an `AsyncIterable` over multiple results.
In this case, the last value from the iterable is the final tool result.

This can be used in combination with generator functions to e.g. stream status information
during the tool execution:

```ts
tool({
  description: 'Get the current weather.',
  inputSchema: z.object({
    location: z.string(),
  }),
  async *execute({ location }) {
    yield {
      status: 'loading' as const,
      text: `Getting weather for ${location}`,
      weather: undefined,
    };

    await new Promise(resolve => setTimeout(resolve, 3000));

    const temperature = 72 + Math.floor(Math.random() * 21) - 10;

    yield {
      status: 'success' as const,
      text: `The weather in ${location} is ${temperature}°F`,
      temperature,
    };
  },
});
```

## Tool Choice

You can use the `toolChoice` setting to influence when a tool is selected.
It supports the following settings:

- `auto` (default): the model can choose whether and which tools to call.
- `required`: the model must call a tool. It can choose which tool to call.
- `none`: the model must not call tools
- `{ type: 'tool', toolName: string (typed) }`: the model must call the specified tool

```ts highlight="18"
import { z } from 'zod';
import { generateText, tool } from 'ai';

const result = await generateText({
  model: 'openai/gpt-4o',
  tools: {
    weather: tool({
      description: 'Get the weather in a location',
      inputSchema: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
      }),
    }),
  },
  toolChoice: 'required', // force the model to call a tool
  prompt: 'What is the weather in San Francisco?',
});
```