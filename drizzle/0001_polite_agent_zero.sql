CREATE TABLE `investmentMarketComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`investmentId` int NOT NULL,
	`userId` int NOT NULL,
	`comment` text NOT NULL,
	`sentiment` enum('bullish','bearish','neutral') DEFAULT 'neutral',
	`date` datetime NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `investmentMarketComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `investments` ADD `purchaseReason` text;