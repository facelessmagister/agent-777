# Document Finder Agent Workflow Integration

This document describes how the DocumentFinderAgent should be integrated into the orchestrator workflow and how user requests should be interpreted and mapped to tool parameters.

## Workflow Overview

The DocumentFinderAgent follows this workflow pattern:

1. **User Request**: User describes what they're looking for in natural language
2. **Orchestrator Processing**: The main chat agent determines search parameters from user input
3. **Tool Invocation**: Orchestrator calls DocumentFinderAgent with appropriate parameters
4. **Database Query**: DocumentFinderAgent executes enhanced search
5. **Result Processing**: Results are formatted and scored for relevance
6. **Response Generation**: Orchestrator crafts a natural language response with results

## User Request Interpretation

The orchestrator should analyze user requests and extract the following parameters for the DocumentFinderAgent:

### Title Query Extraction
- Extract keywords or phrases that likely appear in document titles
- Use natural language understanding to identify the main topic
- Example: "Find my React component documents" → titleQuery: "React component"

### Content Query Extraction
- Identify specific terms or concepts the user wants to find in document content
- Look for descriptive phrases about what the document contains
- Example: "documents about state management" → contentQuery: "state management"

### Kind Filtering
- Map natural language descriptions to document types:
  - "code documents" → kind: "code"
  - "text files" → kind: "text"
  - "spreadsheets" → kind: "sheet"
  - "images" → kind: "image"

### Date Range Parsing
- Recognize relative date references:
  - "from last week" → dateFrom: "last week"
  - "this month" → dateFrom: "2023-04-01", dateTo: "2023-04-30" (current month)
  - "recent" → dateFrom: "last week"
  - "yesterday" → dateFrom: "yesterday", dateTo: "yesterday"

## Example Workflows

### Example 1: Simple Title Search
**User**: "Find my authentication documents"
- titleQuery: "authentication"
- kind: undefined
- dateFrom: undefined
- dateTo: undefined

### Example 2: Content and Type Search
**User**: "Show me code documents about database connections"
- titleQuery: undefined
- contentQuery: "database connections"
- kind: "code"
- dateFrom: undefined
- dateTo: undefined

### Example 3: Date-Restricted Search
**User**: "Find my React component documents from last month about state management"
- titleQuery: "React component"
- contentQuery: "state management"
- kind: "code"
- dateFrom: "last month"
- dateTo: undefined

### Example 4: Complex Multi-Parameter Search
**User**: "Show me all text documents about project planning from this month"
- titleQuery: "project planning"
- contentQuery: "project planning"
- kind: "text"
- dateFrom: "2023-04-01" (current month start)
- dateTo: undefined

## Response Generation Guidelines

When the DocumentFinderAgent returns results, the orchestrator should:

1. **Summarize the Results**: Provide a natural language summary of what was found
2. **List Documents**: Present documents in a readable format with titles and preview text
3. **Suggest Next Steps**: Offer options like reading a document, comparing documents, or creating new ones
4. **Handle Edge Cases**: Gracefully handle empty results or errors

### Example Response Template
```
I found {count} documents matching your search:

1. "{title}" ({kind}) - Created {date}
   Preview: {contentPreview}

2. "{title}" ({kind}) - Created {date}
   Preview: {contentPreview}

You can ask me to read any of these documents, compare them, or search for something else.
```

## Integration with Other Tools

The DocumentFinderAgent can work alongside other tools:

### With createDocument
- Find similar existing documents before creating new ones
- Suggest existing documents that might meet the user's needs

### With readDocument
- After finding documents, read their full content
- Verify document contents match user expectations

### With compareDocuments
- Compare multiple documents from search results
- Analyze differences between document versions

## Best Practices

1. **Parameter Combination**: Use multiple parameters when the user request contains sufficient information
2. **Fuzzy Matching**: Leverage the tool's fuzzy matching capabilities for partial matches
3. **Pagination**: For large result sets, consider using limit and offset parameters
4. **Natural Language**: Return results in conversational, natural language format
5. **Context Preservation**: Maintain context for follow-up questions about search results