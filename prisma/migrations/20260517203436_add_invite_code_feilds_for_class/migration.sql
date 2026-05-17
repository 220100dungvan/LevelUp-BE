/*
  Warnings:

  - A unique constraint covering the columns `[invite_code]` on the table `classes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `invite_code` to the `classes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "description" TEXT,
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "invite_code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "classes_invite_code_key" ON "classes"("invite_code");
