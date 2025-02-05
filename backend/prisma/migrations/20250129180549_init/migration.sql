/*
  Warnings:

  - The `statusId` column on the `AccessRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Status` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Status` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "AccessRequest" DROP CONSTRAINT "AccessRequest_statusId_fkey";

-- DropIndex
DROP INDEX "Status_id_key";

-- AlterTable
ALTER TABLE "AccessRequest" ALTER COLUMN "dateOfBirth" SET DATA TYPE TEXT,
DROP COLUMN "statusId",
ADD COLUMN     "statusId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Status" DROP CONSTRAINT "Status_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Status_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE CASCADE ON UPDATE CASCADE;
