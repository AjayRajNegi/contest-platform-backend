/*
  Warnings:

  - A unique constraint covering the columns `[user_id,problem_id]` on the table `dsa_submission` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "dsa_submission_user_id_problem_id_key" ON "dsa_submission"("user_id", "problem_id");
