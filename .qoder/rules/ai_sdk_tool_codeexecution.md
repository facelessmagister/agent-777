---
trigger: model_decision
description: how to enable code execution in vercel ai sdk using freestyle API
---

---
title: Vercel AI SDK
description: Code execution for Vercel AI SDK Agents
---

import { Steps, Step } from "fumadocs-ui/components/steps";

<Steps>
<Step>
### Install the required dependencies
```bash
npm install ai @ai-sdk/openai freestyle-sandboxes
```
</Step>
<Step>
    Get your Freestyle API Key from the [Freestyle Dashboard](https://admin.freestyle.sh)
</Step>
<Step>
### Set up the Code Executor

The simplest code executor looks like this:

```ts
import { executeTool } from "freestyle-sandboxes/ai";

const codeExecutor = executeTool({
  apiKey: process.env.FREESTYLE_API_KEY!,
});
```

You can also pass in any **nodeModules**, **environment variables**, **timeout**, or **network restrictions** you need.

Here's an example with access to the `resend` and `octokit` node modules, and environment variables for `RESEND_API_KEY` and `GITHUB_PERSONAL_ACCESS_TOKEN`:

```ts
import { executeTool } from "freestyle-sandboxes/ai";

const codeExecutor = executeTool({
  apiKey: process.env.FREESTYLE_API_KEY!,
  nodeModules: {
    resend: "4.0.1",
    octokit: "4.1.0",
  },
  envVars: {
    RESEND_API_KEY: process.env.RESEND_API_KEY!,
    GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN!,
  },
});
```

</Step>
<Step>
### Set up the Vercel AI SDK Agent

```ts
const openai = createOpenAI({
  compatibility: "strict",
  apiKey: process.env.OPENAI_API_KEY!,
});

const { text, steps } = await generateText({
  model: openai("gpt-4o"),
  tools: {
    codeExecutor,
  },
  maxSteps: 5,
  maxRetries: 0,
  prompt: "Ask the AI to do whatever you want",
});
```

</Step>
</Steps>

### Notes

- You can actually give it multiple code executors with different node modules, different environment variables, and different network restrictions.
- When the AI writes invalid code, or the code gets errors they will be returned in the response. If the AI has steps left, it will try to fix the code and continue.
- If you add a node module we haven't seen before, the first time you run it it will take longer because we have to install the node module. After that, it will be cached and return to normal speed.
