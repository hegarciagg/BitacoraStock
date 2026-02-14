
import mysql from "mysql2/promise";
import "dotenv/config";

const passwords = [
  "",           // Empty password
  "root",       // Username as password
  "password",   // "password"
  "admin",      // "admin"
  "1234",       // Simple sequence
  "12345",
  "123456",
  "12345678",
  "mysql",      // Service name
  "db_password" // Common placeholder
];

async function tryConnect() {
  console.log("🔐 Attempting to connect with common passwords...");

  for (const pass of passwords) {
    // Try connecting without a specific database to check credentials first
    const url = `mysql://root:${pass}@localhost:3306`; 
    
    try {
      console.log(`Trying password: '${pass}' ...`);
      const connection = await mysql.createConnection(url);
      console.log(`\n🎉 SUCCESS! The password is: '${pass}'`);
      await connection.end();
      return;
    } catch (error: any) {
      if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        // Wrong password, continue
      } else {
        console.error(`❌ Unexpected error with password '${pass}':`, error.message);
        // If it's not access denied, it might actually be a success for AUTH, but failure for something else.
        if (error.code === 'ER_BAD_DB_ERROR') {
             console.log(`\n🎉 SUCCESS! The password is: '${pass}' (but DB is missing)`);
             return;
        }
      }
    }
  }

  console.log("\n❌ Exhausted common passwords. None worked.");
}

tryConnect();
