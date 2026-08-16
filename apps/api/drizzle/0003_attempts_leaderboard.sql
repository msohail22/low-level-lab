CREATE TABLE "attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"question_id" text NOT NULL,
	"boolean_value" boolean,
	"is_correct" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attempt_option" (
	"id" text PRIMARY KEY NOT NULL,
	"attempt_id" text NOT NULL,
	"option_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attempt" ADD CONSTRAINT "attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "attempt" ADD CONSTRAINT "attempt_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "attempt_option" ADD CONSTRAINT "attempt_option_attempt_id_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempt"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "attempt_option" ADD CONSTRAINT "attempt_option_option_id_question_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."question_option"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "attempt_userId_idx" ON "attempt" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "attempt_questionId_idx" ON "attempt" USING btree ("question_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "attempt_user_question_uidx" ON "attempt" USING btree ("user_id","question_id");
--> statement-breakpoint
CREATE INDEX "attempt_option_attemptId_idx" ON "attempt_option" USING btree ("attempt_id");
