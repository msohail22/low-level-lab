ALTER TABLE "question" ADD COLUMN "why_wrong" text;
--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "related_question_id" text;
--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_related_question_id_question_id_fk" FOREIGN KEY ("related_question_id") REFERENCES "public"."question"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "learning_path" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "learning_path_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "learning_path_topic" (
	"id" text PRIMARY KEY NOT NULL,
	"path_id" text NOT NULL,
	"topic_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_learning" (
	"user_id" text PRIMARY KEY NOT NULL,
	"daily_goal" integer DEFAULT 3 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_active_date" date,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmark" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"question_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spaced_review" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"question_id" text NOT NULL,
	"due_at" timestamp NOT NULL,
	"interval_days" integer DEFAULT 1 NOT NULL,
	"ease_factor" double precision DEFAULT 2.5 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learning_path_topic" ADD CONSTRAINT "learning_path_topic_path_id_learning_path_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."learning_path"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "learning_path_topic" ADD CONSTRAINT "learning_path_topic_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_learning" ADD CONSTRAINT "user_learning_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "spaced_review" ADD CONSTRAINT "spaced_review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "spaced_review" ADD CONSTRAINT "spaced_review_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "learning_path_topic_pathId_idx" ON "learning_path_topic" USING btree ("path_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "learning_path_topic_uidx" ON "learning_path_topic" USING btree ("path_id","topic_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "bookmark_user_question_uidx" ON "bookmark" USING btree ("user_id","question_id");
--> statement-breakpoint
CREATE INDEX "bookmark_userId_idx" ON "bookmark" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "spaced_review_user_question_uidx" ON "spaced_review" USING btree ("user_id","question_id");
--> statement-breakpoint
CREATE INDEX "spaced_review_dueAt_idx" ON "spaced_review" USING btree ("due_at");
--> statement-breakpoint
CREATE INDEX "spaced_review_userId_idx" ON "spaced_review" USING btree ("user_id");
--> statement-breakpoint
INSERT INTO "learning_path" ("id", "slug", "title", "description", "sort_order") VALUES
	('path_cpp_foundations', 'cpp-foundations', 'C++ Foundations', 'Pointers → stack/heap → RAII', 10);
--> statement-breakpoint
INSERT INTO "learning_path_topic" ("id", "path_id", "topic_id", "sort_order") VALUES
	('lpt_1', 'path_cpp_foundations', 'topic_pointers', 10),
	('lpt_2', 'path_cpp_foundations', 'topic_stack_heap', 20),
	('lpt_3', 'path_cpp_foundations', 'topic_raii', 30);
