/*
  Warnings:

  - Added the required column `updated_at` to the `user_dictation_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user_shadowing_results` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_dictation_results" ADD COLUMN     "updated_at" TIMESTAMP(3) NULL;

-- AlterTable
ALTER TABLE "user_shadowing_results" ADD COLUMN     "updated_at" TIMESTAMP(3) NULL;
