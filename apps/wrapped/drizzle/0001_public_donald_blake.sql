CREATE TABLE `wrapped_2025_items` (
	`id` text PRIMARY KEY NOT NULL,
	`uuid` text NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`display_title` text NOT NULL,
	`description` text DEFAULT '',
	`localized_title` text,
	`localized_description` text,
	`cover_image_url` text,
	`rating` real,
	`rating_count` integer,
	`rating_distribution` text,
	`tags` text,
	`parent_uuid` text,
	`url` text NOT NULL,
	`api_url` text NOT NULL,
	`external_resources` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wrapped_2025_items_uuid_unique` ON `wrapped_2025_items` (`uuid`);--> statement-breakpoint
CREATE TABLE `wrapped_2025_marks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`shelf_type` text NOT NULL,
	`category` text NOT NULL,
	`visibility` integer NOT NULL,
	`post_id` integer,
	`created_time` integer NOT NULL,
	`comment_text` text,
	`rating_grade` integer,
	`tags` text,
	`collected_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `wrapped_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `wrapped_2025_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `wrapped_2025_marks_user_id_idx` ON `wrapped_2025_marks` (`user_id`);--> statement-breakpoint
CREATE INDEX `wrapped_2025_marks_category_idx` ON `wrapped_2025_marks` (`user_id`,`category`);--> statement-breakpoint
CREATE INDEX `wrapped_2025_marks_shelf_type_idx` ON `wrapped_2025_marks` (`user_id`,`shelf_type`);--> statement-breakpoint
CREATE INDEX `wrapped_2025_marks_created_time_idx` ON `wrapped_2025_marks` (`user_id`,`created_time`);--> statement-breakpoint
CREATE INDEX `wrapped_2025_marks_category_shelf_idx` ON `wrapped_2025_marks` (`user_id`,`category`,`shelf_type`);--> statement-breakpoint
CREATE TABLE `wrapped_collection_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`year` integer NOT NULL,
	`collection_type` text NOT NULL,
	`progress` text,
	`total_collected` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`error` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `wrapped_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `wrapped_collection_tasks_user_id_idx` ON `wrapped_collection_tasks` (`user_id`);--> statement-breakpoint
CREATE INDEX `wrapped_collection_tasks_status_idx` ON `wrapped_collection_tasks` (`user_id`,`status`);