# Novel Builder Implementation Plan

## 1. Project Overview
Build a comprehensive novel writing assistant with AI-powered features for world-building, character development, and story management using Vercel AI SDK and modern web technologies.

## 2. Technical Stack
- **Frontend**: Next.js 15 (App Router)
- **AI**: Vercel AI SDK v5
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: Radix UI + Tailwind CSS
- **Rich Text**: ProseMirror
- **Auth**: NextAuth.js
- **State Management**: Vercel AI SDK built-in state

## 3. System Architecture

### 3.1 Core Components
1. **Novel Orchestrator**
   - Main AI agent coordinating all novel-related operations
   - Manages conversation state and tool routing
   - Handles user intents and dispatches to specialized agents

2. **Specialized Agents**
   - WorldBuilder: Manages world-building elements
   - CharacterBuilder: Handles character development
   - PlotManager: Manages story structure and plot points
   - ChapterWriter: Assists with chapter composition

3. **Database Layer**
   - Novel metadata and content storage
   - Document versioning system
   - User preferences and settings

### 3.2 Data Flow
1. User interacts with chat interface
2. Messages processed by Novel Orchestrator
3. Orchestrator routes to appropriate specialized agent
4. Agent processes request using available tools
5. Response generated and sent back to UI
6. State updated and persisted as needed

## 4. Database Schema (Drizzle)

```typescript
// Schema for novels table
export const novels = pgTable('novels', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  genre: text('genre').array(),
  status: text('status').default('draft'),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Schema for novel documents
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  novelId: uuid('novel_id').references(() => novels.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'chapter', 'character', 'world', 'note'
  title: text('title').notNull(),
  content: jsonb('content'),
  metadata: jsonb('metadata'),
  version: integer('version').default(1),
  isCurrent: boolean('is_current').default(true),
  previousVersionId: uuid('previous_version_id'),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

## 5. Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
1. **Database Setup**
   - Implement Drizzle schema and migrations
   - Set up database connection utilities
   - Create base repository classes

2. **AI Core**
   - Set up Vercel AI SDK with streaming
   - Implement base agent class with common utilities
   - Create tool calling infrastructure

3. **Authentication**
   - Set up NextAuth with database adapter
   - Implement protected API routes
   - Add user session management

### Phase 2: Core Features (Week 3-4)
1. **Novel Management**
   - Create/Edit/Delete novels
   - Basic document CRUD operations
   - Version history implementation

2. **Agent System**
   - Implement NovelOrchestrator
   - Create specialized agents (WorldBuilder, CharacterBuilder, etc.)
   - Set up tool registry and routing

3. **UI Components**
   - Novel dashboard
   - Document editor with ProseMirror
   - Sidebar navigation

### Phase 3: Enhanced Features (Week 5-6)
1. **AI Tools**
   - Implement content generation tools
   - Add consistency checking
   - Create suggestion system

2. **Collaboration**
   - Real-time updates
   - Comments and annotations
   - User roles and permissions

3. **Export/Import**
   - Multiple format exports (PDF, ePub, etc.)
   - Backup and restore
   - Template system

## 6. API Design

### 6.1 REST Endpoints
- `GET /api/novels` - List all novels
- `POST /api/novels` - Create new novel
- `GET /api/novels/[id]` - Get novel details
- `PUT /api/novels/[id]` - Update novel
- `DELETE /api/novels/[id]` - Delete novel

### 6.2 AI Endpoints
- `POST /api/ai/chat` - Main chat endpoint
- `POST /api/ai/generate` - Content generation
- `POST /api/ai/analyze` - Content analysis

## 7. Security Considerations
- Implement proper input validation
- Add rate limiting
- Secure API endpoints with authentication
- Sanitize all user-generated content
- Regular security audits

## 8. Testing Strategy
- Unit tests for core logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- AI response validation
- Performance testing

## 9. Deployment
- Vercel for frontend and API
- Supabase/Neon for PostgreSQL
- Vercel AI SDK for AI features
- Vercel Blob for file storage
- Vercel Analytics for monitoring

## 10. Future Enhancements
- Mobile app (React Native)
- Offline support
- Advanced AI features (plot analysis, character development)
- Community features (sharing, collaboration)
- Marketplace for templates and assets

## 11. Success Metrics
- User engagement (daily active users, session duration)
- Content creation metrics (novels created, words written)
- AI assistance metrics (tool usage, user satisfaction)
- Performance metrics (load times, API response times)
- Error rates and system stability

1. **Tech Stack**:
   - Next.js 15 (Canary)
   - Vercel AI SDK (v5.0.26)
   - Drizzle ORM (v0.34.0)
   - Radix UI components
   - ProseMirror for rich text editing
   - NextAuth for authentication

2. **Key Observations**:
   - The project is already set up with Vercel AI SDK
   - Uses Drizzle ORM instead of Prisma (as shown in the empty schema.prisma)
   - Has a chat interface implementation
   - Includes authentication

3. **What's Missing**:
   - No existing novel-specific database schema
   - No implementation of the proposed agent system
   - No specific components for novel management

## 13. Plan Assessment

The proposed plan is **largely workable** but needs some adjustments to fit the current tech stack:

### Workable Aspects:

1. **Agent Architecture**:
   - The proposed agent system aligns well with Vercel AI SDK's capabilities
   - The tool calling pattern is correctly implemented

2. **State Management**:
   - The AI SDK's built-in state management is sufficient
   - No need for additional state management libraries

3. **Document Management**:
   - ProseMirror is already included, which is great for rich text editing
   - Version control can be built on top of the existing setup

### Needed Adjustments:

1. **Database Schema**:
   - Needs to be adapted for Drizzle ORM
   - Should leverage existing database setup

2. **API Routes**:
   - Should follow Next.js 13+ App Router patterns
   - Needs to integrate with existing auth system

3. **UI Components**:
   - Should use existing Radix UI components
   - Can leverage the existing chat interface

## 14. Implementation Timeline

### Week 1: Foundation
- [ ] Database schema implementation
- [ ] Base AI agent setup
- [ ] Authentication flow

### Week 2: Core Features
- [ ] Novel management UI
- [ ] Document editor integration
- [ ] Basic AI tooling

### Week 3: AI Integration
- [ ] Implement specialized agents
- [ ] Tool calling infrastructure
- [ ] Content generation features

### Week 4: Polish & Testing
- [ ] UI/UX refinements
- [ ] Performance optimization
- [ ] Comprehensive testing

## 15. Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `pnpm db:migrate`
5. Start development server: `pnpm dev`

## 16. Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 17. License

MIT

1. **First Phase**:
   - Set up the database schema using Drizzle
   - Create basic API routes for novel management
   - Implement the core NovelOrchestrator agent

2. **Second Phase**:
   - Build the specialized agents (worldBuilder, characterBuilder, etc.)
   - Implement the document management interface
   - Add collaboration features

3. **Third Phase**:
   - Add advanced features like consistency checking
   - Implement version control
   - Add export/import functionality


------------------------------------------------------------------------
------------------------------------------------------------------------


# PLAN UPDATE ON 11.9.2025
Following is the update on the progress of the novel builder implementation as of 8th September 2025, along with a proposed timeline for the remaining work: 

Here’s a concise status update against the planned workflow in [novel_plan.md](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/novel_plan.md:0:0-0:0), plus a concrete roadmap to full completion. I’ll reference key files and modules so you can trace everything quickly.

# What’s Completed (mapped to plan)

- DB and Migrations (Drizzle)
  - __Schema__: Drizzle tables for `novel`, `novel_document`, `document_version` implemented and migrated.
    - See `lib/db/novel-schema.ts`, `lib/db/migrations/0003_novel_drizzle.sql`.
  - __Versioning__: On each document update, previous content is saved to `document_version`, `version` increments, and `isCurrent` maintained.
    - API logic in `app/api/novels/[novelId]/documents/[docId]/route.ts`.
    - Versions listing and restore API in `app/api/novels/[novelId]/documents/[docId]/versions/route.ts`.

- REST API (Consolidated)
  - __Novels__: `GET /api/novels` and `GET|PATCH|DELETE /api/novels/[id]`, `POST /api/novels`.
    - Files under `app/api/novels/`.
  - __Documents__: `GET|POST /api/novels/[novelId]/documents`, `GET|PUT|DELETE /api/novels/[novelId]/documents/[docId]`.
    - Version endpoints: `GET|POST /api/novels/[novelId]/documents/[docId]/versions`.
  - __Legacy__: Old Prisma routes return 410 Gone with guidance.

- UI (Mobile-optimized)
  - __Novel detail__: `app/(dashboard)/novels/[id]/page.tsx` wired to live APIs; shows genres, cover, and documents list with “View All”/“New Document”.
  - __Document list/create/editor__: 
    - List page: `app/(dashboard)/novels/[id]/documents/page.tsx`.
    - Create page: `app/(dashboard)/novels/[id]/documents/new/page.tsx`.
    - Editor page: `app/(dashboard)/novels/[id]/documents/[docId]/page.tsx`.
  - __Editor__: ProseMirror real instance using PM JSON; see [components/editor/ProseMirrorEditor.tsx](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/components/editor/ProseMirrorEditor.tsx:0:0-0:0). Wrapper [EditorField.tsx](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/components/editor/EditorField.tsx:0:0-0:0) provides hidden input binding for server actions.
  - __Quick Create cards__: Added client-side “Quick Create” with toasts + loading and redirect to the created doc.
    - [components/novels/QuickCreateCards.tsx](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/components/novels/QuickCreateCards.tsx:0:0-0:0) used by the list page.
    - Endpoints: 
      - Character create [app/api/agents/character/create/route.ts](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/app/api/agents/character/create/route.ts:0:0-0:0)
      - Plot outline create [app/api/agents/plot/create/route.ts](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/app/api/agents/plot/create/route.ts:0:0-0:0)
      - Chapter draft create [app/api/agents/chapter/create/route.ts](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/app/api/agents/chapter/create/route.ts:0:0-0:0)

- AI and Agents
  - __Streaming chat__: `POST /api/ai/chat` streams assistant text via Vercel AI SDK `streamText` and `smoothStream`.
    - [app/api/ai/chat/route.ts](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/app/api/ai/chat/route.ts:0:0-0:0)
  - __Intent routing__: Basic rules for “create character/plot/chapter” parse the message and call agent endpoints above; falls back to normal chat streaming.
  - __Specialized agents__: 
    - [lib/ai/agents/character-builder.ts](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/lib/ai/agents/character-builder.ts:0:0-0:0) (create/refine character sheet)
    - [lib/ai/agents/plot-manager.ts](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/lib/ai/agents/plot-manager.ts:0:0-0:0) (create outline/refine beats)
    - [lib/ai/agents/chapter-writer.ts](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/lib/ai/agents/chapter-writer.ts:0:0-0:0) (create draft/rewrite section)
    - All emit structured ProseMirror JSON compatible with the editor and versioning.
  - __Refine flows (server endpoints)__:
    - Character refine: [app/api/agents/character/refine/route.ts](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/app/api/agents/character/refine/route.ts:0:0-0:0)
    - Plot refine (beats): [app/api/agents/plot/refine/route.ts](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/app/api/agents/plot/refine/route.ts:0:0-0:0)
    - Chapter rewrite: [app/api/agents/chapter/rewrite/route.ts](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/app/api/agents/chapter/rewrite/route.ts:0:0-0:0)

- Search/tooling foundation
  - __Document finder tool__: advanced search (title/content fuzzy, date range, versions) in [lib/ai/tools/document-finder.ts](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/lib/ai/tools/document-finder.ts:0:0-0:0).
  - __Artifacts system__: Code/Text/Image/Sheet streaming create/update handlers exist (e.g., [artifacts/text/server.ts](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/artifacts/text/server.ts:0:0-0:0)) and can be leveraged later.

# Gaps vs Plan (remaining)

- Chat/AI
  - Chat intent routing is basic regex; structured parsing not yet implemented.
  - No UI-side “AI agent picker” or explicit chat-to-tool flow UI.
  - Some refine forms are server-action based; could be clientified with toasts and optimistic updates.

- Novel detail UX
  - Page wired to live data, but no integrated search panel, filters, or activity timeline.

- Search UI
  - The document finder tool exists but no user-facing UI to drive it.

- Security and Validation
  - Some zod validations exist (see [lib/validations/novel.ts](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/lib/validations/novel.ts:0:0-0:0)), but not applied uniformly across all agent endpoints.
  - Rate limiting/sanitization not yet centralized.

- Testing and Deployment
  - Unit/integration/E2E coverage is still pending for the novel/doc flows and AI endpoints.
  - README and deployment steps need finalization; migrations checklist and environment variables documentation.

# Proposed Roadmap to Full Completion

Milestone 1 — AI Chat + Agent Orchestration (High)
- __Structured intent parsing__: In `/api/ai/chat`, switch to structured extraction for commands using Vercel AI SDK object generation to parse fields like name/role/acts/titles from free text.
  - Improves reliability over regex.
- __Refine flows via chat__: Support “refine character”, “refine beats”, “rewrite chapter section” intents by calling the refine endpoints with extracted fields.
- __UI cues__: On success, send back a structured message with “Open Document” link; update chat UI to render CTA.

Milestone 2 — Refine UX polish (High)
- __Clientify refine forms__: Convert the “Refine with AI” blocks in `app/(dashboard)/novels/[id]/documents/[docId]/page.tsx` to client components:
  - Show toast success/error.
  - Show loading spinners.
  - Optimistically update content or trigger a lightweight refresh to show new version.
- __Inline version changelog__: After refine, auto-expand “Versions” panel and highlight the new version.

Milestone 3 — Document Finder UI (Medium)
- __Search page/panel__: Add a search panel under `novels/[id]/documents/search` or as a drawer.
  - Calls [lib/ai/tools/document-finder.ts](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/lib/ai/tools/document-finder.ts:0:0-0:0) via a route or server action.
  - Supports fuzzy title/content, date range, kind filters, and opens results in editor.
- __Saved searches__: Optional feature storing last queries per novel/user.

Milestone 4 — Novel Detail UX (Medium)
- __Activity timeline__: Show recent document edits/restores, generated items from agents, and comments (if any).
- __Filters & bulk actions__: Filter by type (chapter/character/etc.), sort by updated/created, and bulk delete (guarded).
- __Shortcuts__: “Generate character/plot/chapter” buttons at the novel level (reuse Quick Create).

Milestone 5 — Security & Validation (High)
- __Uniform zod__: Apply zod schemas uniformly across all API routes and agent endpoints (creation + refine + rewrite).
  - Reference: [lib/validations/novel.ts](cci:7://file:///c:/Users/netfl/OneDrive/Desktop/agent-777-v1.2.4/lib/validations/novel.ts:0:0-0:0) — extend/align with document payloads (PM JSON).
- __Rate limiting__: Introduce per-user rate limits on AI endpoints and mutation-heavy routes.
- __Sanitization__: Ensure PM JSON sanitization (e.g., whitelist node/mark types; reject dangerous attributes).
- __Auth consistency__: Ensure `getServerSession` applied consistently; double-check all agent endpoints.

Milestone 6 — Testing (High)
- __Unit tests__: 
  - Agents tools: ownership validation, content shaping (PM JSON schema).
  - Versioning behavior: ensure version increments and snapshots on update/restore.
- __Integration tests__:
  - API routes: novel CRUD, document CRUD, versions list/restore, agent create/refine endpoints.
  - Chat endpoint: streaming fallback, intent routing success paths.
- __E2E__:
  - Create novel → Quick Create → Edit document → Save → Restore → Refine with AI → Verify content and versions.
  - Document Finder: search → open result → edit → save.

Milestone 7 — Documentation & Deployment (Medium)
- __README__: Explain the workflow, environment variables, run migrations, agent usage, and editor content format (PM JSON).
- __Environment__: Document `NEXT_PUBLIC_BASE_URL`, provider keys, NextAuth secrets, database URL, etc.
- __Analytics & monitoring__: Enable basic analytics in Vercel; log errors consistently.

# Acceptance Criteria per Milestone

- Milestone 1
  - Chat can extract fields and create documents reliably from natural text.
  - Chat can refine existing docs through agent endpoints.
  - Chat UI shows CTAs to open created/updated documents.

- Milestone 2
  - Editor page refine forms show loading/toast and update content/versions without full reload.
  - Recent version highlighted after refine/restore.

- Milestone 3
  - Search UI supports title/content fuzzy, date range, kind, and opens doc in editor.

- Milestone 4
  - Novel detail page shows recent activities and offers type filters and quick-generation shortcuts.

- Milestone 5
  - All mutation endpoints have zod validation, rate limiting in place, and PM JSON sanitization.
  - Auth enforced consistently.

- Milestone 6
  - CI green: unit+integration+E2E coverage for the core flows.

- Milestone 7
  - Clear README with step-by-step setup; deployment verified on Vercel with DB migrations run and analytics enabled.

