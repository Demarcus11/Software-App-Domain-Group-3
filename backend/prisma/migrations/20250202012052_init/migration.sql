/*
  Warnings:

  - You are about to drop the `error_messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "error_messages";

-- CreateTable
CREATE TABLE "ErrorMessage" (
    "id" TEXT NOT NULL,
    "errorCode" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "httpStatusCode" INTEGER NOT NULL,

    CONSTRAINT "ErrorMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ErrorMessage_id_key" ON "ErrorMessage"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ErrorMessage_errorCode_key" ON "ErrorMessage"("errorCode");
