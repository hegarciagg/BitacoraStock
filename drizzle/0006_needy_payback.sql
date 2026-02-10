CREATE TABLE `portfolioHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portfolioId` int NOT NULL,
	`userId` int NOT NULL,
	`changeType` enum('created','updated','asset_added','asset_removed','asset_modified','rebalanced','deleted') NOT NULL,
	`description` text,
	`previousValue` decimal(18,2),
	`newValue` decimal(18,2),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolioHistory_id` PRIMARY KEY(`id`)
);
