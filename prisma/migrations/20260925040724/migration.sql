/*
  Warnings:

  - A unique constraint covering the columns `[assessmentId,order]` on the table `assessment_problems` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "assessment_problems_assessmentId_order_key" ON "assessment_problems"("assessmentId", "order");
