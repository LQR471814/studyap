CREATE TABLE `frqPart` (
	`stimulusId` integer NOT NULL,
	`partNo` integer NOT NULL,
	`question` text NOT NULL,
	PRIMARY KEY(`partNo`, `stimulusId`),
	FOREIGN KEY (`stimulusId`) REFERENCES `stimulus`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mcq` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question` text NOT NULL,
	`stimulusId` integer NOT NULL,
	`answerIndex` integer NOT NULL,
	`explanation` text NOT NULL,
	FOREIGN KEY (`stimulusId`) REFERENCES `stimulus`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mcqOption` (
	`index` integer NOT NULL,
	`mcqId` integer NOT NULL,
	`text` text NOT NULL,
	PRIMARY KEY(`index`, `mcqId`),
	FOREIGN KEY (`mcqId`) REFERENCES `mcq`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `stimulus` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`unit` text NOT NULL,
	`text` text NOT NULL,
	`testId` integer NOT NULL,
	FOREIGN KEY (`testId`) REFERENCES `test`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `test` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subject` text NOT NULL,
	`generatorVersion` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `useGenVersion` (
	`subject` text NOT NULL,
	`generatorVersion` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `useGenVersion_subject_unique` ON `useGenVersion` (`subject`);