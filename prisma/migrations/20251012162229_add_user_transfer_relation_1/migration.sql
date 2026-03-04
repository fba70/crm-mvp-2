-- CreateEnum
CREATE TYPE "public"."TransferStatus" AS ENUM ('ACCEPTED', 'REJECTED', 'UNDEFINED');

-- AlterTable
ALTER TABLE "public"."task" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "transferStatus" "public"."TransferStatus" NOT NULL DEFAULT 'UNDEFINED',
ADD COLUMN     "transferToId" TEXT,
ADD COLUMN     "transferToReason" TEXT;

-- AddForeignKey
ALTER TABLE "public"."task" ADD CONSTRAINT "task_transferToId_fkey" FOREIGN KEY ("transferToId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
