import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const userCount = await prisma.user.count();
  console.log("Total Users:", userCount);
  
  const adminUser = await prisma.user.findUnique({
    where: { username: "admin" }
  });
  
  if (adminUser) {
    console.log("Admin user found:", {
      username: adminUser.username,
      active: adminUser.active,
      role: adminUser.role,
      password: adminUser.password
    });
  } else {
    console.log("Admin user NOT FOUND");
  }
}

main().catch(console.error);
