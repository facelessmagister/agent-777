---
trigger: model_decision
description: how to use browserless to build a fully functional AI-powered browser automation application using Browserless.io, Vercel AI SDK, and Next.js, allowing AI agents to control browsers through natural language instructions, enabling tasks like web scraping, form filling, and content extraction. 
---
Vercel AI SDK Integration
This guide demonstrates how to build a fully functional AI-powered browser automation application using Browserless.io, Vercel AI SDK, and Next.js. The application allows AI agents to control browsers through natural language instructions, enabling tasks like web scraping, form filling, and content extraction.

Introduction
This integration combines three powerful technologies:

Browserless.io: A headless browser service that provides browser automation capabilities
Vercel AI SDK: A toolkit for building AI-powered applications
Next.js: A React framework for building web applications
Together, these technologies enable you to create applications where AI can understand and execute browser automation tasks through natural language.

Prerequisites
Node.js 18 or higher
Vercel account
Browserless.io API token
OpenAI API key (or other supported LLM provider)
Step 1: Project Setup
Create a Next.js Project
npx create-next-app@latest browserless-ai
cd browserless-ai

Install Required Packages
npm install @vercel/ai @browserless/ai puppeteer-core openai zod prettier

Configure Environment Variables
Create a .env.local file in your project root:

BROWSERLESS_API_KEY=your_browserless_api_key
OPENAI_API_KEY=your_openai_api_key

Step 2: Core Components
Browser Service
Create src/lib/browser.ts:

import puppeteer from 'puppeteer-core';
import { z } from 'zod';

// Schema for browser settings
const BrowserSettingsSchema = z.object({
  viewport: z.object({
    width: z.number().default(1920),
    height: z.number().default(1080),
  }),
  userAgent: z.string().optional(),
  timeout: z.number().default(30000),
});

export type BrowserSettings = z.infer<typeof BrowserSettingsSchema>;

export class BrowserlessService {
  private static instance: BrowserlessService;
  private browser: puppeteer.Browser | null = null;
  private settings: BrowserSettings;

  private constructor(settings: Partial<BrowserSettings> = {}) {
    this.settings = BrowserSettingsSchema.parse(settings);
  }

  static getInstance(settings?: Partial<BrowserSettings>): BrowserlessService {
    if (!BrowserlessService.instance) {
      BrowserlessService.instance = new BrowserlessService(settings);
    }
    return BrowserlessService.instance;
  }

  async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.connect({
        browserWSEndpoint: `wss://production-sfo.browserless.io?token=${process.env.BROWSERLESS_API_KEY}`,
        defaultViewport: this.settings.viewport,
      });
    }
    return this.browser;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

AI Route Handler
Create src/app/api/chat/route.ts:

import { OpenAIStream, StreamingTextResponse } from 'ai';
import { BrowserlessService } from '@/lib/browser';
import OpenAI from 'openai';
import { z } from 'zod';

// Schema for chat messages
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Validate messages
    const validatedMessages = z.array(MessageSchema).parse(messages);
    
    const browserService = BrowserlessService.getInstance();
    const browser = await browserService.getBrowser();
    const page = await browser.newPage();

    // Process the message and perform browser actions
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      stream: true,
      messages: [
        {
          role: 'system',
          content: `You are a browser automation assistant. You can:
          1. Navigate to URLs
          2. Extract information from pages
          3. Fill out forms
          4. Take screenshots
          5. Click elements
          6. Type text
          Always respond with clear instructions for the browser.`
        },
        ...validatedMessages,
      ],
    });

    const stream = OpenAIStream(response, {
      async onCompletion(completion) {
        try {
          // Process the AI's response and perform browser actions
          if (completion.includes('navigate to')) {
            const url = completion.match(/navigate to (https?:\/\/[^\s]+)/)?.[1];
            if (url) {
              await page.goto(url, { waitUntil: 'networkidle0' });
            }
          }
          
          if (completion.includes('click')) {
            const selector = completion.match(/click "([^"]+)"/)?.[1];
            if (selector) {
              await page.click(selector);
            }
          }
          
          if (completion.includes('type')) {
            const [selector, text] = completion.match(/type "([^"]+)" into "([^"]+)"/)?.slice(1) || [];
            if (selector && text) {
              await page.type(selector, text);
            }
          }
          
          // Add more action handlers as needed
        } catch (error) {
          console.error('Error executing browser action:', error);
        }
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500 }
    );
  }
}

Chat Interface
Create src/app/page.tsx:

'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 mb-4 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-100 ml-auto'
                : 'bg-gray-100 mr-auto'
            }`}
          >
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 p-2 border border-gray-300 rounded-lg"
          value={input}
          placeholder="Ask the AI to perform browser actions..."
          onChange={handleInputChange}
          disabled={isLoading || isProcessing}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          disabled={isLoading || isProcessing}
        >
          Send
        </button>
      </form>
    </div>
  );
}

Step 3: Advanced Features
Session Management
Create src/lib/session.ts:

import { BrowserlessService } from './browser';
import puppeteer from 'puppeteer-core';

export class BrowserSession {
  private static sessions: Map<string, {
    page: puppeteer.Page;
    lastActive: number;
  }> = new Map();
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  static async getSession(sessionId: string): Promise<puppeteer.Page> {
    const session = this.sessions.get(sessionId);
    
    if (session && Date.now() - session.lastActive < this.SESSION_TIMEOUT) {
      session.lastActive = Date.now();
      return session.page;
    }

    const browser = await BrowserlessService.getInstance().getBrowser();
    const page = await browser.newPage();
    
    this.sessions.set(sessionId, {
      page,
      lastActive: Date.now(),
    });

    return page;
  }

  static async cleanup() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActive > this.SESSION_TIMEOUT) {
        await session.page.close();
        this.sessions.delete(sessionId);
      }
    }
  }
}

Error Handling Middleware
Create src/middleware.ts:

import { NextResponse } from 'next/server';
import { z } from 'zod';

export async function middleware(request: Request) {
  try {
    // Add rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    // Implement your rate limiting logic here

    // Validate request body
    if (request.method === 'POST') {
      const body = await request.json();
      // Add your validation logic here
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

Step 4: Testing
Local Testing
Start the development server:
npm run dev

Test the API endpoints:
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Navigate to example.com"}]}'

Production Testing
Deploy to Vercel:
vercel

Test the deployed endpoints:
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Navigate to example.com"}]}'

Step 5: Deployment
Vercel Deployment
Push your code to GitHub
Import the project in Vercel
Add your environment variables:
BROWSERLESS_API_KEY
OPENAI_API_KEY
Deploy!
Environment Configuration
Configure your Vercel project settings:

{
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "regions": ["sfo1"]
}

Best Practices
Resource Management

Always close browser pages when done
Implement session timeouts
Clean up unused resources
Error Handling

Implement comprehensive error handling
Log errors appropriately
Provide meaningful error messages
Security

Validate all inputs
Implement rate limiting
Use environment variables for sensitive data
Performance

Use appropriate timeouts
Implement caching where possible
Optimize browser operations
Monitoring

Set up error tracking
Monitor API usage
Track performance metrics
Troubleshooting
Common Issues
Connection Errors

Check your Browserless.io API key
Verify network connectivity
Check firewall settings
Timeout Errors

Increase timeout values
Optimize browser operations
Implement retry logic
Rate Limit Errors

Implement proper rate limiting
Monitor API usage
Consider upgrading your plan
Debugging Tips
Enable verbose logging:
process.env.DEBUG = 'browserless:*';

Use the Browserless.io dashboard to monitor sessions

Implement request logging:

console.log('Request:', {
  url: request.url,
  method: request.method,
  headers: Object.fromEntries(request.headers),
});