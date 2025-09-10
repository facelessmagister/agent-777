---
trigger: model_decision
description: how to use streamText() which Streams text generations from a language model
---

You can use the streamText function for interactive use cases such as chat bots and other real-time applications. You can also generate UI components with tools.


import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

const { textStream } = streamText({
  model: openai('gpt-4o'),
  prompt: 'Invent a new holiday and describe its traditions.',
});

for await (const textPart of textStream) {
  process.stdout.write(textPart);
}
To see streamText in action, check out these examples.

# Import

import { streamText } from "ai"