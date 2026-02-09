/*
  Warnings:

  - A unique constraint covering the columns `[creator_id,title]` on the table `contests` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "contests" DROP CONSTRAINT "contests_creator_id_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "contests_creator_id_title_key" ON "contests"("creator_id", "title");

-- AddForeignKey
ALTER TABLE "contests" ADD CONSTRAINT "contests_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
