-- CreateEnum
CREATE TYPE "Funnel" AS ENUM ('Awareness', 'Interest', 'Decision', 'Action', 'Retention');

-- AlterTable
ALTER TABLE "task" ADD COLUMN     "funnel" "Funnel" NOT NULL DEFAULT 'Awareness';
