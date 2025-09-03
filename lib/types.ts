import { z } from 'zod';
import type { getWeather } from './ai/tools/get-weather';
import type { createDocument } from './ai/tools/create-document';
import type { updateDocument } from './ai/tools/update-document';
import type { requestSuggestions } from './ai/tools/request-suggestions';
import type { readDocument } from './ai/tools/read-document';
import type { validateDocument } from './ai/tools/validate-document';
import type { compareDocuments } from './ai/tools/compare-documents';
import type { documentFinder } from './ai/tools/document-finder'; // Added DocumentFinderAgent
import type { InferUITool, UIMessage } from 'ai';

import type { ArtifactKind } from '@/components/artifact';
import type { Suggestion } from './db/schema';

export type DataPart = { type: 'append-message'; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;
type readDocumentTool = InferUITool<ReturnType<typeof readDocument>>;
type validateDocumentTool = InferUITool<ReturnType<typeof validateDocument>>;
type compareDocumentsTool = InferUITool<ReturnType<typeof compareDocuments>>;
type documentFinderTool = InferUITool<ReturnType<typeof documentFinder>>; // Added DocumentFinderAgent

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
  readDocument: readDocumentTool;
  validateDocument: validateDocumentTool;
  compareDocuments: compareDocumentsTool;
  documentFinder: documentFinderTool; // Added DocumentFinderAgent
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  // Document search results
  documentSearchResults: {
    documents: Array<{
      id: string;
      title: string;
      kind: ArtifactKind;
      createdAt: Date;
      contentPreview: string;
    }>;
    query: {
      titleQuery?: string;
      contentQuery?: string;
      kind?: ArtifactKind;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    };
  };
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}
