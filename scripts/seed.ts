import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  // Create schools
  const school1 = await prisma.school.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "Science Lab Science Lab Coaching Center" },
  });

  // Create batches
  const batches = await Promise.all([
    prisma.batch.upsert({ where: { id: 1 }, update: {}, create: { classId: "Six", name: "6A", code: 61 } }),
    prisma.batch.upsert({ where: { id: 2 }, update: {}, create: { classId: "Seven", name: "7A", code: 71 } }),
    prisma.batch.upsert({ where: { id: 3 }, update: {}, create: { classId: "Eight", name: "8A", code: 81 } }),
    prisma.batch.upsert({ where: { id: 4 }, update: {}, create: { classId: "Nine", name: "9A", code: 91 } }),
    prisma.batch.upsert({ where: { id: 5 }, update: {}, create: { classId: "Ten", name: "10A", code: 101 } }),
  ]);

  // Create admin user
  const hashedPassword = await bcrypt.hash("Dghs@123", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: { password: hashedPassword },
    create: {
      username: "admin",
      password: hashedPassword,
      role: "ADMIN",
      active: true,
    },
  });

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
