-- CreateEnum
CREATE TYPE "VerificationState" AS ENUM ('UNVERIFIED', 'VERIFIED', 'INVALID');

-- CreateTable
CREATE TABLE "Vote" (
    "id" BIGSERIAL NOT NULL,
    "ownerAddress" TEXT NOT NULL,
    "ownerPubKeyHash" BYTEA NOT NULL,
    "ownerStakeKeyHash" BYTEA NOT NULL,
    "proposalId" BIGINT NOT NULL,
    "choiceId" BIGINT,
    "pollId" BIGINT NOT NULL,
    "votingPower" BIGINT NOT NULL,
    "votingUTxOs" TEXT[],
    "verificationState" "VerificationState" NOT NULL DEFAULT 'UNVERIFIED',
    "slot" BIGINT NOT NULL,
    "txHash" BYTEA NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vote_ownerStakeKeyHash_proposalId_pollId_idx" ON "Vote"("ownerStakeKeyHash", "proposalId", "pollId");

-- CreateIndex
CREATE INDEX "Vote_proposalId_idx" ON "Vote"("proposalId");

-- CreateIndex
CREATE INDEX "Vote_choiceId_idx" ON "Vote"("choiceId");

-- CreateIndex
CREATE INDEX "Vote_slot_idx" ON "Vote"("slot");

-- CreateIndex
CREATE INDEX "Vote_pollId_idx" ON "Vote"("pollId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_txHash_proposalId_key" ON "Vote"("txHash", "proposalId");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "ProposalChoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_slot_fkey" FOREIGN KEY ("slot") REFERENCES "Block"("slot") ON DELETE CASCADE ON UPDATE CASCADE;
