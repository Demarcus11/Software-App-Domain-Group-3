/*
  Warnings:

  - You are about to drop the column `answer` on the `SecurityQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `SecurityQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `lastLoginAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordExpiresAt` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[question]` on the table `SecurityQuestion` will be added. If there are existing duplicate values, this will fail.
  - Made the column `userId` on table `AccessRequest` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `lastPasswordChangeAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `securityAnswer` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `securityQuestionId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AccessRequest" DROP CONSTRAINT "AccessRequest_userId_fkey";

-- DropForeignKey
ALTER TABLE "SecurityQuestion" DROP CONSTRAINT "SecurityQuestion_userId_fkey";

-- DropIndex
DROP INDEX "SecurityQuestion_userId_key";

-- AlterTable
ALTER TABLE "AccessRequest" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "PasswordHistory" ADD COLUMN     "isExpired" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SecurityQuestion" DROP COLUMN "answer",
DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "lastLoginAt",
DROP COLUMN "passwordExpiresAt",
ADD COLUMN     "lastPasswordChangeAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "securityAnswer" TEXT NOT NULL,
ADD COLUMN     "securityQuestionId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SecurityQuestion_question_key" ON "SecurityQuestion"("question");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_securityQuestionId_fkey" FOREIGN KEY ("securityQuestionId") REFERENCES "SecurityQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
