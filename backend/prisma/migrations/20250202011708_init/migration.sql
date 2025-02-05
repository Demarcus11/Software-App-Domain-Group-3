-- CreateTable
CREATE TABLE "error_messages" (
    "id" TEXT NOT NULL,
    "errorCode" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "httpStatusCode" INTEGER NOT NULL,

    CONSTRAINT "error_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "error_messages_id_key" ON "error_messages"("id");

-- CreateIndex
CREATE UNIQUE INDEX "error_messages_errorCode_key" ON "error_messages"("errorCode");
