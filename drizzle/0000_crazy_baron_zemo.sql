CREATE TABLE `activeToken` (
	`token` text NOT NULL,
	`userEmail` text NOT NULL,
	`expiresAt` integer NOT NULL,
	PRIMARY KEY(`token`, `userEmail`),
	FOREIGN KEY (`userEmail`) REFERENCES `user`(`email`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `frqAttempt` (
	`testId` integer NOT NULL,
	`stimulusId` integer NOT NULL,
	`questionId` integer NOT NULL,
	`questionNumber` integer NOT NULL,
	`scoredPoints` integer,
	`scoringNotes` text,
	`response` text,
	FOREIGN KEY (`testId`) REFERENCES `testAttempt`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`stimulusId`) REFERENCES `stimulus`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`questionId`) REFERENCES `question`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`testId`,`stimulusId`) REFERENCES `testStimulus`(`testId`,`stimulusId`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mcqAttempt` (
	`testId` integer NOT NULL,
	`stimulusId` integer NOT NULL,
	`questionId` integer NOT NULL,
	`questionNumber` integer NOT NULL,
	`scoredPoints` integer,
	`response` integer,
	FOREIGN KEY (`testId`) REFERENCES `testAttempt`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`stimulusId`) REFERENCES `stimulus`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`questionId`) REFERENCES `question`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`response`) REFERENCES `questionChoice`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`testId`,`stimulusId`) REFERENCES `testStimulus`(`testId`,`stimulusId`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pendingVerification` (
	`code` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`email` text NOT NULL,
	`expiresAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `question` (
	`version` integer NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subjectId` integer NOT NULL,
	`stimulusId` integer NOT NULL,
	`format` text NOT NULL,
	`content` text NOT NULL,
	`totalPoints` integer NOT NULL,
	`gradingGuidelines` text,
	FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`stimulusId`) REFERENCES `stimulus`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `questionChoice` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`questionId` integer NOT NULL,
	`choice` text NOT NULL,
	`correct` integer NOT NULL,
	`explanation` text,
	FOREIGN KEY (`questionId`) REFERENCES `question`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `questionUnit` (
	`unitId` integer NOT NULL,
	`questionId` integer NOT NULL,
	PRIMARY KEY(`questionId`, `unitId`),
	FOREIGN KEY (`unitId`) REFERENCES `unit`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`questionId`) REFERENCES `question`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `stimulus` (
	`version` integer NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subjectId` integer NOT NULL,
	`content` text,
	`imageUrl` text,
	`imageAltText` text,
	`attribution` text,
	FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `stimulusUnit` (
	`stimulusId` integer NOT NULL,
	`unitId` integer NOT NULL,
	PRIMARY KEY(`stimulusId`, `unitId`),
	FOREIGN KEY (`stimulusId`) REFERENCES `stimulus`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`unitId`) REFERENCES `unit`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subject` (
	`version` integer NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `testAttempt` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subjectId` integer NOT NULL,
	`userEmail` text NOT NULL,
	`createdAt` integer NOT NULL,
	`complete` integer NOT NULL,
	FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`userEmail`) REFERENCES `user`(`email`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `testStimulus` (
	`testId` integer NOT NULL,
	`stimulusId` integer NOT NULL,
	`groupNumber` integer NOT NULL,
	PRIMARY KEY(`stimulusId`, `testId`),
	FOREIGN KEY (`testId`) REFERENCES `testAttempt`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`stimulusId`) REFERENCES `stimulus`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `unit` (
	`version` integer NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subjectId` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`email` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pendingVerification_token_unique` ON `pendingVerification` (`token`);