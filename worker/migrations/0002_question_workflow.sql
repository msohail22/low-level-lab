ALTER TABLE "question"
	ADD COLUMN IF NOT EXISTS "submitted_at" timestamp,
	ADD COLUMN IF NOT EXISTS "approved_at" timestamp,
	ADD COLUMN IF NOT EXISTS "published_at" timestamp;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "question_workflow_status_idx" ON "question" ("status");
