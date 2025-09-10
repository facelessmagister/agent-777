---
trigger: model_decision
description: vercel ai sdk tool calling guide
---

## Handling Errors

The AI SDK has three tool-call related errors:

- [`NoSuchToolError`](/docs/reference/ai-sdk-errors/ai-no-such-tool-error): the model tries to call a tool that is not defined in the tools object
- [`InvalidToolInputError`](/docs/reference/ai-sdk-errors/ai-invalid-tool-input-error): the model calls a tool with inputs that do not match the tool's input schema
- [`ToolCallRepairError`](/docs/reference/ai-sdk-errors/ai-tool-call-repair-error): an error that occurred during tool call repair

When tool execution fails (errors thrown by your tool's `execute` function), the AI SDK adds them as `tool-error` content parts to enable automated LLM roundtrips in multi-step scenarios.

### `generateText`

`generateText` throws errors for tool schema validation issues and other errors, and can be handled using a `try`/`catch` block. Tool execution errors appear as `tool-error` parts in the result steps:

```ts
try {
  const result = await generateText({
    //...
  });
} catch (error) {
  if (NoSuchToolError.isInstance(error)) {
    // handle the no such tool error
  } else if (InvalidToolInputError.isInstance(error)) {
    // handle the invalid tool inputs error
  } else {
    // handle other errors
  }
}
```

Tool execution errors are available in the result steps:

```ts
const { steps } = await generateText({
  // ...
});

// check for tool errors in the steps
const toolErrors = steps.flatMap(step =>
  step.content.filter(part => part.type === 'tool-error'),
);

toolErrors.forEach(toolError => {
  console.log('Tool error:', toolError.error);
  console.log('Tool name:', toolError.toolName);
  console.log('Tool input:', toolError.input);
});
```

### `streamText`

`streamText` sends errors as part of the full stream. Tool execution errors appear as `tool-error` parts, while other errors appear as `error` parts.

When using `toUIMessageStreamResponse`, you can pass an `onError` function to extract the error message from the error part and forward it as part of the stream response:

```ts
const result = streamText({
  // ...
});

return result.toUIMessageStreamResponse({
  onError: error => {
    if (NoSuchToolError.isInstance(error)) {
      return 'The model tried to call a unknown tool.';
    } else if (InvalidToolInputError.isInstance(error)) {
      return 'The model called a tool with invalid inputs.';
    } else {
      return 'An unknown error occurred.';
    }
  },
});
```

## Tool Call Repair

<Note type="warning">
  The tool call repair feature is experimental and may change in the future.
</Note>

Language models sometimes fail to generate valid tool calls,
especially when the input schema is complex or the model is smaller.

If you use multiple steps, those failed tool calls will be sent back to the LLM
in the next step to give it an opportunity to fix it.
However, you may want to control how invalid tool calls are repaired without requiring
additional steps that pollute the message history.

You can use the `experimental_repairToolCall` function to attempt to repair the tool call
with a custom function.

You can use different strategies to repair the tool call:

- Use a model with structured outputs to generate the inputs.
- Send the messages, system prompt, and tool schema to a stronger model to generate the inputs.
- Provide more specific repair instructions based on which tool was called.

### Example: Use a model with structured outputs for repair

```ts
import { openai } from '@ai-sdk/openai';
import { generateObject, generateText, NoSuchToolError, tool } from 'ai';

const result = await generateText({
  model,
  tools,
  prompt,

  experimental_repairToolCall: async ({
    toolCall,
    tools,
    inputSchema,
    error,
  }) => {
    if (NoSuchToolError.isInstance(error)) {
      return null; // do not attempt to fix invalid tool names
    }

    const tool = tools[toolCall.toolName as keyof typeof tools];

    const { object: repairedArgs } = await generateObject({
      model: openai('gpt-4.1'),
      schema: tool.inputSchema,
      prompt: [
        `The model tried to call the tool "${toolCall.toolName}"` +
          ` with the following inputs:`,
        JSON.stringify(toolCall.input),
        `The tool accepts the following schema:`,
        JSON.stringify(inputSchema(toolCall)),
        'Please fix the inputs.',
      ].join('\n'),
    });

    return { ...toolCall, input: JSON.stringify(repairedArgs) };
  },
});
```

### Example: Use the re-ask strategy for repair

```ts
import { openai } from '@ai-sdk/openai';
import { generateObject, generateText, NoSuchToolError, tool } from 'ai';

const result = await generateText({
  model,
  tools,
  prompt,

  experimental_repairToolCall: async ({
    toolCall,
    tools,
    error,
    messages,
    system,
  }) => {
    const result = await generateText({
      model,
      system,
      messages: [
        ...messages,
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: toolCall.toolCallId,
              toolName: toolCall.toolName,
              input: toolCall.input,
            },
          ],
        },
        {
          role: 'tool' as const,
          content: [
            {
              type: 'tool-result',
              toolCallId: toolCall.toolCallId,
              toolName: toolCall.toolName,
              output: error.message,
            },
          ],
        },
      ],
      tools,
    });

    const newToolCall = result.toolCalls.find(
      newToolCall => newToolCall.toolName === toolCall.toolName,
    );

    return newToolCall != null
      ? {
          toolCallType: 'function' as const,
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName,
          input: JSON.stringify(newToolCall.input),
        }
      : null;
  },
});
```