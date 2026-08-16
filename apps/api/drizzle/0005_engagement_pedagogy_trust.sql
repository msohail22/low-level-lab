CREATE TABLE "daily_challenge" (
	"id" text PRIMARY KEY NOT NULL,
	"challenge_date" date NOT NULL,
	"question_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_challenge_challenge_date_unique" UNIQUE("challenge_date")
);
--> statement-breakpoint
CREATE TABLE "achievement" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "achievement_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_achievement" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"achievement_id" text NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "author_follow" (
	"id" text PRIMARY KEY NOT NULL,
	"follower_id" text NOT NULL,
	"author_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_set" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"owner_id" text NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "question_set_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "question_set_item" (
	"id" text PRIMARY KEY NOT NULL,
	"set_id" text NOT NULL,
	"question_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_hint" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"body" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "glossary_term" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"term" text NOT NULL,
	"definition" text NOT NULL,
	"topic_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "glossary_term_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "question_report" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"reporter_id" text NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_version" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"version" integer NOT NULL,
	"snapshot" text NOT NULL,
	"editor_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sandbox_submission" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"user_id" text NOT NULL,
	"source_code" text,
	"submitted_output" text,
	"is_correct" boolean,
	"feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_challenge" ADD CONSTRAINT "daily_challenge_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_achievement" ADD CONSTRAINT "user_achievement_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_achievement" ADD CONSTRAINT "user_achievement_achievement_id_achievement_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievement"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_comment" ADD CONSTRAINT "question_comment_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_comment" ADD CONSTRAINT "question_comment_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "author_follow" ADD CONSTRAINT "author_follow_follower_id_user_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "author_follow" ADD CONSTRAINT "author_follow_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_set" ADD CONSTRAINT "question_set_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_set_item" ADD CONSTRAINT "question_set_item_set_id_question_set_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."question_set"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_set_item" ADD CONSTRAINT "question_set_item_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_hint" ADD CONSTRAINT "question_hint_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "glossary_term" ADD CONSTRAINT "glossary_term_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_report" ADD CONSTRAINT "question_report_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_report" ADD CONSTRAINT "question_report_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_version" ADD CONSTRAINT "question_version_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_version" ADD CONSTRAINT "question_version_editor_id_user_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sandbox_submission" ADD CONSTRAINT "sandbox_submission_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sandbox_submission" ADD CONSTRAINT "sandbox_submission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "daily_challenge_date_idx" ON "daily_challenge" USING btree ("challenge_date");
--> statement-breakpoint
CREATE UNIQUE INDEX "user_achievement_uidx" ON "user_achievement" USING btree ("user_id","achievement_id");
--> statement-breakpoint
CREATE INDEX "user_achievement_userId_idx" ON "user_achievement" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "question_comment_questionId_idx" ON "question_comment" USING btree ("question_id");
--> statement-breakpoint
CREATE INDEX "question_comment_status_idx" ON "question_comment" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX "author_follow_uidx" ON "author_follow" USING btree ("follower_id","author_id");
--> statement-breakpoint
CREATE INDEX "author_follow_followerId_idx" ON "author_follow" USING btree ("follower_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "question_set_item_uidx" ON "question_set_item" USING btree ("set_id","question_id");
--> statement-breakpoint
CREATE INDEX "question_set_item_setId_idx" ON "question_set_item" USING btree ("set_id");
--> statement-breakpoint
CREATE INDEX "question_hint_questionId_idx" ON "question_hint" USING btree ("question_id");
--> statement-breakpoint
CREATE INDEX "glossary_term_topicId_idx" ON "glossary_term" USING btree ("topic_id");
--> statement-breakpoint
CREATE INDEX "question_report_questionId_idx" ON "question_report" USING btree ("question_id");
--> statement-breakpoint
CREATE INDEX "question_report_status_idx" ON "question_report" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX "question_version_uidx" ON "question_version" USING btree ("question_id","version");
--> statement-breakpoint
CREATE INDEX "question_version_questionId_idx" ON "question_version" USING btree ("question_id");
--> statement-breakpoint
CREATE INDEX "sandbox_submission_questionId_idx" ON "sandbox_submission" USING btree ("question_id");
--> statement-breakpoint
INSERT INTO "achievement" ("id", "slug", "title", "description") VALUES
	('ach_first_correct', 'first-correct', 'First Correct', 'Answer your first question correctly'),
	('ach_streak_3', 'streak-3', 'Warming Up', 'Reach a 3-day streak'),
	('ach_streak_7', 'streak-7', 'Week Warrior', 'Reach a 7-day streak'),
	('ach_ten_correct', 'ten-correct', 'Solid Ten', 'Get 10 questions correct'),
	('ach_daily_challenge', 'daily-challenger', 'Daily Challenger', 'Complete a daily challenge correctly'),
	('ach_first_contribute', 'first-contribute', 'Contributor', 'Have a question approved');
--> statement-breakpoint
INSERT INTO "glossary_term" ("id", "slug", "term", "definition", "topic_id") VALUES
	('gloss_pointer', 'pointer', 'Pointer', 'A variable that stores a memory address, typically of another object.', 'topic_pointers'),
	('gloss_stack', 'stack', 'Stack', 'Region of memory for automatic storage duration; frames grow and shrink with calls.', 'topic_stack_heap'),
	('gloss_heap', 'heap', 'Heap', 'Region for dynamic allocation via new/malloc; lifetime managed explicitly or by RAII.', 'topic_stack_heap'),
	('gloss_raii', 'raii', 'RAII', 'Resource Acquisition Is Initialization: bind resource lifetime to object lifetime.', 'topic_raii'),
	('gloss_undefined', 'undefined-behavior', 'Undefined Behavior', 'Program behavior the C++ standard does not define; compilers may assume it never happens.');
