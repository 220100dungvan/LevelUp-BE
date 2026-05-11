-- CreateTable
CREATE TABLE "article_quiz_attempts" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "article_quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_quiz_answer_logs" (
    "id" SERIAL NOT NULL,
    "attempt_id" INTEGER NOT NULL,
    "question_id" UUID NOT NULL,
    "selected_option_id" UUID,
    "is_correct" BOOLEAN NOT NULL,

    CONSTRAINT "article_quiz_answer_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_quiz_attempts_user_id_article_id_idx" ON "article_quiz_attempts"("user_id", "article_id");

-- CreateIndex
CREATE UNIQUE INDEX "article_quiz_answer_logs_attempt_id_question_id_key" ON "article_quiz_answer_logs"("attempt_id", "question_id");

-- AddForeignKey
ALTER TABLE "article_quiz_attempts" ADD CONSTRAINT "article_quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_quiz_attempts" ADD CONSTRAINT "article_quiz_attempts_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_quiz_answer_logs" ADD CONSTRAINT "article_quiz_answer_logs_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "article_quiz_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_quiz_answer_logs" ADD CONSTRAINT "article_quiz_answer_logs_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "article_quiz_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_quiz_answer_logs" ADD CONSTRAINT "article_quiz_answer_logs_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "article_quiz_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
