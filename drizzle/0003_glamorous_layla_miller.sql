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
