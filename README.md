<a href="https://chat.vercel.ai/">
  <img alt="Next.js 14 and App Router-ready AI chatbot." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Chat SDK</h1>
</a>

<p align="center">
    Chat SDK is a free, open-source template built with Next.js and the AI SDK that helps you quickly build powerful chatbot applications.
</p>

<p align="center">
  <a href="https://chat-sdk.dev"><strong>Read Docs</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports xAI (default), OpenAI, Fireworks, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Neon Serverless Postgres](https://vercel.com/marketplace/neon) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [Auth.js](https://authjs.dev)
  - Simple and secure authentication

## Model Providers

This template ships with [xAI](https://x.ai) `grok-2-1212` as the default chat model. However, with the [AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://sdk.vercel.ai/providers/ai-sdk-providers) with just a few lines of code.

## Deploy Your Own

You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET&envDescription=Learn+more+about+how+to+get+the+API+Keys+for+the+application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=AI+Chatbot&demo-description=An+Open-Source+AI+Chatbot+Template+Built+With+Next.js+and+the+AI+SDK+by+Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22ai%22%2C%22productSlug%22%3A%22grok%22%2C%22integrationSlug%22%3A%22xai%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22integrationSlug%22%3A%22upstash%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D)

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000).


# Current development

## Application Capabilities Summary

### AI Agents
The application utilizes two distinct AI agents:
- **Chat Model (grok-2-1212)**: Primary model for general-purpose conversations and content creation
- **Reasoning Model (grok-3-mini-beta)**: Advanced model for complex reasoning tasks, with specialized thinking capabilities

### Available Tools
The application provides a suite of tools accessible to the AI agents:
- **createDocument**: Generates new documents of various types (text, code, image, sheet)
- **updateDocument**: Modifies existing documents based on specific instructions
- **getWeather**: Retrieves current weather information for any location
- **requestSuggestions**: Generates suggestions for improving document content

### Core Workflows
1. **Chat Interaction**: Users engage in conversations with AI agents, with support for both general chat and advanced reasoning
2. **Document Creation**: AI can create various document types using the createDocument tool, which are then stored and accessible in the UI
3. **Document Editing**: Existing documents can be updated using natural language instructions through the updateDocument tool
4. **Content Generation**: Specialized workflows for generating code snippets, images, spreadsheets, and text documents
5. **Weather Information**: Real-time weather data retrieval based on location coordinates

### Document Lifecycle Management
The application provides comprehensive document management capabilities:

#### Document Types
- **Text Documents**: Markdown-supported content for essays, articles, and general text
- **Code Documents**: Programming code snippets with syntax highlighting
- **Image Documents**: AI-generated images stored as base64 encoded data
- **Sheet Documents**: CSV-formatted spreadsheet data

#### Versioning System
- Documents are stored with a composite primary key (id + createdAt) enabling full version history
- Each document update creates a new version while preserving previous versions
- Users can browse, compare, and revert to any previous version of a document
- The UI provides version navigation controls for seamless historical access

#### Storage & Persistence
- All documents are persisted in a Neon Serverless Postgres database
- Document content is stored as plain text with type-specific formatting
- Metadata including title, creation timestamp, and ownership is maintained
- Related suggestions and user interactions are also stored for context

#### Retrieval & Access
- Documents can be retrieved by ID with options to get all versions or latest version
- API endpoints provide programmatic access to document content
- Search functionality allows users to find documents by various criteria
- Access controls ensure document privacy based on user ownership

#### UI Integration
- Real-time document rendering in a dedicated artifact panel
- Side-by-side comparison view for document versions
- Inline editing capabilities with automatic saving
- Visual indicators for document status and version information
