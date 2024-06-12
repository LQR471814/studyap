CREATE TABLE `completion` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `completionFunctionCall` (
	`completionId` text NOT NULL,
	`functionName` text NOT NULL,
	`result` text NOT NULL,
	FOREIGN KEY (`completionId`) REFERENCES `completion`(`id`) ON UPDATE cascade ON DELETE cascade
);
