/*
  Warnings:

  - The values [VERIFY_SETUP_2FA] on the enum `VerificationCodeType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VerificationCodeType_new" AS ENUM ('REGISTER', 'FORGOT_PASSWORD', 'LOGIN', 'DISABLE_2FA');
ALTER TABLE "verification_codes" ALTER COLUMN "type" TYPE "VerificationCodeType_new" USING ("type"::text::"VerificationCodeType_new");
ALTER TYPE "VerificationCodeType" RENAME TO "VerificationCodeType_old";
ALTER TYPE "VerificationCodeType_new" RENAME TO "VerificationCodeType";
DROP TYPE "public"."VerificationCodeType_old";
COMMIT;
