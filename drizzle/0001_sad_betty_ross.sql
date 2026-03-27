CREATE TABLE `accountTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accountTags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`username` varchar(255),
	`email` varchar(320),
	`password` text,
	`url` varchar(2048),
	`notes` text,
	`taskLinkStatus` varchar(50) DEFAULT 'active',
	`expirationDate` timestamp,
	`isArchived` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountId` int,
	`action` varchar(50) NOT NULL,
	`changes` json,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`color` varchar(7) DEFAULT '#3b82f6',
	`icon` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customFieldTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`fieldType` enum('text','number','date','select','checkbox','textarea') NOT NULL,
	`isRequired` boolean DEFAULT false,
	`options` json,
	`placeholder` varchar(255),
	`description` text,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customFieldTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customFieldValues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`fieldTemplateId` int NOT NULL,
	`value` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customFieldValues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`type` enum('account_created','account_updated','account_deleted','category_created','tag_created') NOT NULL,
	`relatedAccountId` int,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`color` varchar(7) DEFAULT '#8b5cf6',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_accountTags_accountId` ON `accountTags` (`accountId`);--> statement-breakpoint
CREATE INDEX `idx_accountTags_tagId` ON `accountTags` (`tagId`);--> statement-breakpoint
CREATE INDEX `idx_accounts_userId` ON `accounts` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_accounts_categoryId` ON `accounts` (`categoryId`);--> statement-breakpoint
CREATE INDEX `idx_auditLogs_userId` ON `auditLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_auditLogs_accountId` ON `auditLogs` (`accountId`);--> statement-breakpoint
CREATE INDEX `idx_categories_userId` ON `categories` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_customFieldTemplates_userId` ON `customFieldTemplates` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_customFieldValues_accountId` ON `customFieldValues` (`accountId`);--> statement-breakpoint
CREATE INDEX `idx_customFieldValues_fieldTemplateId` ON `customFieldValues` (`fieldTemplateId`);--> statement-breakpoint
CREATE INDEX `idx_notifications_userId` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_tags_userId` ON `tags` (`userId`);