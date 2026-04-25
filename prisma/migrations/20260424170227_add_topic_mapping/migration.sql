/*
  Warnings:

  - You are about to drop the column `topic_id` on the `articles` table. All the data in the column will be lost.
  - You are about to drop the column `topic_id` on the `videos` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[level,id]` on the table `articles` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "articles" DROP CONSTRAINT "articles_topic_id_fkey";

-- DropForeignKey
ALTER TABLE "videos" DROP CONSTRAINT "videos_topic_id_fkey";

-- DropIndex
DROP INDEX "articles_topic_id_level_id_key";

-- AlterTable
ALTER TABLE "articles" DROP COLUMN "topic_id";

-- AlterTable
ALTER TABLE "videos" DROP COLUMN "topic_id";

-- CreateTable
CREATE TABLE "video_topic_mappings" (
    "video_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,

    CONSTRAINT "video_topic_mappings_pkey" PRIMARY KEY ("video_id","topic_id")
);

-- CreateTable
CREATE TABLE "article_topic_mappings" (
    "article_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,

    CONSTRAINT "article_topic_mappings_pkey" PRIMARY KEY ("article_id","topic_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_level_id_key" ON "articles"("level", "id");

-- AddForeignKey
ALTER TABLE "video_topic_mappings" ADD CONSTRAINT "video_topic_mappings_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_topic_mappings" ADD CONSTRAINT "video_topic_mappings_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "video_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_topic_mappings" ADD CONSTRAINT "article_topic_mappings_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_topic_mappings" ADD CONSTRAINT "article_topic_mappings_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "article_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
