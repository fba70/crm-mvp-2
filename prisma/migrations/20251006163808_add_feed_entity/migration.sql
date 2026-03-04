-- CreateEnum
CREATE TYPE "public"."FeedType" AS ENUM ('RECOMMENDATION', 'CLIENT_ACTIVITY', 'INDUSTRY_INFO', 'COLLEAGUES_UPDATE');

-- CreateEnum
CREATE TYPE "public"."FeedStatus" AS ENUM ('NEW', 'CANCELLED', 'IN_PROGRESS', 'ACTION_COMPLETED', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."feed" (
    "id" TEXT NOT NULL,
    "type" "public"."FeedType" NOT NULL,
    "status" "public"."FeedStatus" NOT NULL DEFAULT 'NEW',
    "actionCall" BOOLEAN DEFAULT false,
    "actionEmail" BOOLEAN DEFAULT false,
    "actionBooking" BOOLEAN DEFAULT false,
    "actionTask" BOOLEAN DEFAULT false,
    "metadata" TEXT,
    "clientId" TEXT,
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feed_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."feed" ADD CONSTRAINT "feed_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feed" ADD CONSTRAINT "feed_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
