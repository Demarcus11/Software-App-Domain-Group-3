/*
  Warnings:

  - You are about to drop the column `description` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `permissions` on the `Role` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Role" DROP COLUMN "description",
DROP COLUMN "permissions";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "roleId" SET DEFAULT 1;
