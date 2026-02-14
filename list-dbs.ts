
import mysql from "mysql2/promise";
import "dotenv/config";

async function listDbs() {
  const url = process.env.DATABASE_URL;
  const serverUrl = url?.replace(/\/bitacora_db$/, ""); 

  console.log("🛠️ Connecting to MySQL server...");
  try {
    const connection = await mysql.createConnection(serverUrl!);
    console.log("✅ Connected.");
    
    const [rows] = await connection.query("SHOW DATABASES");
    console.log("📂 Databases:", rows);
    
    await connection.end();
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

listDbs();
