CREATE TABLE `frqAttempt` (
	`testId` integer NOT NULL,
	`stimulusId` integer,
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
	`stimulusId` integer,
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
CREATE TABLE `question` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subjectId` integer NOT NULL,
	`stimulusId` integer,
	`format` text NOT NULL,
	`content` text NOT NULL,
	`totalPoints` integer NOT NULL,
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
CREATE TABLE `questionGradingGuidelines` (
	`questionId` integer PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
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
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subjectId` integer NOT NULL,
	`content` text NOT NULL,
	`imageUrl` text,
	`imageAltText` text,
	`attribution` text NOT NULL,
	`forFormat` text NOT NULL,
	FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subject` (
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
	`stimulusId` integer,
	`groupNumber` integer NOT NULL,
	PRIMARY KEY(`stimulusId`, `testId`),
	FOREIGN KEY (`testId`) REFERENCES `testAttempt`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`stimulusId`) REFERENCES `stimulus`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `unit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subjectId` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`email` text PRIMARY KEY NOT NULL
);
