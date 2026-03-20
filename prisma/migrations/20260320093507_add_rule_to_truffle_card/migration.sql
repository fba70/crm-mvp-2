-- AlterTable
ALTER TABLE "truffle_card" ADD COLUMN     "ruleId" TEXT;

-- AddForeignKey
ALTER TABLE "truffle_card" ADD CONSTRAINT "truffle_card_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
