CREATE TABLE `investments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portfolioId` int NOT NULL,
	`userId` int NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`assetName` varchar(255) NOT NULL,
	`assetType` enum('stock','etf','bond','crypto','commodity','other') NOT NULL,
	`action` enum('buy','sell','dividend') NOT NULL,
	`quantity` decimal(18,8) NOT NULL,
	`unitPrice` decimal(18,8) NOT NULL,
	`totalValue` decimal(18,2) NOT NULL,
	`commission` decimal(18,2) DEFAULT '0',
	`transactionDate` timestamp NOT NULL,
	`saleDate` datetime,
	`salePrice` decimal(18,8),
	`saleValue` decimal(18,2),
	`saleCommission` decimal(18,2) DEFAULT '0',
	`dividend` decimal(18,2) DEFAULT '0',
	`comments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monteCarloSimulations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portfolioId` int NOT NULL,
	`userId` int NOT NULL,
	`numSimulations` int NOT NULL,
	`timeHorizonDays` int NOT NULL,
	`initialCapital` decimal(18,2) NOT NULL,
	`expectedReturn` decimal(5,4),
	`volatility` decimal(5,4),
	`sharpeRatio` decimal(8,4),
	`valueAtRisk95` decimal(18,2),
	`valueAtRisk99` decimal(18,2),
	`meanFinalValue` decimal(18,2),
	`medianFinalValue` decimal(18,2),
	`percentile5` decimal(18,2),
	`percentile95` decimal(18,2),
	`simulationData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monteCarloSimulations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`portfolioId` int,
	`type` enum('rebalance_alert','risk_alert','opportunity','report_ready','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`read` int DEFAULT 0,
	`actionUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolioAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portfolioId` int NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`assetName` varchar(255) NOT NULL,
	`currentPrice` decimal(18,8),
	`quantity` decimal(18,8) NOT NULL,
	`totalValue` decimal(18,2) NOT NULL,
	`percentage` decimal(5,2) NOT NULL,
	`averageCost` decimal(18,8),
	`gainLoss` decimal(18,2),
	`gainLossPercent` decimal(5,2),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `portfolioReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portfolioId` int NOT NULL,
	`userId` int NOT NULL,
	`reportType` enum('analysis','simulation','recommendations','comprehensive') NOT NULL,
	`title` varchar(255) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSizeBytes` int,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolioReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portfolioId` int NOT NULL,
	`userId` int NOT NULL,
	`simulationId` int,
	`recommendationType` enum('rebalance','diversify','risk_alert','opportunity','optimization') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`suggestedActions` json,
	`priority` enum('low','medium','high') DEFAULT 'medium',
	`status` enum('active','dismissed','completed') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sentimentAnalysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portfolioId` int NOT NULL,
	`userId` int NOT NULL,
	`overallSentiment` decimal(3,2) NOT NULL,
	`marketConfidence` decimal(3,2) NOT NULL,
	`riskAdjustment` decimal(5,2) NOT NULL,
	`recommendedAction` enum('comprar','vender','mantener') NOT NULL,
	`correlations` json,
	`newsCount` int DEFAULT 0,
	`analysisDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sentimentAnalysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sentimentAnalysisCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cacheKey` varchar(255) NOT NULL,
	`portfolioId` int,
	`userId` int NOT NULL,
	`analysisData` json NOT NULL,
	`newsCount` int DEFAULT 0,
	`ttlSeconds` int DEFAULT 3600,
	`expiresAt` timestamp NOT NULL,
	`hits` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sentimentAnalysisCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `sentimentAnalysisCache_cacheKey_unique` UNIQUE(`cacheKey`)
);
--> statement-breakpoint
CREATE TABLE `userSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`userAgent` text,
	`ipAddress` varchar(45),
	`deviceType` varchar(50),
	`browserName` varchar(100),
	`osName` varchar(100),
	`isCurrentSession` int DEFAULT 0,
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`profilePicture` text,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`riskProfile` enum('conservative','moderate','aggressive') DEFAULT 'moderate',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
