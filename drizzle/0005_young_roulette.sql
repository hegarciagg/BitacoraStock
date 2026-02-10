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
