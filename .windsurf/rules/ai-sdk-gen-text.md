---
trigger: model_decision
description: how to use generateText()
---

# `generateText()`

Generates text and calls tools for a given prompt using a language model.

It is ideal for non-interactive use cases such as automation tasks where you need to write text (e.g. drafting email or summarizing web pages) and for agents that use tools.

```ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const { text } = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Invent a new holiday and describe its traditions.',
});

console.log(text);
```

## Import

import { generateText } from "ai"


---



