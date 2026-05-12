/*
  Warnings:

  - A unique constraint covering the columns `[word,part_of_speech,meaning_vi]` on the table `vocabularies` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "vocabularies_word_part_of_speech_key";

-- CreateIndex
CREATE UNIQUE INDEX "vocabularies_word_part_of_speech_meaning_vi_key" ON "vocabularies"("word", "part_of_speech", "meaning_vi");
