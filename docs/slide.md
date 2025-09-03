# Plan for Implementing Slide Document Creation Workflow

* This feature is a part of Agent-777-V1.2

## Initial System Design
Current Document/Artifact Types: `text`, `code`, `image`, `sheet`
Storage: All documents stored in a single [Document](file://c:\Users\netfl\OneDrive\Desktop\faceless_magister_projects\agent-777\lib\db\schema.ts#L125-L125) table with composite primary key (id, createdAt) for versioning
Content: Stored as TEXT field containing stringified JSON
Existing Tools: [createDocument](file://c:\Users\netfl\OneDrive\Desktop\faceless_magister_projects\agent-777\lib\ai\tools\create-document.ts#L15-L77), [documentFinder](file://c:\Users\netfl\OneDrive\Desktop\faceless_magister_projects\agent-777\lib\ai\tools\document-finder.ts#L44-L170), [readDocument](file://c:\Users\netfl\OneDrive\Desktop\faceless_magister_projects\agent-777\lib\ai\tools\read-document.ts#L10-L43), [updateDocument](file://c:\Users\netfl\OneDrive\Desktop\faceless_magister_projects\agent-777\lib\ai\tools\update-document.ts#L12-L61), [validateDocument](file://c:\Users\netfl\OneDrive\Desktop\faceless_magister_projects\agent-777\lib\ai\tools\validate-document.ts#L33-L118), [compareDocuments](file://c:\Users\netfl\OneDrive\Desktop\faceless_magister_projects\agent-777\lib\ai\tools\compare-documents.ts#L9-L78)
Architecture: Handlers per document kind, LLM-based content generation, streaming to UI, database persistence

## Plan for Implementing Slide Document Creation Workflow Enhancements

### Phase 1: Schema and Type Definitions
1.1 Update Document Schema
File: lib/db/schema.ts

Add `'slide'` to the allowed document kinds enum in the Document table schema
Maintain existing composite primary key structure for versioning

1.2 Define Slide Document Types
File: lib/types.ts

Define TypeScript types for SlideBlock, Slide, and SlidesDoc:
```ts
type SlideBlock =
  | { type: 'heading'; text: string }
  | { type: 'text'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; rows: string[][] }
  | { type: 'shape'; shape: 'rect' | 'ellipse' | 'polygon'; props: { points?: [number,number][], w?: number, h?: number, r?: number } ; style?: Record<string,string|number> }
  | { type: 'connector'; fromId: string; toId: string; style?: Record<string,string|number> }
  | { type: 'mindmap'; nodes: { id: string; text: string }[]; edges: { from: string; to: string }[] }
  | { type: 'chart'; chartType: 'bar'|'line'|'pie'|string; data: unknown; options?: unknown };
type Slide = { id: string; layout?: string; blocks: SlideBlock[]; notes?: string };
type SlidesDoc = {
  version: 1;
  title: string;
  theme?: { palette: string[]; font: string; tokens?: Record<string, string|number> };
  slides: Slide[];
  meta?: { slideCount?: number; keywords?: string[] };
};
```

1.3 Update Artifact Kinds
File: lib/artifacts/server.ts

Add `'slide'` to the `artifactKinds` array

### Phase 2: Create Slide Document Handler
2.1 Create Slide Document Handler
File: artifacts/slide/server.ts

Create a new slide document handler implementing the DocumentHandler interface:
- Implement onCreateDocument to handle slide creation with optional content
- Implement onUpdateDocument to handle slide updates
- Use LLM for content generation when no content is provided
- Stream content to UI during generation

2.2 Register Slide Handler
File: lib/artifacts/server.ts

Add the new slide document handler to the `documentHandlersByArtifactKind` array

2.3 Update Artifact Definitions
File: components/artifact.tsx

Add any new artifact kinds if needed
Update UI components to handle slide documents

### Phase 3: UI Rendering Implementation
3.1 Create Slide Canvas Component
File: components/slide-canvas.tsx

Build a React renderer that maps `SlidesDoc` → pages → blocks
Implement editable components for each slide block type:
- Content-editable text for headings and text blocks
- Editable table component
- Chart rendering component with editing capabilities
- SVG-based shape editor with handles for shapes and connectors
- Mindmap visualization and editing component

3.2 Create Slide Editor
File: components/slide-editor.tsx

Implement a full slide editor with:
- Slide navigation and management
- Theme customization interface
- Toolbar for adding different block types
- Preview mode for presentations

3.3 Integrate with Artifact System
File: components/artifact.tsx

Update the artifact component to render slide documents using the new SlideCanvas component

### Phase 4: Database Integration and Search Enhancement
4.1 Add Search Indexing Columns
File: lib/db/schema.ts

Add optional `content_text` (TEXT) and `tags` (JSONB) columns to the Document table for enhanced search capabilities

4.2 Create Search Index Tool
File: lib/ai/tools/infer-slide-search-index.ts

Implement a server-side tool to extract plaintext and tags from slide documents:
- Extract text content from all text-like blocks
- Identify theme keywords and chart types
- Store extracted data in the new database columns

4.3 Update Document Finder
File: lib/ai/tools/document-finder.ts

Extend the existing documentFinder tool to:
- Include `kind='slide'` in search queries
- Search `content_text` field for slide documents
- Support filtering by tags when provided

### Phase 5: Enhanced Tools Implementation
5.1 Extend Create Document Tool
File: lib/ai/tools/create-document.ts

Update the createDocument tool to accept `kind: 'slide'` and optional `SlidesDoc` content
Maintain backward compatibility with existing document types

5.2 Create Slide-Specific Tools
Files:
- lib/ai/tools/update-slide-document.ts
- lib/ai/tools/validate-slide-document.ts
- lib/ai/tools/compare-slide-documents.ts
- lib/ai/tools/propose-slide-theme.ts
- lib/ai/tools/build-chart-spec.ts
- lib/ai/tools/generate-mindmap.ts

Implement slide-specific tools:
- updateSlideDocument: Apply JSON patches to slide documents
- validateSlideDocument: Validate slide document structure and content
- compareSlideDocuments: Compute semantic diffs between slide versions
- proposeSlideTheme: Generate theme tokens for slides
- buildChartSpec: Create chart configurations from data
- generateMindmap: Create mindmap structures from outlines

### Phase 6: Agent Orchestration
6.1 Create Slide Orchestrator Agent
File: lib/ai/prompts.ts

Add prompts for a Slide Orchestrator agent that:
- Parses user intent into slide outlines
- Calls proposeSlideTheme when style is requested
- Calls createDocument with slide kind
- Optionally calls buildChartSpec or generateMindmap for data needs

6.2 Create Specialized Assistants
Files:
- lib/ai/prompts.ts (additional prompts)
- app/(chat)/api/chat/route.ts (tool registration)

Implement specialized agents for:
- Design Assistant: Handles theme and styling requests
- Data Viz Assistant: Processes data and creates charts

### Phase 7: Versioning and UI Integration
7.1 Update Version Management UI
Files:
- components/version-footer.tsx
- components/document-preview.tsx

Extend the existing version management UI to handle slide documents:
- Display slide count and other metadata
- Enable version comparison for slides
- Implement revert functionality for slide documents

7.2 Implement Slide Comparison View
File: components/slide-comparison.tsx

Create a specialized comparison view for slide documents that:
- Shows visual diffs of slide content
- Highlights theme changes
- Displays statistics about changes

### Phase 8: Testing and Documentation
8.1 Unit Tests
Files:
- tests/routes/document.test.ts (add tests for slide functionality)
- tests/e2e/artifacts.test.ts (add end-to-end tests for slides)

8.2 Update Documentation
Files:
- README.md (update to reflect slide document capabilities)
- docs/slide.md (detailed documentation for slide implementation)

## Implementation Timeline
Week 1-2: Foundation
- Schema updates and type definitions
- Slide document handler implementation
- Basic slide rendering components

Week 3-4: UI Implementation
- Complete SlideCanvas component with all block types
- Slide editor with theme customization
- Integration with artifact system

Week 5-6: Database and Search
- Schema migrations for search indexing
- Search index tool implementation
- Document finder extension

Week 7-8: Tools and Agents
- Slide-specific tools implementation
- Agent orchestration setup
- Specialized assistant prompts

Week 9-10: Versioning and Polish
- Version management UI updates
- Slide comparison functionality
- Performance optimization

Week 11-12: Testing and Documentation
- Comprehensive testing of all slide functionality
- End-to-end workflow testing
- Documentation updates

## Risk Mitigation
Database Performance:
- Implement proper indexing on new search columns
- Add pagination for large slide documents

Security:
- Ensure all slide document access is properly authenticated
- Validate all inputs to prevent injection attacks

Backward Compatibility:
- Ensure existing functionality continues to work
- Make new slide parameters optional to avoid breaking changes

UI/UX Consistency:
- Maintain consistent design language with existing artifacts
- Ensure slide editor integrates seamlessly with the overall application

Performance:
- Implement virtualization for large slide decks
- Optimize SVG rendering for complex shapes and mindmaps

## Success Metrics
Functionality:
- Users can create, edit, and save slide documents
- Slide documents are searchable with enhanced search capabilities
- Versioning works correctly for slide documents
- All slide-specific tools function as expected

User Experience:
- Slide creation workflow is intuitive and efficient
- Editing capabilities are responsive and feature-rich
- Presentations can be easily customized with themes
- Visual elements are smoothly rendered and editable

Performance:
- Slide documents load and render within acceptable time limits
- Search functionality returns results quickly
- Database queries for slide documents are optimized
- Memory usage remains stable even with complex presentations

This plan addresses the implementation of slide documents while maintaining consistency with the existing architecture and following established patterns in the application. It provides a clear roadmap for development while ensuring that no critical aspects of the implementation are overlooked.