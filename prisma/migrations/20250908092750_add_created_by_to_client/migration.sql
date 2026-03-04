-- AlterTable
ALTER TABLE "public"."client" ADD COLUMN     "createdById" TEXT;

-- AddForeignKey
ALTER TABLE "public"."client" ADD CONSTRAINT "client_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
