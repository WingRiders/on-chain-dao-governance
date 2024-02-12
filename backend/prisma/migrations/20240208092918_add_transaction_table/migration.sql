-- we are adding new table "Transaction" so we need to reset the db
TRUNCATE TABLE "Block" RESTART IDENTITY CASCADE;

-- CreateTable
CREATE TABLE "Transaction" (
    "id" BIGSERIAL NOT NULL,
    "txHash" BYTEA NOT NULL,
    "txFee" BIGINT NOT NULL,
    "slot" INTEGER NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_txHash_key" ON "Transaction"("txHash");

-- CreateIndex
CREATE INDEX "Transaction_slot_idx" ON "Transaction"("slot");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_slot_fkey" FOREIGN KEY ("slot") REFERENCES "Block"("slot") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalState" ADD CONSTRAINT "ProposalState_txHash_fkey" FOREIGN KEY ("txHash") REFERENCES "Transaction"("txHash") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_txHash_fkey" FOREIGN KEY ("txHash") REFERENCES "Transaction"("txHash") ON DELETE CASCADE ON UPDATE CASCADE;
