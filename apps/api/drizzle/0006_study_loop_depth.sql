ALTER TABLE "topic" ADD COLUMN "prerequisite_topic_id" text;
--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "worked_solution" text;
--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "diagram_markdown" text;
--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "similar_question_id" text;
--> statement-breakpoint
ALTER TABLE "attempt" ADD COLUMN "confidence" integer;
--> statement-breakpoint
ALTER TABLE "user_learning" ADD COLUMN "last_question_id" text;
--> statement-breakpoint
ALTER TABLE "user_learning" ADD COLUMN "last_topic_id" text;
--> statement-breakpoint
ALTER TABLE "user_learning" ADD COLUMN "last_path_id" text;
--> statement-breakpoint
ALTER TABLE "user_learning" ADD COLUMN "last_activity_at" timestamp;
--> statement-breakpoint
CREATE TABLE "explanation_vote" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"user_id" text NOT NULL,
	"helpful" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_duplicate_flag" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"similar_question_id" text,
	"reporter_id" text NOT NULL,
	"note" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ui_event" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"session_key" text,
	"route" text,
	"question_id" text,
	"event_name" text NOT NULL,
	"target_id" text,
	"duration_ms" integer,
	"meta" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "topic" ADD CONSTRAINT "topic_prerequisite_topic_id_topic_id_fk" FOREIGN KEY ("prerequisite_topic_id") REFERENCES "public"."topic"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_similar_question_id_question_id_fk" FOREIGN KEY ("similar_question_id") REFERENCES "public"."question"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_learning" ADD CONSTRAINT "user_learning_last_question_id_question_id_fk" FOREIGN KEY ("last_question_id") REFERENCES "public"."question"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_learning" ADD CONSTRAINT "user_learning_last_topic_id_topic_id_fk" FOREIGN KEY ("last_topic_id") REFERENCES "public"."topic"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_learning" ADD CONSTRAINT "user_learning_last_path_id_learning_path_id_fk" FOREIGN KEY ("last_path_id") REFERENCES "public"."learning_path"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "explanation_vote" ADD CONSTRAINT "explanation_vote_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "explanation_vote" ADD CONSTRAINT "explanation_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_duplicate_flag" ADD CONSTRAINT "question_duplicate_flag_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_duplicate_flag" ADD CONSTRAINT "question_duplicate_flag_similar_question_id_question_id_fk" FOREIGN KEY ("similar_question_id") REFERENCES "public"."question"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_duplicate_flag" ADD CONSTRAINT "question_duplicate_flag_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ui_event" ADD CONSTRAINT "ui_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ui_event" ADD CONSTRAINT "ui_event_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "explanation_vote_uidx" ON "explanation_vote" USING btree ("question_id","user_id");
--> statement-breakpoint
CREATE INDEX "explanation_vote_questionId_idx" ON "explanation_vote" USING btree ("question_id");
--> statement-breakpoint
CREATE INDEX "question_duplicate_flag_status_idx" ON "question_duplicate_flag" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "question_duplicate_flag_questionId_idx" ON "question_duplicate_flag" USING btree ("question_id");
--> statement-breakpoint
CREATE INDEX "ui_event_userId_idx" ON "ui_event" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "ui_event_eventName_idx" ON "ui_event" USING btree ("event_name");
--> statement-breakpoint
CREATE INDEX "ui_event_createdAt_idx" ON "ui_event" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "ui_event_questionId_idx" ON "ui_event" USING btree ("question_id");
--> statement-breakpoint
UPDATE "topic" SET "prerequisite_topic_id" = 'topic_pointers' WHERE "id" = 'topic_raii';
