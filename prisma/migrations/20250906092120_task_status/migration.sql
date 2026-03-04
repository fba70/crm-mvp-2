-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "public"."task" ADD COLUMN     "status" "public"."TaskStatus" NOT NULL DEFAULT 'OPEN';
