/*
  Warnings:

  - You are about to drop the column `audio_url` on the `vocabularies` table. All the data in the column will be lost.
  - You are about to drop the column `phonetic` on the `vocabularies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "vocabularies" DROP COLUMN "audio_url",
DROP COLUMN "phonetic",
ADD COLUMN     "audio_url_uk" TEXT,
ADD COLUMN     "audio_url_us" TEXT,
ADD COLUMN     "phonetic_uk" TEXT,
ADD COLUMN     "phonetic_us" TEXT;
