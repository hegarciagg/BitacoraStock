
import mysql from "mysql2/promise";
import "dotenv/config";

async function createDb() {
  const url = process.env.DATABASE_URL;
  const serverUrl = url?.replace(/\/bitacora$/, ""); // Removing bitacora from url

  console.log("🛠️ Connecting to MySQL server...");
  try {
    const connection = await mysql.createConnection("mysql://root@localhost:3306");
    console.log("✅ Connected.");
    
    console.log("📂 Creating database 'bitacora_stock'...");
    await connection.query("CREATE DATABASE IF NOT EXISTS bitacora_stock");
    console.log("✅ Database 'bitacora_stock' created.");
    
    await connection.end();
  } catch (error) {
    console.error("❌ Error creating database:", error);
  }
}

createDb();
