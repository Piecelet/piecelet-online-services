CREATE TABLE `neodb_clients` (
	`id` text PRIMARY KEY NOT NULL,
	`instance` text NOT NULL,
	`client_id` text NOT NULL,
	`client_secret` text NOT NULL,
	`redirect_uri` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `neodb_clients_instance_unique` ON `neodb_clients` (`instance`);--> statement-breakpoint
CREATE TABLE `neodb_states` (
	`id` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`instance` text NOT NULL,
	`callback_url` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `neodb_states_state_unique` ON `neodb_states` (`state`);