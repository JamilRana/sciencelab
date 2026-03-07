import { prisma } from '../lib/prisma'
import "dotenv/config";

async function main() {
  try {
    const userCount = await prisma.user.count()
    console.log('Connection successful, user count:', userCount)
    const admin = await prisma.user.findUnique({ where: { username: 'admin' } })
    console.log('Admin user found:', !!admin)
  } catch (error) {
    console.error('Connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
