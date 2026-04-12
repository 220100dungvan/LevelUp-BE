-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('LEARNER', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "VocabStatus" AS ENUM ('NEW', 'EASY', 'MEDIUM', 'HARD', 'MASTERED');

-- CreateEnum
CREATE TYPE "Level" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "SpeakingSessionStatus" AS ENUM ('WAITING', 'MATCHED', 'ENDED');

-- CreateEnum
CREATE TYPE "VerificationCodeType" AS ENUM ('REGISTER', 'FORGOT_PASSWORD', 'LOGIN', 'DISABLE_2FA');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ClassRole" AS ENUM ('STUDENT', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('VIDEO', 'ARTICLE');

-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('DICTATION', 'SHADOWING');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "full_name" TEXT,
    "phone_number" TEXT,
    "avatar_url" TEXT,
    "totp_secret" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'LEARNER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_stats" (
    "user_id" UUID NOT NULL,
    "total_words_learned" INTEGER NOT NULL DEFAULT 0,
    "total_mastered" INTEGER NOT NULL DEFAULT 0,
    "total_need_review" INTEGER NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "learning_streak" INTEGER NOT NULL DEFAULT 0,
    "last_learn_date" DATE,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_learning_daily" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "list_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "words_learned" INTEGER NOT NULL DEFAULT 0,
    "words_reviewed" INTEGER NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "wrong_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_learning_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "user_agent" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_active_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "device_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "VerificationCodeType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_topics" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,

    CONSTRAINT "vocabulary_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_lists" (
    "id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "description" TEXT,
    "created_by" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "level" "Level",
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vocabulary_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabularies" (
    "id" UUID NOT NULL,
    "word" TEXT NOT NULL,
    "phonetic" TEXT,
    "part_of_speech" TEXT,
    "meaning_vi" TEXT NOT NULL,
    "meaning_en" TEXT,
    "example_en" TEXT,
    "example_vi" TEXT,
    "image_url" TEXT,
    "audio_url" TEXT,
    "audio_example_url" TEXT,
    "level" "Level",
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vocabularies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_list_items" (
    "list_id" UUID NOT NULL,
    "vocabulary_id" UUID NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "vocabulary_list_items_pkey" PRIMARY KEY ("list_id","vocabulary_id")
);

-- CreateTable
CREATE TABLE "vocabulary_list_access" (
    "id" SERIAL NOT NULL,
    "list_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "class_id" UUID,
    "granted_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vocabulary_list_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_vocabulary_progress" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "vocabulary_id" UUID NOT NULL,
    "list_id" UUID NOT NULL,
    "status" "VocabStatus" NOT NULL DEFAULT 'NEW',
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "wrong_count" INTEGER NOT NULL DEFAULT 0,
    "last_reviewed_at" TIMESTAMP(3),
    "next_review_at" TIMESTAMP(3),

    CONSTRAINT "user_vocabulary_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" UUID NOT NULL,
    "topic" TEXT,
    "level" "Level",
    "title" TEXT NOT NULL,
    "video_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "duration_sec" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_sentences" (
    "id" SERIAL NOT NULL,
    "video_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "meaning_vi" TEXT,
    "ipa" TEXT,
    "start_time" DOUBLE PRECISION NOT NULL,
    "end_time" DOUBLE PRECISION NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "video_sentences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_learning_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "video_id" UUID NOT NULL,
    "mode" "SessionMode" NOT NULL,
    "wrong_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "user_learning_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_dictation_results" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "sentence_id" INTEGER NOT NULL,
    "user_text" TEXT,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "wrong_count" INTEGER NOT NULL DEFAULT 0,
    "is_revealed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_dictation_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_shadowing_results" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "sentence_id" INTEGER NOT NULL,
    "audio_url" TEXT,
    "score" DOUBLE PRECISION,
    "feedback_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_shadowing_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_groups" (
    "id" UUID NOT NULL,
    "topic" TEXT,
    "thumbnail_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "article_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "level" "Level" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "audio_url" TEXT,
    "reading_time_min" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_vocabularies" (
    "vocabulary_id" UUID NOT NULL,
    "media_id" UUID NOT NULL,
    "media_type" "MediaType" NOT NULL,

    CONSTRAINT "media_vocabularies_pkey" PRIMARY KEY ("vocabulary_id","media_id")
);

-- CreateTable
CREATE TABLE "user_article_progress" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "progress_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "last_read_at" TIMESTAMP(3),

    CONSTRAINT "user_article_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speaking_topics" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "speaking_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speaking_sessions" (
    "id" UUID NOT NULL,
    "room_name" TEXT NOT NULL,
    "host_id" UUID NOT NULL,
    "level" "Level" NOT NULL,
    "max_members" INTEGER NOT NULL DEFAULT 2,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "passcode" TEXT,
    "status" "SpeakingSessionStatus" NOT NULL DEFAULT 'WAITING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "speaking_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speaking_session_topics" (
    "session_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,

    CONSTRAINT "speaking_session_topics_pkey" PRIMARY KEY ("session_id","topic_id")
);

-- CreateTable
CREATE TABLE "speaking_participants" (
    "id" SERIAL NOT NULL,
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_online" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "speaking_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "teacher_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_members" (
    "id" SERIAL NOT NULL,
    "class_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "ClassRole" NOT NULL DEFAULT 'STUDENT',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_vocabulary_lists" (
    "class_id" UUID NOT NULL,
    "list_id" UUID NOT NULL,

    CONSTRAINT "class_vocabulary_lists_pkey" PRIMARY KEY ("class_id","list_id")
);

-- CreateTable
CREATE TABLE "user_list_progress" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "list_id" UUID NOT NULL,
    "progress_pct" DOUBLE PRECISION NOT NULL,
    "completed" BOOLEAN NOT NULL,
    "last_learned_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_list_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_learning_daily_user_id_list_id_date_key" ON "user_learning_daily"("user_id", "list_id", "date");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "verification_codes_email_code_type_idx" ON "verification_codes"("email", "code", "type");

-- CreateIndex
CREATE INDEX "verification_codes_expiresAt_idx" ON "verification_codes"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "vocabularies_word_part_of_speech_key" ON "vocabularies"("word", "part_of_speech");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_list_access_list_id_user_id_key" ON "vocabulary_list_access"("list_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_list_access_list_id_class_id_key" ON "vocabulary_list_access"("list_id", "class_id");

-- CreateIndex
CREATE INDEX "user_vocabulary_progress_user_id_next_review_at_idx" ON "user_vocabulary_progress"("user_id", "next_review_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_vocabulary_progress_user_id_vocabulary_id_list_id_key" ON "user_vocabulary_progress"("user_id", "vocabulary_id", "list_id");

-- CreateIndex
CREATE INDEX "video_sentences_video_id_order_index_idx" ON "video_sentences"("video_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "user_dictation_results_session_id_sentence_id_key" ON "user_dictation_results"("session_id", "sentence_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_shadowing_results_session_id_sentence_id_key" ON "user_shadowing_results"("session_id", "sentence_id");

-- CreateIndex
CREATE UNIQUE INDEX "articles_group_id_level_id_key" ON "articles"("group_id", "level", "id");

-- CreateIndex
CREATE INDEX "media_vocabularies_media_id_media_type_idx" ON "media_vocabularies"("media_id", "media_type");

-- CreateIndex
CREATE UNIQUE INDEX "user_article_progress_user_id_article_id_key" ON "user_article_progress"("user_id", "article_id");

-- CreateIndex
CREATE UNIQUE INDEX "speaking_topics_name_key" ON "speaking_topics"("name");

-- CreateIndex
CREATE UNIQUE INDEX "speaking_participants_session_id_user_id_key" ON "speaking_participants"("session_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_members_class_id_user_id_key" ON "class_members"("class_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_list_progress_user_id_list_id_key" ON "user_list_progress"("user_id", "list_id");

-- AddForeignKey
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_learning_daily" ADD CONSTRAINT "user_learning_daily_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_learning_daily" ADD CONSTRAINT "user_learning_daily_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "vocabulary_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_lists" ADD CONSTRAINT "vocabulary_lists_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "vocabulary_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_lists" ADD CONSTRAINT "vocabulary_lists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabularies" ADD CONSTRAINT "vocabularies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_list_items" ADD CONSTRAINT "vocabulary_list_items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "vocabulary_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_list_items" ADD CONSTRAINT "vocabulary_list_items_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_list_access" ADD CONSTRAINT "vocabulary_list_access_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "vocabulary_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_list_access" ADD CONSTRAINT "vocabulary_list_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_list_access" ADD CONSTRAINT "vocabulary_list_access_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_list_access" ADD CONSTRAINT "vocabulary_list_access_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocabulary_progress" ADD CONSTRAINT "user_vocabulary_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocabulary_progress" ADD CONSTRAINT "user_vocabulary_progress_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocabulary_progress" ADD CONSTRAINT "user_vocabulary_progress_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "vocabulary_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_sentences" ADD CONSTRAINT "video_sentences_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_learning_sessions" ADD CONSTRAINT "user_learning_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_learning_sessions" ADD CONSTRAINT "user_learning_sessions_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dictation_results" ADD CONSTRAINT "user_dictation_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "user_learning_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dictation_results" ADD CONSTRAINT "user_dictation_results_sentence_id_fkey" FOREIGN KEY ("sentence_id") REFERENCES "video_sentences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_shadowing_results" ADD CONSTRAINT "user_shadowing_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "user_learning_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_shadowing_results" ADD CONSTRAINT "user_shadowing_results_sentence_id_fkey" FOREIGN KEY ("sentence_id") REFERENCES "video_sentences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "article_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_vocabularies" ADD CONSTRAINT "media_vocabularies_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_article_progress" ADD CONSTRAINT "user_article_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_article_progress" ADD CONSTRAINT "user_article_progress_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_sessions" ADD CONSTRAINT "speaking_sessions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_session_topics" ADD CONSTRAINT "speaking_session_topics_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "speaking_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_session_topics" ADD CONSTRAINT "speaking_session_topics_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "speaking_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_participants" ADD CONSTRAINT "speaking_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "speaking_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_participants" ADD CONSTRAINT "speaking_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_members" ADD CONSTRAINT "class_members_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_members" ADD CONSTRAINT "class_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_vocabulary_lists" ADD CONSTRAINT "class_vocabulary_lists_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_vocabulary_lists" ADD CONSTRAINT "class_vocabulary_lists_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "vocabulary_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_list_progress" ADD CONSTRAINT "user_list_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_list_progress" ADD CONSTRAINT "user_list_progress_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "vocabulary_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
