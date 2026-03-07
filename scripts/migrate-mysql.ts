import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL || "";

async function migrate() {
  const pool = new Pool({ 
    connectionString: connectionString.replace("?sslmode=require", "?sslmode=require&pool_mode=transaction"),
  });

  try {
    // Insert school
    await pool.query(`INSERT INTO schools (name) VALUES ($1) ON CONFLICT DO NOTHING`, ["Science Lab Coaching Center"]);
    console.log("School inserted");

    // Insert batches
    const batchData = [
      ["Six", "6A"], ["Six", "6B"], ["Six", "6C"], ["Six", "6D"],
      ["Seven", "7A"], ["Seven", "7B"], ["Seven", "7C"], ["Seven", "7D"],
      ["Eight", "8A"], ["Eight", "8B"], ["Eight", "8C"], ["Eight", "8D"],
      ["Nine", "9A"], ["Nine", "9B"], ["Nine", "9C"], ["Nine", "9D"],
      ["Ten", "10A"], ["Ten", "10B"], ["Ten", "10C"], ["Ten", "10D"],
    ];
    
    for (const [classId, name] of batchData) {
      await pool.query(`INSERT INTO batches (classid, name) VALUES ($1, $2)`, [classId, name]);
    }
    console.log("Batches inserted");

    // Insert admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await pool.query(`INSERT INTO users (username, password, role, active) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`, 
      ["admin", hashedPassword, "ADMIN", true]);
    console.log("Admin user inserted");

    console.log("Migration completed!");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

migrate();
