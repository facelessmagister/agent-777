---
trigger: model_decision
description: how and when to use language model middleware to enhance language model behavior
---

### Caching

This example shows how to build a simple cache for the generated text of a language model call.

```ts
import type { LanguageModelV2Middleware } from '@ai-sdk/provider';

const cache = new Map<string, any>();

export const yourCacheMiddleware: LanguageModelV2Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    const cacheKey = JSON.stringify(params);

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const result = await doGenerate();

    cache.set(cacheKey, result);

    return result;
  },

  // here you would implement the caching logic for streaming
};
```

### Retrieval Augmented Generation (RAG)

This example shows how to use RAG as middleware.

<Note>
  Helper functions like `getLastUserMessageText` and `findSources` are not part
  of the AI SDK. They are just used in this example to illustrate the concept of
  RAG.
</Note>

```ts
import type { LanguageModelV2Middleware } from '@ai-sdk/provider';

export const yourRagMiddleware: LanguageModelV2Middleware = {
  transformParams: async ({ params }) => {
    const lastUserMessageText = getLastUserMessageText({
      prompt: params.prompt,
    });

    if (lastUserMessageText == null) {
      return params; // do not use RAG (send unmodified parameters)
    }

    const instruction =
      'Use the following information to answer the question:\n' +
      findSources({ text: lastUserMessageText })
        .map(chunk => JSON.stringify(chunk))
        .join('\n');

    return addToLastUserMessage({ params, text: instruction });
  },
};
```

### Guardrails

Guard rails are a way to ensure that the generated text of a language model call
is safe and appropriate. This example shows how to use guardrails as middleware.

```ts
import type { LanguageModelV2Middleware } from '@ai-sdk/provider';

export const yourGuardrailMiddleware: LanguageModelV2Middleware = {
  wrapGenerate: async ({ doGenerate }) => {
    const { text, ...rest } = await doGenerate();

    // filtering approach, e.g. for PII or other sensitive information:
    const cleanedText = text?.replace(/badword/g, '<REDACTED>');

    return { text: cleanedText, ...rest };
  },

  // here you would implement the guardrail logic for streaming
  // Note: streaming guardrails are difficult to implement, because
  // you do not know the full content of the stream until it's finished.
};
```

## Configuring Per Request Custom Metadata

To send and access custom metadata in Middleware, you can use `providerOptions`. This is useful when building logging middleware where you want to pass additional context like user IDs, timestamps, or other contextual data that can help with tracking and debugging.

```ts
import { openai } from '@ai-sdk/openai';
import { generateText, wrapLanguageModel } from 'ai';
import type { LanguageModelV2Middleware } from '@ai-sdk/provider';

export const yourLogMiddleware: LanguageModelV2Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    console.log('METADATA', params?.providerMetadata?.yourLogMiddleware);
    const result = await doGenerate();
    return result;
  },
};

const { text } = await generateText({
  model: wrapLanguageModel({
    model: openai('gpt-4o'),
    middleware: yourLogMiddleware,
  }),
  prompt: 'Invent a new holiday and describe its traditions.',
  providerOptions: {
    yourLogMiddleware: {
      hello: 'world',
    },
  },
});

console.log(text);
```
