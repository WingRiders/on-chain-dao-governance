/*
  Warnings:

  - The primary key for the `Block` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Block` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `height` on the `Block` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `slot` on the `Block` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `Poll` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Poll` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `slot` on the `Poll` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `Proposal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Proposal` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `outputIndex` on the `Proposal` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `slot` on the `Proposal` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `pollId` on the `Proposal` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `ProposalChoice` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `ProposalChoice` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `proposalId` on the `ProposalChoice` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `ProposalState` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `ProposalState` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `proposalId` on the `ProposalState` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `slot` on the `ProposalState` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `Vote` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Vote` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `proposalId` on the `Vote` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `choiceId` on the `Vote` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `pollId` on the `Vote` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `slot` on the `Vote` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- DropForeignKey
ALTER TABLE "Poll" DROP CONSTRAINT "Poll_slot_fkey";

-- DropForeignKey
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_pollId_fkey";

-- DropForeignKey
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_slot_fkey";

-- DropForeignKey
ALTER TABLE "ProposalChoice" DROP CONSTRAINT "ProposalChoice_proposalId_fkey";

-- DropForeignKey
ALTER TABLE "ProposalState" DROP CONSTRAINT "ProposalState_proposalId_fkey";

-- DropForeignKey
ALTER TABLE "ProposalState" DROP CONSTRAINT "ProposalState_slot_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_choiceId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_pollId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_proposalId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_slot_fkey";

-- DropIndex
DROP INDEX "Block_slot_idx";

-- AlterTable
ALTER TABLE "Block" DROP CONSTRAINT "Block_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "height" SET DATA TYPE INTEGER,
ALTER COLUMN "slot" SET DATA TYPE INTEGER,
ADD CONSTRAINT "Block_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Poll" DROP CONSTRAINT "Poll_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "slot" SET DATA TYPE INTEGER,
ADD CONSTRAINT "Poll_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "outputIndex" SET DATA TYPE INTEGER,
ALTER COLUMN "slot" SET DATA TYPE INTEGER,
ALTER COLUMN "pollId" SET DATA TYPE INTEGER,
ADD CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ProposalChoice" DROP CONSTRAINT "ProposalChoice_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "proposalId" SET DATA TYPE INTEGER,
ADD CONSTRAINT "ProposalChoice_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ProposalState" DROP CONSTRAINT "ProposalState_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "proposalId" SET DATA TYPE INTEGER,
ALTER COLUMN "slot" SET DATA TYPE INTEGER,
ADD CONSTRAINT "ProposalState_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "proposalId" SET DATA TYPE INTEGER,
ALTER COLUMN "choiceId" SET DATA TYPE INTEGER,
ALTER COLUMN "pollId" SET DATA TYPE INTEGER,
ALTER COLUMN "slot" SET DATA TYPE INTEGER,
ADD CONSTRAINT "Vote_pkey" PRIMARY KEY ("id");

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

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "ProposalChoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_slot_fkey" FOREIGN KEY ("slot") REFERENCES "Block"("slot") ON DELETE CASCADE ON UPDATE CASCADE;
