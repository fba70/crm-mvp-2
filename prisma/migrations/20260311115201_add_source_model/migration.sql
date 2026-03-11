-- CreateTable
CREATE TABLE "source" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "oldestTs" TEXT,
    "newestTs" TEXT,
    "messages" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "source" ADD CONSTRAINT "source_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
