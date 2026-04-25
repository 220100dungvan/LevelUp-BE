/*
  Warnings:

  - You are about to drop the column `group_id` on the `articles` table. All the data in the column will be lost.
  - You are about to drop the column `topic` on the `videos` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[topic_id,level,id]` on the table `articles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `topic_id` to the `articles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "articles" DROP CONSTRAINT "articles_group_id_fkey";

-- DropForeignKey
ALTER TABLE "videos" DROP CONSTRAINT "videos_topic_fkey";

-- DropIndex
DROP INDEX "articles_group_id_level_id_key";

-- AlterTable
ALTER TABLE "articles" DROP COLUMN "group_id",
ADD COLUMN     "topic_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "videos" DROP COLUMN "topic",
ADD COLUMN     "topic_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "articles_topic_id_level_id_key" ON "articles"("topic_id", "level", "id");

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "video_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "article_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
