
import mysql from "mysql2/promise";
import "dotenv/config";

async function recreateDb() {
  const url = process.env.DATABASE_URL;
  const serverUrl = url?.replace(/\/bitacora_stock$/, "");

  console.log("🛠️ Connecting to MySQL server...");
  try {
    const connection = await mysql.createConnection("mysql://root@localhost:3306");
    console.log("✅ Connected.");
    
    console.log("🔥 Dropping database 'bitacora_stock'...");
    await connection.query("DROP DATABASE IF EXISTS bitacora_stock");
    
    console.log("📂 Creating database 'bitacora_stock'...");
    await connection.query("CREATE DATABASE bitacora_stock");
    console.log("✅ Database 'bitacora_stock' recreated.");
    
    await connection.end();
  } catch (error) {
    console.error("❌ Error recreating database:", error);
  }
}

recreateDb();
