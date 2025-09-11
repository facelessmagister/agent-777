-- Migration: Add novel-related tables
-- This migration adds tables for managing novels, their documents, and chapters

-- Novel table
CREATE TABLE IF NOT EXISTS "Novel" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "genre" VARCHAR(100) NOT NULL,
  "tone" VARCHAR(100) NOT NULL,
  "synopsis" TEXT NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'in_progress', 'completed', 'archived')),
  "targetChapterCount" INTEGER NOT NULL,
  "userId" UUID NOT NULL REFERENCES "User" ("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Document table for storing world-building, character profiles, and outlines
CREATE TABLE IF NOT EXISTS "Document" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "novelId" UUID NOT NULL REFERENCES "Novel" ("id") ON DELETE CASCADE,
  "type" VARCHAR(20) NOT NULL CHECK ("type" IN ('world', 'character', 'outline', 'chapter')),
  "title" VARCHAR(255) NOT NULL,
  "content" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "version" INTEGER NOT NULL DEFAULT 1,
  "isCurrent" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- DocumentVersion table for version history
CREATE TABLE IF NOT EXISTS "DocumentVersion" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "documentId" UUID NOT NULL REFERENCES "Document" ("id") ON DELETE CASCADE,
  "version" INTEGER NOT NULL,
  "content" JSONB NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE("documentId", "version")
);

-- Chapter table (extends Document with chapter-specific fields)
CREATE TABLE IF NOT EXISTS "Chapter" (
  "id" UUID PRIMARY KEY REFERENCES "Document" ("id") ON DELETE CASCADE,
  "number" INTEGER NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "summary" TEXT,
  "wordCount" INTEGER NOT NULL DEFAULT 0,
  "status" VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'in_review', 'final', 'published')),
  "position" INTEGER NOT NULL,
  "novelId" UUID NOT NULL REFERENCES "Novel" ("id") ON DELETE CASCADE,
  UNIQUE("novelId", "number")
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_novel_user" ON "Novel" ("userId");
CREATE INDEX IF NOT EXISTS "idx_document_novel" ON "Document" ("novelId");
CREATE INDEX IF NOT EXISTS "idx_document_type" ON "Document" ("type");
CREATE INDEX IF NOT EXISTS "idx_document_version_document" ON "DocumentVersion" ("documentId");
CREATE INDEX IF NOT EXISTS "idx_chapter_novel" ON "Chapter" ("novelId");
CREATE INDEX IF NOT EXISTS "idx_chapter_number" ON "Chapter" ("number");

-- Function to update the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic updatedAt updates
CREATE TRIGGER update_novel_updated_at
BEFORE UPDATE ON "Novel"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_updated_at
BEFORE UPDATE ON "Document"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_version_updated_at
BEFORE UPDATE ON "DocumentVersion"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for better documentation
COMMENT ON TABLE "Novel" IS 'Stores novel metadata and basic information';
COMMENT ON TABLE "Document" IS 'Stores various types of documents related to novels (world-building, characters, outlines, chapters)';
COMMENT ON TABLE "DocumentVersion" IS 'Maintains version history for documents';
COMMENT ON TABLE "Chapter" IS 'Extends Document with chapter-specific fields';

-- Add comments for enum types
COMMENT ON COLUMN "Novel"."status" IS 'draft: Initial creation, in_progress: Actively being written, completed: Finished writing, archived: No longer active';
COMMENT ON COLUMN "Document"."type" IS 'world: World-building document, character: Character profiles, outline: Story outline, chapter: Chapter content';
COMMENT ON COLUMN "Chapter"."status" IS 'draft: Initial creation, in_review: Ready for review, final: Approved version, published: Made available to readers';
