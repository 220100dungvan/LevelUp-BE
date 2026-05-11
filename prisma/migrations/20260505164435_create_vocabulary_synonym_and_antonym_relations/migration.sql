-- CreateTable
CREATE TABLE "vocabulary_synonyms" (
    "vocabulary_id" UUID NOT NULL,
    "synonym_id" UUID NOT NULL,

    CONSTRAINT "vocabulary_synonyms_pkey" PRIMARY KEY ("vocabulary_id","synonym_id")
);

-- CreateTable
CREATE TABLE "vocabulary_antonyms" (
    "vocabulary_id" UUID NOT NULL,
    "antonym_id" UUID NOT NULL,

    CONSTRAINT "vocabulary_antonyms_pkey" PRIMARY KEY ("vocabulary_id","antonym_id")
);

-- AddForeignKey
ALTER TABLE "vocabularies" ADD CONSTRAINT "vocabularies_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_synonyms" ADD CONSTRAINT "vocabulary_synonyms_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_synonyms" ADD CONSTRAINT "vocabulary_synonyms_synonym_id_fkey" FOREIGN KEY ("synonym_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_antonyms" ADD CONSTRAINT "vocabulary_antonyms_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_antonyms" ADD CONSTRAINT "vocabulary_antonyms_antonym_id_fkey" FOREIGN KEY ("antonym_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
