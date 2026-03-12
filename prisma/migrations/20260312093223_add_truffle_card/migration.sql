-- CreateEnum
CREATE TYPE "TruffleCardPriority" AS ENUM ('HIGH', 'NORMAL');

-- CreateEnum
CREATE TYPE "TruffleCardStatus" AS ENUM ('OPEN');

-- CreateTable
CREATE TABLE "truffle_card" (
    "id" TEXT NOT NULL,
    "status" "TruffleCardStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TruffleCardPriority" NOT NULL,
    "category" "FeedType" NOT NULL,
    "message" JSONB NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "truffle_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ClientToTruffleCard" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClientToTruffleCard_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SourceToTruffleCard" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SourceToTruffleCard_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ClientToTruffleCard_B_index" ON "_ClientToTruffleCard"("B");

-- CreateIndex
CREATE INDEX "_SourceToTruffleCard_B_index" ON "_SourceToTruffleCard"("B");

-- AddForeignKey
ALTER TABLE "truffle_card" ADD CONSTRAINT "truffle_card_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientToTruffleCard" ADD CONSTRAINT "_ClientToTruffleCard_A_fkey" FOREIGN KEY ("A") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientToTruffleCard" ADD CONSTRAINT "_ClientToTruffleCard_B_fkey" FOREIGN KEY ("B") REFERENCES "truffle_card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SourceToTruffleCard" ADD CONSTRAINT "_SourceToTruffleCard_A_fkey" FOREIGN KEY ("A") REFERENCES "source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SourceToTruffleCard" ADD CONSTRAINT "_SourceToTruffleCard_B_fkey" FOREIGN KEY ("B") REFERENCES "truffle_card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
