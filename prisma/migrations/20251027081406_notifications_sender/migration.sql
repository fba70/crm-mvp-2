-- AddForeignKey
ALTER TABLE "public"."notification" ADD CONSTRAINT "notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
