-- AlterTable
ALTER TABLE "public"."task" ADD COLUMN     "contactId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."task" ADD CONSTRAINT "task_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
