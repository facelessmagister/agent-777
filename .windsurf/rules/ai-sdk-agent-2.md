---
trigger: model_decision
description: a guide on creating agents in vercel ai sdk
---

### Evaluator-Optimizer

This pattern introduces quality control into workflows by having dedicated evaluation steps that assess intermediate results. Based on the evaluation, the workflow can either proceed, retry with adjusted parameters, or take corrective action. This creates more robust workflows capable of self-improvement and error recovery.

```ts
import { openai } from '@ai-sdk/openai';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

async function translateWithFeedback(text: string, targetLanguage: string) {
  let currentTranslation = '';
  let iterations = 0;
  const MAX_ITERATIONS = 3;

  // Initial translation
  const { text: translation } = await generateText({
    model: openai('gpt-4o-mini'), // use small model for first attempt
    system: 'You are an expert literary translator.',
    prompt: `Translate this text to ${targetLanguage}, preserving tone and cultural nuances:
    ${text}`,
  });

  currentTranslation = translation;

  // Evaluation-optimization loop
  while (iterations < MAX_ITERATIONS) {
    // Evaluate current translation
    const { object: evaluation } = await generateObject({
      model: openai('gpt-4o'), // use a larger model to evaluate
      schema: z.object({
        qualityScore: z.number().min(1).max(10),
        preservesTone: z.boolean(),
        preservesNuance: z.boolean(),
        culturallyAccurate: z.boolean(),
        specificIssues: z.array(z.string()),
        improvementSuggestions: z.array(z.string()),
      }),
      system: 'You are an expert in evaluating literary translations.',
      prompt: `Evaluate this translation:

      Original: ${text}
      Translation: ${currentTranslation}

      Consider:
      1. Overall quality
      2. Preservation of tone
      3. Preservation of nuance
      4. Cultural accuracy`,
    });

    // Check if quality meets threshold
    if (
      evaluation.qualityScore >= 8 &&
      evaluation.preservesTone &&
      evaluation.preservesNuance &&
      evaluation.culturallyAccurate
    ) {
      break;
    }

    // Generate improved translation based on feedback
    const { text: improvedTranslation } = await generateText({
      model: openai('gpt-4o'), // use a larger model
      system: 'You are an expert literary translator.',
      prompt: `Improve this translation based on the following feedback:
      ${evaluation.specificIssues.join('\n')}
      ${evaluation.improvementSuggestions.join('\n')}

      Original: ${text}
      Current Translation: ${currentTranslation}`,
    });

    currentTranslation = improvedTranslation;
    iterations++;
  }

  return {
    finalTranslation: currentTranslation,
    iterationsRequired: iterations,
  };
}
```

## Multi-Step Tool Usage

If your use case involves solving problems where the solution path is poorly defined or too complex to map out as a workflow in advance, you may want to provide the LLM with a set of lower-level tools and allow it to break down the task into small pieces that it can solve on its own iteratively, without discrete instructions. To implement this kind of agentic pattern, you need to call an LLM in a loop until a task is complete. The AI SDK makes this simple with the `stopWhen` parameter.

The AI SDK gives you control over the stopping conditions, enabling you to keep the LLM running until one of the conditions are met. The SDK automatically triggers an additional request to the model after every tool result (each request is considered a "step"), continuing until the model does not generate a tool call or other stopping conditions (e.g. `stepCountIs`) you define are satisfied.

<Note>`stopWhen` can be used with both `generateText` and `streamText`</Note>

### Using `stopWhen`

This example demonstrates how to create an agent that solves math problems.
It has a calculator tool (using [math.js](https://mathjs.org/)) that it can call to evaluate mathematical expressions.

```ts file='main.ts'
import { openai } from '@ai-sdk/openai';
import { generateText, tool, stepCountIs } from 'ai';
import * as mathjs from 'mathjs';
import { z } from 'zod';

const { text: answer } = await generateText({
  model: openai('gpt-4o-2024-08-06'),
  tools: {
    calculate: tool({
      description:
        'A tool for evaluating mathematical expressions. ' +
        'Example expressions: ' +
        "'1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.",
      inputSchema: z.object({ expression: z.string() }),
      execute: async ({ expression }) => mathjs.evaluate(expression),
    }),
  },
  stopWhen: stepCountIs(10),
  system:
    'You are solving math problems. ' +
    'Reason step by step. ' +
    'Use the calculator when necessary. ' +
    'When you give the final answer, ' +
    'provide an explanation for how you arrived at it.',
  prompt:
    'A taxi driver earns $9461 per 1-hour of work. ' +
    'If he works 12 hours a day and in 1 hour ' +
    'he uses 12 liters of petrol with a price  of $134 for 1 liter. ' +
    'How much money does he earn in one day?',
});

console.log(`ANSWER: ${answer}`);
```

### Structured Answers

When building an agent for tasks like mathematical analysis or report generation, it's often useful to have the agent's final output structured in a consistent format that your application can process. You can use an **answer tool** and the `toolChoice: 'required'` setting to force the LLM to answer with a structured output that matches the schema of the answer tool. The answer tool has no `execute` function, so invoking it will terminate the agent.

```ts highlight="6,16-29,31,45"
import { openai } from '@ai-sdk/openai';
import { generateText, tool, stepCountIs } from 'ai';
import 'dotenv/config';
import { z } from 'zod';

const { toolCalls } = await generateText({
  model: openai('gpt-4o-2024-08-06'),
  tools: {
    calculate: tool({
      description:
        'A tool for evaluating mathematical expressions. Example expressions: ' +
        "'1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.",
      inputSchema: z.object({ expression: z.string() }),
      execute: async ({ expression }) => mathjs.evaluate(expression),
    }),
    // answer tool: the LLM will provide a structured answer
    answer: tool({
      description: 'A tool for providing the final answer.',
      inputSchema: z.object({
        steps: z.array(
          z.object({
            calculation: z.string(),
            reasoning: z.string(),
          }),
        ),
        answer: z.string(),
      }),
      // no execute function - invoking it will terminate the agent
    }),
  },
  toolChoice: 'required',
  stopWhen: stepCountIs(10),
  system:
    'You are solving math problems. ' +
    'Reason step by step. ' +
    'Use the calculator when necessary. ' +
    'The calculator can only do simple additions, subtractions, multiplications, and divisions. ' +
    'When you give the final answer, provide an explanation for how you got it.',
  prompt:
    'A taxi driver earns $9461 per 1-hour work. ' +
    'If he works 12 hours a day and in 1 hour he uses 14-liters petrol with price $134 for 1-liter. ' +
    'How much money does he earn in one day?',
});

console.log(`FINAL TOOL CALLS: ${JSON.stringify(toolCalls, null, 2)}`);
```

<Note>
  You can also use the
  [`experimental_output`](/docs/ai-sdk-core/generating-structured-data#structured-output-with-generatetext)
  setting for `generateText` to generate structured outputs.
</Note>

### Accessing all steps

Calling `generateText` with `stopWhen` can result in several calls to the LLM (steps).
You can access information from all steps by using the `steps` property of the response.

```ts highlight="3,9-10"
import { generateText, stepCountIs } from 'ai';

const { steps } = await generateText({
  model: openai('gpt-4o'),
  stopWhen: stepCountIs(10),
  // ...
});

// extract all tool calls from the steps:
const allToolCalls = steps.flatMap(step => step.toolCalls);
```

### Getting notified on each completed step

You can use the `onStepFinish` callback to get notified on each completed step.
It is triggered when a step is finished,
i.e. all text deltas, tool calls, and tool results for the step are available.

```tsx highlight="6-8"
import { generateText, stepCountIs } from 'ai';

const result = await generateText({
  model: 'openai/gpt-4.1',
  stopWhen: stepCountIs(10),
  onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
    // your own logic, e.g. for saving the chat history or recording usage
  },
  // ...
});
```
