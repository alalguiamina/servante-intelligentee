-- CreateTable
CREATE TABLE "RFIDAttempt" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "userId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RFIDAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RFIDAttempt_uid_timestamp_idx" ON "RFIDAttempt"("uid", "timestamp");

-- CreateIndex
CREATE INDEX "RFIDAttempt_ipAddress_timestamp_idx" ON "RFIDAttempt"("ipAddress", "timestamp");
