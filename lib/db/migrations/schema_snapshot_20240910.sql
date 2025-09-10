-- Database Schema Snapshot - 2024-09-10
-- This file contains a snapshot of the database schema as of 2024-09-10
-- Use this file to revert schema changes if needed during development

-- User table
CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" VARCHAR(64) NOT NULL,
  "password" VARCHAR(64)
);

-- Chat table
CREATE TABLE IF NOT EXISTS "Chat" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "createdAt" TIMESTAMP NOT NULL,
  "title" TEXT NOT NULL,
  "userId" UUID NOT NULL REFERENCES "User" ("id"),
  "visibility" VARCHAR(7) NOT NULL DEFAULT 'private' CHECK ("visibility" IN ('public', 'private'))
);

-- Deprecated Message table (v1)
CREATE TABLE IF NOT EXISTS "Message" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chatId" UUID NOT NULL REFERENCES "Chat" ("id"),
  "role" VARCHAR NOT NULL,
  "content" JSON NOT NULL,
  "createdAt" TIMESTAMP NOT NULL
);

-- Message table (v2)
CREATE TABLE IF NOT EXISTS "Message_v2" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chatId" UUID NOT NULL REFERENCES "Chat" ("id"),
  "role" VARCHAR NOT NULL,
  "parts" JSON NOT NULL,
  "attachments" JSON NOT NULL,
  "createdAt" TIMESTAMP NOT NULL
);

-- Deprecated Vote table (v1)
CREATE TABLE IF NOT EXISTS "Vote" (
  "chatId" UUID NOT NULL,
  "messageId" UUID NOT NULL,
  "isUpvoted" BOOLEAN NOT NULL,
  PRIMARY KEY ("chatId", "messageId"),
  FOREIGN KEY ("chatId") REFERENCES "Chat" ("id"),
  FOREIGN KEY ("messageId") REFERENCES "Message" ("id")
);

-- Vote table (v2)
CREATE TABLE IF NOT EXISTS "Vote_v2" (
  "chatId" UUID NOT NULL,
  "messageId" UUID NOT NULL,
  "isUpvoted" BOOLEAN NOT NULL,
  PRIMARY KEY ("chatId", "messageId"),
  FOREIGN KEY ("chatId") REFERENCES "Chat" ("id"),
  FOREIGN KEY ("messageId") REFERENCES "Message_v2" ("id")
);

-- Document table
CREATE TABLE IF NOT EXISTS "Document" (
  "id" UUID NOT NULL,
  "createdAt" TIMESTAMP NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT,
  "kind" VARCHAR(4) NOT NULL DEFAULT 'text' CHECK ("kind" IN ('text', 'code', 'image', 'sheet')),
  "userId" UUID NOT NULL REFERENCES "User" ("id"),
  PRIMARY KEY ("id", "createdAt")
);

-- Suggestion table
CREATE TABLE IF NOT EXISTS "Suggestion" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "documentId" UUID NOT NULL,
  "documentCreatedAt" TIMESTAMP NOT NULL,
  "originalText" TEXT NOT NULL,
  "suggestedText" TEXT NOT NULL,
  "description" TEXT,
  "isResolved" BOOLEAN NOT NULL DEFAULT false,
  "userId" UUID NOT NULL REFERENCES "User" ("id"),
  "createdAt" TIMESTAMP NOT NULL,
  FOREIGN KEY ("documentId", "documentCreatedAt") REFERENCES "Document" ("id", "createdAt")
);

-- Stream table
CREATE TABLE IF NOT EXISTS "Stream" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chatId" UUID NOT NULL,
  "createdAt" TIMESTAMP NOT NULL,
  FOREIGN KEY ("chatId") REFERENCES "Chat" ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "Chat_userId_idx" ON "Chat" ("userId");
CREATE INDEX IF NOT EXISTS "Message_chatId_idx" ON "Message" ("chatId");
CREATE INDEX IF NOT EXISTS "Message_v2_chatId_idx" ON "Message_v2" ("chatId");
CREATE INDEX IF NOT EXISTS "Document_userId_idx" ON "Document" ("userId");
CREATE INDEX IF NOT EXISTS "Suggestion_document_composite_idx" ON "Suggestion" ("documentId", "documentCreatedAt");
CREATE INDEX IF NOT EXISTS "Suggestion_userId_idx" ON "Suggestion" ("userId");
CREATE INDEX IF NOT EXISTS "Stream_chatId_idx" ON "Stream" ("chatId");
