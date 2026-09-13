CREATE TABLE IF NOT EXISTS "user_role" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"role" text NOT NULL,
	"topic_id" text REFERENCES "topic"("id") ON DELETE CASCADE,
	"created_at" timestamp NOT NULL DEFAULT now(),
	CONSTRAINT "user_role_unique" UNIQUE("user_id", "role", "topic_id"),
	CONSTRAINT "user_role_role_check" CHECK ("role" IN ('super_admin', 'admin', 'reviewer', 'member'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_role_user_idx" ON "user_role" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_role_topic_idx" ON "user_role" ("topic_id");
