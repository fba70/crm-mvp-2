-- AlterTable
ALTER TABLE "public"."Contact" ADD COLUMN     "createdById" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
