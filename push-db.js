import { execSync } from "child_process";
import * as dotenv from "dotenv";
dotenv.config();

console.log("Using DB:", process.env.DATABASE_URL);

try {
  execSync("npx drizzle-kit push", { stdio: "inherit" });
} catch (e) {
  console.error("Migration failed");
  process.exit(1);
}
