
import fs from "fs";
import path from "path";

const drizzleDir = path.join(process.cwd(), "drizzle");

if (fs.existsSync(drizzleDir)) {
  const files = fs.readdirSync(drizzleDir);
  for (const file of files) {
    if (file.endsWith(".sql") || file === "meta" || file === "migrations") {
      const fullPath = path.join(drizzleDir, file);
      console.log(`Deleting ${fullPath}...`);
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  }
}
console.log("✅ Drizzle directory cleaned.");
