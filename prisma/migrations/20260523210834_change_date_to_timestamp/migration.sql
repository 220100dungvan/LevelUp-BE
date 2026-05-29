-- AlterTable
ALTER TABLE "user_learning_daily" ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_stats" ALTER COLUMN "last_learn_date" SET DATA TYPE TIMESTAMP(3);
