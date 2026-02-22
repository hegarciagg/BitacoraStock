CREATE TABLE `hmm_equity_curve` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` datetime NOT NULL,
	`equity` decimal(18,4) NOT NULL,
	`drawdown` decimal(8,6),
	`regime` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hmm_equity_curve_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hmm_trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entry_price` decimal(18,8) NOT NULL,
	`exit_price` decimal(18,8),
	`pnl` decimal(18,4),
	`leverage` decimal(4,2) DEFAULT '2.5',
	`entry_time` datetime NOT NULL,
	`exit_time` datetime,
	`regime` int NOT NULL,
	`confirmations` int NOT NULL,
	`is_open` int DEFAULT 1,
	`capital_before` decimal(18,4),
	`capital_after` decimal(18,4),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hmm_trades_id` PRIMARY KEY(`id`)
);
