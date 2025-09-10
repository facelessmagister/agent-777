---
trigger: model_decision
description: how to integrate browserbase with ai sdk to provide internet access
---

# Vercel AI Integration

> Augment your Generative User Interfaces with web-browsing capabilities.

## Introduction

[Vercel](https://www.vercel.com) is the leading platform to develop and deploy front-end applications.

With the rise of AI applications built around chat interfaces, Vercel released the [Vercel AI SDK](https://sdk.vercel.ai/docs/introduction) to
help build smooth chat-based front-end experiences and experiment with multiple models on the back-end with Serverless Functions.

Vercel's Generative User Interface lets developers stream components directly to the front end, unlocking AI experiences beyond text-based chats.

Browserbase is a perfect addition to the Vercel AI SDK, bringing headless browser support to Serverless applications.

## Add Browserbase to your Vercel AI front-end

To get started, proceed to the [quickstart guide](/integrations/vercel/quickstart) to learn more about using Browserbase with Vercel AI.

<CardGroup cols={2}>
  <Card title="Browserbase for Vercel AI SDK" icon="book" iconType="sharp-solid" href="/integrations/vercel/quickstart">
    Configure Browserbase to add web-browsing capabilities to your Vercel AI
    application.
  </Card>

  <Card title="Nextjs Quickstart Template" icon="book" iconType="sharp-solid" href="https://github.com/browserbase/quickstart-nextjs">
    Nextjs Quickstart Template to get you started with Browserbase and Vercel AI
    SDK.
  </Card>

  <Card title="BrowseGPT Guide" icon="book" iconType="sharp-solid" href="/integrations/vercel/browsegpt">
    Guide to build BrowseGPT to search the web using a chat interface.
  </Card>

  <Card title="Puppeteer Guide" icon="xmark" iconType="sharp-solid" href="/integrations/vercel/puppeteer">
    Learn how to setup your project, deploy to Vercel, and scale with Browserbase
    using Puppeteer.
  </Card>
</CardGroup>

# Configure Browserbase for Vercel AI

<Tabs>
  <Tab title="API">
    <Steps titleSize="h3">
      <Step title="Get your API Key">
        Go over the [Dashboard's Settings tab](https://www.browserbase.com/settings):

        <Frame>
          <img src="https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/quickstart/api-key.png?maxW=2926&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=0e9567aa20d851820835d7b81344112b" width="2926" height="1492" data-path="images/quickstart/api-key.png" srcset="https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/quickstart/api-key.png?w=280&maxW=2926&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=e2a974fcf0dffeb2657c725f2febf56d 280w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/quickstart/api-key.png?w=560&maxW=2926&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=66c6b6867380b7c4911bf3f272a5c44a 560w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/quickstart/api-key.png?w=840&maxW=2926&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=1e7e5768f5aadf39077014afab1ccbe1 840w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/quickstart/api-key.png?w=1100&maxW=2926&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=3c813dd8ae2660b75c5abfb1c9cd17de 1100w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/quickstart/api-key.png?w=1650&maxW=2926&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=586f40089189a7164889a21ed75bb1f5 1650w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/quickstart/api-key.png?w=2500&maxW=2926&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=65d6f8a6d752c1109fa4d63f1687a823 2500w" data-optimize="true" data-opv="2" />
        </Frame>

        Then, copy your API key and project ID directly from the input and set the
        `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` environment variables.
      </Step>

      <Step title="Install the Vercel AI, Anthropic, Jsdom, Playwright, and Readability">
        We use Playwright to navigate the web and extract content, Jsdom to parse the HTML, and Readability to extract the text.

        As for the Vercel AI SDK and Anthropic, we use them to generate the prompts and handle the responses.

        ```bash
         npm i playwright ai jsdom @ai-sdk/anthropic @mozilla/readability
        ```
      </Step>

      <Step title="Create the Session">
        The session is created to allow the browser to connect to the Browserbase API.

        We'll use the session ID to create a connection to the browser and extract the content from the page.

        ```ts
        async function createSession() {
          const response = await fetch(`https://api.browserbase.com/v1/sessions`, {
            method: "POST",
            headers: {
              "x-bb-api-key": process.env.BROWSERBASE_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ projectId: process.env.BROWSERBASE_PROJECT_ID }),
          });
          const { id } = await response.json();
          return id;
        }
        ```
      </Step>

      <Step title="Create a function to receive and summarize the page content">
        In this step, we'll create a function to receive and summarize the page content. Based off a user's message, we'll create a search query and extract the content from the page.

        We'll use Jsdom to parse the HTML and Readability to extract the text.

        ```ts
        async function getPageInfo(message: string) {
          const sessionId = await createSession();
          const wsUrl = `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}&sessionId=${sessionId}`;

          const browser = await chromium.connectOverCDP(wsUrl);
          const page = browser.contexts()[0].pages()[0];

          const searchQuery = encodeURIComponent(`${message}?`);
          await page.goto(`https://www.google.com/search?q=${searchQuery}`);


          const content = await page.content();
          const dom = new JSDOM(content);
          const article = new Readability(dom.window.document).parse();
          await browser.close();

          return article?.textContent || '';
        }
        ```
      </Step>

      <Step title="Create the GET request to generate the summary">
        Next.js provides [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) that can be used to direct incoming requests to the appropriate server components.

        Below is an example of a route handler in the App Router, which processes the `GET` method using the Browserbase API and returns the text content of the page:

        ```ts
        export async function GET(request: Request) {
          const userMessage = "What is the weather in San Francisco?";

          const info = await getPageInfo(userMessage);

          const response = await generateText({
            model: anthropic("claude-3-5-sonnet-20241022"),
            messages: convertToCoreMessages([
              { role: "system", content: "You are a helpful assistant" },
              { role: "user", content: `Info: ${info}\n\nQuestion: ${userMessage}` }
            ]),
          });

          return new Response(JSON.stringify({ content: response.text }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        ```

        Be sure to store the `ANTHROPIC_API_KEY` environment variable in your `.env` file.
      </Step>
    </Steps>

    Congratulations! You've successfully created a `GET` request to generate the summary of the page content using the Browserbase API and Vercel AI SDK.

    In addition to learning how to use the Browserbase API with Vercel AI SDK, we've attached a [Browserbase x Nextjs](https://github.com/browserbase/quickstart-nextjs) template to get you started.

    <CardGroup cols={1}>
      <Card title="Browserbase x Nextjs Template" icon="book" iconType="sharp-solid" href="https://github.com/browserbase/quickstart-nextjs">
        Browserbase X Nextjs Template
      </Card>
    </CardGroup>
  </Tab>
</Tabs>
