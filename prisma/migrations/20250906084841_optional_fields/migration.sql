-- DropForeignKey
ALTER TABLE "public"."task" DROP CONSTRAINT "task_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "public"."task" DROP CONSTRAINT "task_clientId_fkey";

-- AlterTable
ALTER TABLE "public"."client" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."task" ALTER COLUMN "theme" DROP NOT NULL,
ALTER COLUMN "date" DROP NOT NULL,
ALTER COLUMN "priority" DROP NOT NULL,
ALTER COLUMN "contactPhone" DROP NOT NULL,
ALTER COLUMN "contactEmail" DROP NOT NULL,
ALTER COLUMN "contactPerson" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "urlLink" DROP NOT NULL,
ALTER COLUMN "clientId" DROP NOT NULL,
ALTER COLUMN "assignedToId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."task" ADD CONSTRAINT "task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task" ADD CONSTRAINT "task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
