import type { z } from 'zod';

type Message = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  id?: string;
  name?: string;
};

type ToolResult = {
  toolCallId: string;
  result: any;
};

export class BaseAgent {
  protected systemPrompt: string;
  protected tools: any[] = [];
  protected messages: Message[] = [];

  constructor({ systemPrompt = 'You are a helpful AI assistant.' } = {}) {
    this.systemPrompt = systemPrompt;
  }

  protected async processMessage(content: string): Promise<void> {
    // Minimal placeholder processing: echo back the content
    this.messages.push({ role: 'user', content });
    const reply = `Echo: ${content}`;
    this.messages.push({ role: 'assistant', content: reply });
  }

  // Helper method to register tools
  protected registerTools(tools: any[]) {
    this.tools = [...this.tools, ...tools];
  }

  // Helper method to create a tool
  protected createTool<T extends z.ZodType>(
    name: string,
    description: string,
    schema: T,
    handler: (args: z.infer<T>) => Promise<any>
  ) {
    return {
      type: 'function' as const,
      function: {
        name,
        description,
        parameters: schema,
        execute: handler,
      },
    };
  }

  // Cleanup method to be called when done
  public cleanup() {}
}
