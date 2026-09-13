ALTER TABLE "question"
	ADD COLUMN IF NOT EXISTS "revision" integer NOT NULL DEFAULT 1,
	ADD COLUMN IF NOT EXISTS "content_hash" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "rejection_reason" text,
	ADD COLUMN IF NOT EXISTS "submitted_at" timestamp,
	ADD COLUMN IF NOT EXISTS "approved_at" timestamp,
	ADD COLUMN IF NOT EXISTS "published_at" timestamp;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "question_revision" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL REFERENCES "question"("id") ON DELETE CASCADE,
	"revision" integer NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"type" text NOT NULL,
	"topic_id" text NOT NULL REFERENCES "topic"("id") ON DELETE RESTRICT,
	"subtopic" text,
	"difficulty" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_answer" jsonb NOT NULL,
	"explanation" text,
	"content_hash" text NOT NULL,
	"created_by" text NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
	"created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "question_workflow_event" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL REFERENCES "question"("id") ON DELETE CASCADE,
	"actor_id" text NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
	"from_status" text NOT NULL,
	"to_status" text NOT NULL,
	"reason" text,
	"created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "question_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"question_id" text NOT NULL REFERENCES "question"("id") ON DELETE CASCADE,
	"answer" jsonb NOT NULL,
	"correct" boolean NOT NULL,
	"created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "question_progress" (
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"question_id" text NOT NULL REFERENCES "question"("id") ON DELETE CASCADE,
	"solved" boolean NOT NULL DEFAULT false,
	"attempts" integer NOT NULL DEFAULT 0,
	"last_attempt_at" timestamp NOT NULL DEFAULT now(),
	"solved_at" timestamp,
	PRIMARY KEY ("user_id", "question_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "question_search_idx" ON "question" USING gin (to_tsvector('english', "title" || ' ' || "body"));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "question_title_trgm_idx" ON "question" USING gin ("title" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "question_topic_status_idx" ON "question" ("topic_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "question_type_difficulty_idx" ON "question" ("type", "difficulty");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "question_subtopic_idx" ON "question" ("subtopic");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "question_attempt_user_idx" ON "question_attempt" ("user_id", "question_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "question_progress_user_idx" ON "question_progress" ("user_id", "solved");
