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
