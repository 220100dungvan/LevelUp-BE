-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "level" "Level" NOT NULL DEFAULT 'BEGINNER';
