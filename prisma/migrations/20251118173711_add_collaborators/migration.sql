-- CreateTable
CREATE TABLE "public"."_TaskCollaborators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TaskCollaborators_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TaskCollaborators_B_index" ON "public"."_TaskCollaborators"("B");

-- AddForeignKey
ALTER TABLE "public"."_TaskCollaborators" ADD CONSTRAINT "_TaskCollaborators_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_TaskCollaborators" ADD CONSTRAINT "_TaskCollaborators_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
