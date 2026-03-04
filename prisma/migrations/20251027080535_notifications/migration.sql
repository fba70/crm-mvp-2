-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('GENERAL', 'TRANSFER', 'FEED');

-- CreateTable
CREATE TABLE "public"."notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT,
    "senderId" TEXT,
    "message" TEXT,
    "type" "public"."NotificationType" NOT NULL DEFAULT 'GENERAL',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);
