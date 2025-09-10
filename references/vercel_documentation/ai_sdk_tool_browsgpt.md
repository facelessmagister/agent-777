---
trigger: model_decision
description: how to integrate browsgpt with ai sdk to enable internet search 
---
# BrowseGPT

> BrowseGPT is a tool that allows you to search the web using a chat interface.

## Introduction

[BrowseGPT](https://www.browsegpt.dev) is a tool that allows you to search the web using a chat interface.

It is built on top of the [Vercel AI SDK](https://sdk.vercel.ai/docs/introduction) and [Browserbase](https://www.browserbase.com).

<Frame>
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/browserbase/images/integrations/vercel/browsegpt.gif" />
</Frame>

## What this tutorial covers

* Access and scrape website posts and contents using Browserbase

* Use the Vercel AI SDK to create a chat interface

* Stream the results from the LLM

## Usage

To use BrowseGPT, you need to have the Vercel AI SDK and Browserbase installed.

We recommend using the following packages:

* [ai](https://www.npmjs.com/package/ai) for the chat interface
* [zod](https://www.npmjs.com/package/zod) for data validation
* [playwright](https://www.npmjs.com/package/playwright) for web-scraping
* [@vercel/ai](https://www.npmjs.com/package/@vercel/ai) for the Vercel AI SDK
* [@mozilla/readability](https://www.npmjs.com/package/@mozilla/readability) for the readability library
* [jsdom](https://www.npmjs.com/package/jsdom) for DOM manipulation

```bash
npm install ai zod playwright @vercel/ai @mozilla/readability jsdom
```

## Getting Started

For this tutorial, you'll need:

1. Browserbase credentials:

   * [API key](https://www.browserbase.com/settings)
   * [Project ID](https://www.browserbase.com/settings)

2. An LLM API key from one of the following:
   * [OpenAI](https://platform.openai.com/)
   * [Anthropic](https://www.anthropic.com/)
   * [Any LLM supported by Vercel AI SDK](https://sdk.vercel.ai/docs/introduction#model-providers)

<Info>
  Browserbase sessions often run longer than 15 seconds. By signing up for the
  Pro Plan on [Vercel](https://vercel.com/pricing), you can increase the Vercel
  function duration limit.
</Info>

## Imports and Dependencies

Nextjs uses [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) to handle API requests.

These include methods such as `GET`, `POST`, `PUT`, `DELETE`, etc.

To create a new route handler, create a new file in the `app/api` directory.

In this example, we'll call this file `route.ts` for the chat route.

From here, we'll import the necessary dependencies.

```typescript route.ts
import { openai } from "@ai-sdk/openai";
import { streamText, convertToCoreMessages, tool, generateText } from "ai";
import { z } from "zod";
import { chromium } from "playwright";
import { anthropic } from "@ai-sdk/anthropic";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
```

This section imports necessary libraries and modules for the application.

It includes the Vercel AI SDK, Zod for schema validation, Playwright for web automation, and libraries for content extraction and processing.

## Helper Functions

These are utility functions used throughout the application.

`getDebugUrl` fetches debug information for a Browserbase session, while `createSession` initializes a new Browserbase session for web interactions.

```typescript
// Get the debug URL for a Browserbase session
async function getDebugUrl(id: string) {
  const response = await fetch(
    `https://api.browserbase.com/v1/sessions/${id}/debug`,
    {
      method: "GET",
      headers: {
        "x-bb-api-key": process.env.BROWSERBASE_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );
  const data = await response.json();
  return data;
}

// Create a new Browserbase session
async function createSession() {
  const response = await fetch(`https://api.browserbase.com/v1/sessions`, {
    method: "POST",
    headers: {
      "x-bb-api-key": process.env.BROWSERBASE_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
      keepAlive: true,
    }),
  });
  const data = await response.json();
  return { id: data.id, debugUrl: data.debugUrl };
}
```

## Main API Route Handler

This section sets up the main API route handler.

It configures the runtime environment, sets a maximum duration for the API call, and defines the POST method that will handle incoming requests.

You can see we use the Vercel AI SDK's streamText function to process messages and stream responses.

We set the maximum duration to 300 seconds (5 minutes), since our Browserbase sessions often run longer than 15 seconds (Vercel's default timeout).

```typescript route.ts
// Set the maximum duration to 300 seconds (5 minutes)
export const maxDuration = 300;

// POST method to handle incoming requests
export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    experimental_toolCallStreaming: true,
    model: openai("gpt-4-turbo"),
    messages: convertToCoreMessages(messages),
    tools: {
      // ... (tool definitions)
    },
  });

  return result.toDataStreamResponse();
}
```

## Tools

Next, we'll create the tools needed for this Route Handler. These tools would be used depending on the user's request.

For example, if they want to search the web, we'll use the `googleSearch` tool. If they want to get the content of a page, we'll use the `getPageContent` tool.

Keep in mind that you have the option to choose any LLM model that is compatible with the [Vercel AI SDK](https://sdk.vercel.ai/docs/introduction#model-providers).

We found that using `gpt-4-turbo` was the best for tool calling, and `claude-3-5-sonnet-20241022` was the best for generating responses.

### Create Browserbase Session tool

This tool creates a new Browserbase session. It's used when a fresh browsing context is needed for web interactions.

The tool returns the session ID and debug URL, which are used in subsequent operations.

```typescript
createSession: tool({
  description: 'Create a new Browserbase session',
  parameters: z.object({}),
  execute: async () => {
    const session = await createSession();
    const debugUrl = await getDebugUrl(session.id);
    return { sessionId: session.id, debugUrl: debugUrl.debuggerFullscreenUrl, toolName: 'Creating a new session'};
  },
}),
```

As you can see, we used the `createSession()` and `getDebugUrl()` we made earlier to create a new Browserbase session and get the debug URL.

This is so later we can embed the debug URL in the response and our frontend can use it to view the Browserbase session.

### Google Search tool

This tool performs a search on the web using Browserbase. It takes a search query as input and returns the search results.

```typescript
googleSearch: tool({
  description: 'Search Google for a query',
  parameters: z.object({
    // ... (similar parameters as createSession tool)
  }),
  execute: async ({ query, sessionId }) => {
    // ... (debug URL and browser connection setup)

    const defaultContext = browser.contexts()[0];
    const page = defaultContext.pages()[0];

    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForLoadState('load', { timeout: 10000 });

    await page.waitForSelector('.g');

    const results = await page.evaluate(() => {
        const items = document.querySelectorAll('.g');
        return Array.from(items).map(item => {
        const title = item.querySelector('h3')?.textContent || '';
        const description = item.querySelector('.VwiC3b')?.textContent || '';
        return { title, description };
        });
    });

    const text = results.map(item => `${item.title}\n${item.description}`).join('\n\n');

    const response = await generateText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        prompt: `Evaluate the following web page content: ${text}`,
    });

    return {
        toolName: 'Searching Google',
        content: response.text,
        dataCollected: true,
    };
  },
}),
```

### Ask for Confirmation tool

This tool asks the user for confirmation before performing a specific action.

It takes a confirmation prompt as input and returns the user's response.

```typescript
askForConfirmation: tool({
  description: 'Ask the user for confirmation.',
  parameters: z.object({
    message: z.string().describe('The message to ask for confirmation.'),
  }),
}),
```

### Get Page Content tool

The last tool we'll create is the `getPageContent` tool.

This tool retrieves the content of a web page using [Playwright](https://playwright.dev/). It then uses [jsdom](https://github.com/jsdom/jsdom) to parse the HTML content into a DOM structure and [Readability](https://github.com/mozilla/readability) to extract the main content of the page.

Finally, it uses the [Anthropic Claude](https://www.anthropic.com/) model to generate a summary of the page's content.

```typescript
getPageContent: tool({
  description: 'Get the content of a page using Playwright',
  parameters: z.object({
    url: z.string().describe('The URL of the page to fetch content from'),
    sessionId: z.string().describe('The Browserbase session ID to use'),
  }),
  execute: async ({ url, sessionId }) => {
    // Get debug URL and connect to Browserbase session
    const debugUrl = await getDebugUrl(sessionId);
    const browser = await chromium.connectOverCDP(debugUrl.debuggerFullscreenUrl);

    // Get the default context and page
    const defaultContext = browser.contexts()[0];
    const page = defaultContext.pages()[0];

    // Navigate to the specified URL
    await page.goto(url, { waitUntil: 'networkidle' });

    // Get the page content
    const content = await page.content();

    // Use Readability to extract the main content
    const dom = new JSDOM(content);
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    let extractedContent = '';
    if (article) {
      // If Readability successfully parsed the content, use it
      extractedContent = article.textContent;
    } else {
      // Fallback: extract all text from the body
      extractedContent = await page.evaluate(() => document.body.innerText);
    }

    // Generate a summary using the Anthropic Claude model
    const response = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      prompt: `Summarize the following web page content: ${extractedContent}`,
    });

    // Return the structured response
    return {
      toolName: 'Getting page content',
      content: response.text,
      dataCollected: true,
    };
  },
}),
```

## Frontend

Now that we have our tools and route handler set up, we can create our frontend.

We'll use the [useChat](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat) hook to create a chat interface.

Here's a simple example of how to use BrowseGPT in a Next.js frontend application:

```typescript
'use client';

import { useChat } from 'ai/react';
import { useState, useEffect } from 'react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    maxSteps: 5,
  });

  const [showAlert, setShowAlert] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (isLoading) {
      setShowAlert(true);
      setStatusMessage('The AI is currently processing your request. Please wait.');
      setSessionId(null);
    } else {
      setShowAlert(false);
    }
  }, [isLoading, messages]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.toolInvocations) {
      for (const invocation of lastMessage.toolInvocations) {
        if ('result' in invocation && invocation.result?.sessionId) {
          setSessionId(invocation.result.sessionId);
          break;
        }
      }
    }
  }, [messages]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow flex flex-col w-full max-w-xl mx-auto py-4 px-4">
        {messages.map((m) => (
          <div key={m.id} className="whitespace-pre-wrap">
            <strong>{m.role === 'user' ? 'User: ' : 'AI: '}</strong>
            <p>{m.content}</p>
          </div>
        ))}

        {showAlert && (
          <div className="my-4">
            <p>{statusMessage}</p>
          </div>
        )}
      </div>

      <div className="w-full max-w-xl mx-auto px-4 py-4">
        <form onSubmit={handleSubmit} className="flex">
          <input
            className="flex-grow p-2 border border-gray-300"
            value={input}
            placeholder="Ask anything..."
            onChange={handleInputChange}
          />
          <button type="submit" disabled={!input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
```

## Conclusion

You've now seen how to use the Vercel AI SDK to create a chat interface that can search the web using Browserbase.


