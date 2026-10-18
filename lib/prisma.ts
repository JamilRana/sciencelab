import "dotenv/config";
import net from "net";
import dns from "dns";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prevent Node 20+ autoSelectFamily from hanging on unreachable IPv6 routes
if (typeof (net as any).setDefaultAutoSelectFamily === "function") {
  (net as any).setDefaultAutoSelectFamily(false);
}
if (typeof (dns as any).setDefaultResultOrder === "function") {
  (dns as any).setDefaultResultOrder("ipv4first");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Ensure libpq compatibility for pg-connection-string to silence SSL alias deprecation warning
  let poolConnectionString = connectionString;
  if (
    poolConnectionString.includes("sslmode=require") &&
    !poolConnectionString.includes("uselibpqcompat=")
  ) {
    const separator = poolConnectionString.includes("?") ? "&" : "?";
    poolConnectionString = `${poolConnectionString}${separator}uselibpqcompat=true`;
  }

  const isSsl = poolConnectionString.includes("neon.tech") || poolConnectionString.includes("sslmode=");
  const pool = new Pool({ 
    connectionString: poolConnectionString,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    ...(isSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
