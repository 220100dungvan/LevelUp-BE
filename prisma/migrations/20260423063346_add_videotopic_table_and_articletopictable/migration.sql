/*
  Warnings:

  - You are about to drop the `article_groups` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "articles" DROP CONSTRAINT "articles_group_id_fkey";

-- DropTable
DROP TABLE "article_groups";

-- CreateTable
CREATE TABLE "video_topics" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "video_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_topics" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "article_topics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_topics_name_key" ON "video_topics"("name");

-- CreateIndex
CREATE UNIQUE INDEX "article_topics_name_key" ON "article_topics"("name");

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_topic_fkey" FOREIGN KEY ("topic") REFERENCES "video_topics"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "article_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
