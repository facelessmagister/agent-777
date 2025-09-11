-- Drizzle migration: create novel, novel_document, and document_version tables

-- Novel table (Drizzle)
CREATE TABLE IF NOT EXISTS "novel" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "genre" TEXT[] NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft','in_progress','completed','published')),
  "cover_image_url" TEXT,
  "user_id" UUID NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Novel Document table (Drizzle)
CREATE TABLE IF NOT EXISTS "novel_document" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "novel_id" UUID NOT NULL REFERENCES "novel" ("id") ON DELETE CASCADE,
  "type" VARCHAR(20) NOT NULL CHECK ("type" IN ('chapter','character','world','note')),
  "title" VARCHAR(255) NOT NULL,
  "content" JSONB,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "version" INTEGER NOT NULL DEFAULT 1,
  "is_current" BOOLEAN NOT NULL DEFAULT TRUE,
  "previous_version_id" UUID,
  "user_id" UUID NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document Version table (Drizzle)
CREATE TABLE IF NOT EXISTS "document_version" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "document_id" UUID NOT NULL REFERENCES "novel_document" ("id") ON DELETE CASCADE,
  "version" INTEGER NOT NULL,
  "content" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("document_id", "version")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_novel_user" ON "novel" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_document_novel" ON "novel_document" ("novel_id");
CREATE INDEX IF NOT EXISTS "idx_document_type" ON "novel_document" ("type");
CREATE INDEX IF NOT EXISTS "idx_document_version_document" ON "document_version" ("document_id");

-- Triggers for updated_at auto-update
CREATE OR REPLACE FUNCTION update_updated_at_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_novel_updated_at
BEFORE UPDATE ON "novel"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER trg_novel_document_updated_at
BEFORE UPDATE ON "novel_document"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER trg_document_version_updated_at
BEFORE UPDATE ON "document_version"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();
