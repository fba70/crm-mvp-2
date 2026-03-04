-- AlterTable
ALTER TABLE "public"."task" ADD COLUMN     "parentTaskId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."task" ADD CONSTRAINT "task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "public"."task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
