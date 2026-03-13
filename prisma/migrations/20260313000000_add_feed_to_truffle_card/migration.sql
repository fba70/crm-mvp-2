-- AlterTable
ALTER TABLE "truffle_card" ADD COLUMN "feedId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "truffle_card_feedId_key" ON "truffle_card"("feedId");

-- AddForeignKey
ALTER TABLE "truffle_card" ADD CONSTRAINT "truffle_card_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "feed"("id") ON DELETE SET NULL ON UPDATE CASCADE;
