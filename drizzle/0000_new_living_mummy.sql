CREATE TABLE `frq` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question` text NOT NULL,
	`imageUrl` text
);
--> statement-breakpoint
CREATE TABLE `frqUnit` (
	`unitId` integer NOT NULL,
	`frqId` integer NOT NULL,
	PRIMARY KEY(`frqId`, `unitId`),
	FOREIGN KEY (`unitId`) REFERENCES `unit`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`frqId`) REFERENCES `frq`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mcq` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question` text NOT NULL,
	`imageUrl` text
);
--> statement-breakpoint
CREATE TABLE `mcqAttempt` (
	`testId` integer NOT NULL,
	`questionId` integer NOT NULL,
	FOREIGN KEY (`testId`) REFERENCES `testAttempt`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mcqChoice` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`questionId` integer NOT NULL,
	`choice` text NOT NULL,
	`correct` integer NOT NULL,
	FOREIGN KEY (`questionId`) REFERENCES `mcq`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mcqUnit` (
	`unitId` integer NOT NULL,
	`mcqId` integer NOT NULL,
	PRIMARY KEY(`mcqId`, `unitId`),
	FOREIGN KEY (`unitId`) REFERENCES `unit`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`mcqId`) REFERENCES `mcq`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `stimulus` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text,
	`imageUrl` text
);
--> statement-breakpoint
CREATE TABLE `subject` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `testAttempt` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userEmail` text NOT NULL,
	FOREIGN KEY (`userEmail`) REFERENCES `user`(`email`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `unit` (
	`id` text PRIMARY KEY NOT NULL,
	`subjectId` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`email` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
