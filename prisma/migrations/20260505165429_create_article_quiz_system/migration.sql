-- CreateTable
CREATE TABLE "article_quiz_questions" (
    "id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_text_vi" TEXT,
    "types" "QuizQuestionType"[],
    "evidence_text" TEXT,
    "evidence_text_vi" TEXT,
    "explanation" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_quiz_options" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "text_vi" TEXT,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "article_quiz_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_quiz_questions_article_id_order_index_idx" ON "article_quiz_questions"("article_id", "order_index");

-- AddForeignKey
ALTER TABLE "article_quiz_questions" ADD CONSTRAINT "article_quiz_questions_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_quiz_options" ADD CONSTRAINT "article_quiz_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "article_quiz_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
