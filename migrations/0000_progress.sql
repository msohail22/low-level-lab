CREATE TABLE `progress` (
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `kind`, `key`),
	CONSTRAINT "progress_kind" CHECK("progress"."kind" in ('solved', 'setting'))
);
--> statement-breakpoint
CREATE INDEX `progress_by_key` ON `progress` (`kind`,`key`);