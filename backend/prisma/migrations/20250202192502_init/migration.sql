/*
  Warnings:

  - You are about to drop the column `securityAnswer` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `securityQuestionId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_securityQuestionId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "securityAnswer",
DROP COLUMN "securityQuestionId";

-- CreateTable
CREATE TABLE "UserSecurityQuestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "securityQuestionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "UserSecurityQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSecurityQuestion_id_key" ON "UserSecurityQuestion"("id");

-- CreateIndex
CREATE UNIQUE INDEX "UserSecurityQuestion_userId_securityQuestionId_key" ON "UserSecurityQuestion"("userId", "securityQuestionId");

-- AddForeignKey
ALTER TABLE "UserSecurityQuestion" ADD CONSTRAINT "UserSecurityQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSecurityQuestion" ADD CONSTRAINT "UserSecurityQuestion_securityQuestionId_fkey" FOREIGN KEY ("securityQuestionId") REFERENCES "SecurityQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
