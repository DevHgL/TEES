-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TRAINER', 'GYM_LEADER', 'ADMIN');

-- AlterTable
ALTER TABLE "trainers" ADD COLUMN     "password_hash" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'TRAINER';

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "trainer_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_trainer_id_idx" ON "refresh_tokens"("trainer_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
