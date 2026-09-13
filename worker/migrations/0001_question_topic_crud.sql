CREATE TABLE IF NOT EXISTS "topic" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"name" text NOT NULL UNIQUE,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "question" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"type" text NOT NULL,
	"topic_id" text NOT NULL REFERENCES "topic"("id") ON DELETE RESTRICT,
	"subtopic" text,
	"difficulty" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"correct_answer" jsonb NOT NULL,
	"explanation" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"author_id" text NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "question_topic_id_idx" ON "question" ("topic_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "question_status_idx" ON "question" ("status");
