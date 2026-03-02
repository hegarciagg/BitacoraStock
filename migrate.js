import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log("Connecting to:", process.env.DATABASE_URL);
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log("Creating hmm_equity_curve...");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS hmm_equity_curve (
      id int AUTO_INCREMENT NOT NULL,
      timestamp datetime NOT NULL,
      equity decimal(18,4) NOT NULL,
      drawdown decimal(8,6),
      regime int,
      createdAt timestamp NOT NULL DEFAULT (now()),
      PRIMARY KEY(id)
    );
  `);

  console.log("Creating hmm_trades...");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS hmm_trades (
      id int AUTO_INCREMENT NOT NULL,
      entry_price decimal(18,8) NOT NULL,
      exit_price decimal(18,8),
      pnl decimal(18,4),
      leverage decimal(4,2) DEFAULT '1.3',
      entry_time datetime NOT NULL,
      exit_time datetime,
      regime int NOT NULL,
      confirmations int NOT NULL,
      is_open int DEFAULT 1,
      capital_before decimal(18,4),
      capital_after decimal(18,4),
      createdAt timestamp NOT NULL DEFAULT (now()),
      PRIMARY KEY(id)
    );
  `);
  
  console.log("HMM Tables created successfully!");
  process.exit(0);
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});
