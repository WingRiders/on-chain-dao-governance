-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('AVAILABLE', 'CANCELLED', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProposalChoiceType" AS ENUM ('ACCEPT', 'REJECT');

-- CreateTable
CREATE TABLE "Poll" (
    "id" BIGSERIAL NOT NULL,
    "slot" BIGINT NOT NULL,
    "txHash" BYTEA NOT NULL,
    "start" TIMESTAMPTZ(6) NOT NULL,
    "end" TIMESTAMPTZ(6) NOT NULL,
    "snapshot" TIMESTAMPTZ(6) NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" BIGSERIAL NOT NULL,
    "ownerAddress" TEXT NOT NULL,
    "ownerPubKeyHash" BYTEA NOT NULL,
    "ownerStakeKeyHash" BYTEA,
    "txHash" BYTEA NOT NULL,
    "outputIndex" BIGINT NOT NULL,
    "slot" BIGINT NOT NULL,
    "pollId" BIGINT NOT NULL,
    "uri" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "communityUri" TEXT NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalState" (
    "id" BIGSERIAL NOT NULL,
    "proposalId" BIGINT NOT NULL,
    "slot" BIGINT NOT NULL,
    "txHash" BYTEA NOT NULL,
    "cancelReason" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "ProposalState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalChoice" (
    "id" BIGSERIAL NOT NULL,
    "proposalId" BIGINT NOT NULL,
    "index" INTEGER NOT NULL,
    "type" "ProposalChoiceType" NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ProposalChoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Poll_txHash_key" ON "Poll"("txHash");

-- CreateIndex
CREATE INDEX "Poll_slot_idx" ON "Poll"("slot");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_txHash_key" ON "Proposal"("txHash");

-- CreateIndex
CREATE INDEX "Proposal_slot_idx" ON "Proposal"("slot");

-- CreateIndex
CREATE INDEX "Proposal_pollId_idx" ON "Proposal"("pollId");

-- CreateIndex
CREATE INDEX "ProposalState_proposalId_idx" ON "ProposalState"("proposalId");

-- CreateIndex
CREATE INDEX "ProposalState_slot_idx" ON "ProposalState"("slot");

-- CreateIndex
CREATE INDEX "ProposalChoice_proposalId_idx" ON "ProposalChoice"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalChoice_proposalId_index_key" ON "ProposalChoice"("proposalId", "index");

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_slot_fkey" FOREIGN KEY ("slot") REFERENCES "Block"("slot") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_slot_fkey" FOREIGN KEY ("slot") REFERENCES "Block"("slot") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalState" ADD CONSTRAINT "ProposalState_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalState" ADD CONSTRAINT "ProposalState_slot_fkey" FOREIGN KEY ("slot") REFERENCES "Block"("slot") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalChoice" ADD CONSTRAINT "ProposalChoice_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
