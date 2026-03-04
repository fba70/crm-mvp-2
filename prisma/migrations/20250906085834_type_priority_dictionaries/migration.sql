/*
  Warnings:

  - Changed the type of `type` on the `task` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `priority` to the `task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."TaskType" AS ENUM ('CALL', 'MEET', 'EMAIL', 'OFFER', 'PRESENTATION');

-- CreateEnum
CREATE TYPE "public"."TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "public"."task" DROP COLUMN "type",
ADD COLUMN     "type" "public"."TaskType" NOT NULL,
DROP COLUMN "priority",
ADD COLUMN     "priority" "public"."TaskPriority" NOT NULL;
