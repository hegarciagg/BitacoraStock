
import mysql from "mysql2/promise";
import "dotenv/config";

async function createDb() {
  const url = process.env.DATABASE_URL;
  // Remove database name from URL to connect to server only
  const serverUrl = url?.replace(/\/bitacora_db$/, ""); 

  console.log("🛠️ Connecting to MySQL server...");
  try {
    const connection = await mysql.createConnection(serverUrl!);
    console.log("✅ Connected.");
    
    console.log("📂 Creating database 'bitacora_db'...");
    await connection.query("CREATE DATABASE IF NOT EXISTS bitacora_db");
    console.log("✅ Database created (or already exists).");
    
    await connection.end();
  } catch (error) {
    console.error("❌ Error creating database:", error);
  }
}

createDb();
