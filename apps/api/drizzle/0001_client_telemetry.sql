CREATE TABLE "device" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_id" text,
	"platform" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"browser_name" text,
	"browser_version" text,
	"os_name" text,
	"os_version" text,
	"device_type" text,
	"country" text,
	"city" text,
	"app_version" text,
	"fingerprint" text NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_log" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"request_id" text NOT NULL,
	"platform" text NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"status_code" integer NOT NULL,
	"latency_ms" integer NOT NULL,
	"user_id" text,
	"device_id" text,
	"ip_address" text,
	"user_agent" text,
	"browser_name" text,
	"browser_version" text,
	"os_name" text,
	"os_version" text,
	"device_type" text,
	"country" text,
	"city" text,
	"app_version" text
);
--> statement-breakpoint
ALTER TABLE "device" ADD CONSTRAINT "device_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "device" ADD CONSTRAINT "device_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "device_userId_idx" ON "device" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "device_user_fingerprint_uidx" ON "device" USING btree ("user_id","fingerprint");
--> statement-breakpoint
CREATE INDEX "request_log_createdAt_idx" ON "request_log" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "request_log_userId_createdAt_idx" ON "request_log" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX "request_log_platform_createdAt_idx" ON "request_log" USING btree ("platform","created_at");
