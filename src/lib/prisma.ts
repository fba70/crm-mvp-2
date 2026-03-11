import { PrismaClient } from "@/generated/prisma"
import { withAccelerate } from "@prisma/extension-accelerate"

function createPrismaClient() {
  return new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL,
  }).$extends(withAccelerate())
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>

const globalForPrisma = global as unknown as { prisma: ExtendedPrismaClient }

const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
