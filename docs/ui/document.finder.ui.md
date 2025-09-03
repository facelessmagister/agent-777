# Document Finder Agent UI Implementation

This document describes the UI implementation for the DocumentFinderAgent tool.

## Component Structure

### DocumentSearchResults Component
- Location: `/components/document-search-results.tsx`
- Purpose: Display search results in a user-friendly card-based layout
- Features:
  - Card-based display of documents with title, type, preview, and date
  - Pagination controls for navigating through results
  - Click handling to open documents in the artifact viewer
  - Search query display to show what was searched for
  - Responsive design for different screen sizes

### Message Component Integration
- Location: `/components/message.tsx`
- Purpose: Handle DocumentFinderAgent tool results in chat messages
- Features:
  - Renders DocumentSearchResults component when tool output is available
  - Proper error handling for failed searches
  - Collapsible tool display following existing patterns

### Data Stream Integration
- Location: `/components/data-stream-handler.tsx`
- Purpose: Process document search results through the data stream
- Features:
  - Handles `data-documentSearchResults` stream parts
  - Updates UI in real-time as results are received

## UI Features

### Document Cards
Each document is displayed as a card with:
- Document title
- Document type badge (code, text, sheet, image)
- Content preview (first 200 characters)
- Creation date with relative and absolute formatting
- Click handler to open in artifact viewer

### Pagination
- Shows 5 results per page
- Previous/Next buttons for navigation
- Page counter display
- Disabled states for first/last pages

### Search Query Display
- Shows the parameters used for the search
- Displays title query, content query, document type, and date range filters

### Responsive Design
- Adapts to different screen sizes
- Proper spacing and typography
- Touch-friendly controls

## Integration Points

### Type Definitions
- Updated `/lib/types.ts` to include `documentSearchResults` custom data type
- Added proper TypeScript interfaces for document search results

### Tool Registration
- Updated `/app/(chat)/api/chat/route.ts` to pass data stream to DocumentFinderAgent
- Modified tool registration to support streaming

### Data Stream Handling
- Updated `/components/data-stream-handler.tsx` to process document search results
- Added case for `data-documentSearchResults` stream parts

## Styling

The component uses the existing shadcn/ui components:
- Card for the main container
- Badge for document type and result count
- Button for pagination controls
- Responsive layout with proper spacing

## Interaction Flow

1. User requests document search through natural language
2. Orchestrator processes request and calls DocumentFinderAgent
3. DocumentFinderAgent streams results through data stream
4. Message component renders DocumentSearchResults when tool output is available
5. User can click on document cards to open them in the artifact viewer
6. User can navigate through pages of results using pagination controls