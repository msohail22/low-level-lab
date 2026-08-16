CREATE TABLE "topic" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "topic_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "question" (
	"id" text PRIMARY KEY NOT NULL,
	"topic_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"prompt" text NOT NULL,
	"explanation" text NOT NULL,
	"difficulty" text DEFAULT 'beginner' NOT NULL,
	"code_snippet" text,
	"author_id" text NOT NULL,
	"reviewer_id" text,
	"review_note" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_option" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"label" text NOT NULL,
	"body" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_answer" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"option_id" text,
	"boolean_value" boolean,
	"is_correct" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_review" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"reviewer_id" text NOT NULL,
	"action" text NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_option" ADD CONSTRAINT "question_option_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_answer" ADD CONSTRAINT "question_answer_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_answer" ADD CONSTRAINT "question_answer_option_id_question_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."question_option"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_review" ADD CONSTRAINT "question_review_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_review" ADD CONSTRAINT "question_review_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "topic_sortOrder_idx" ON "topic" USING btree ("sort_order");
--> statement-breakpoint
CREATE INDEX "question_authorId_idx" ON "question" USING btree ("author_id");
--> statement-breakpoint
CREATE INDEX "question_status_idx" ON "question" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "question_topicId_idx" ON "question" USING btree ("topic_id");
--> statement-breakpoint
CREATE INDEX "question_option_questionId_idx" ON "question_option" USING btree ("question_id");
--> statement-breakpoint
CREATE INDEX "question_answer_questionId_idx" ON "question_answer" USING btree ("question_id");
--> statement-breakpoint
CREATE INDEX "question_review_questionId_idx" ON "question_review" USING btree ("question_id");
--> statement-breakpoint
INSERT INTO "topic" ("id", "slug", "title", "description", "sort_order") VALUES
	('topic_pointers', 'pointers-references', 'Pointers & References', '*, &, nullptr, dangling, references vs pointers', 10),
	('topic_stack_heap', 'stack-vs-heap', 'Stack vs Heap', 'Locals, new/delete, ownership intuition', 20),
	('topic_raii', 'raii', 'RAII', 'Destructors, unique ownership, unique_ptr intro', 30),
	('topic_bits', 'bits-integers', 'Bits & Integers', 'Signed vs unsigned, overflow, sizeof', 40);
