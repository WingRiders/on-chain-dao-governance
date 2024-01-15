import {sum} from 'lodash'

import {HexString} from '@wingriders/cab/types'
import {ProposalResponse, VoteVerificationState} from '@wingriders/governance-sdk'

import {Vote, prisma} from '../../db/prismaClient'
import {proposalDetailsPrismaSelect} from '../../db/proposalDetailsPrismaSelect'
import {toApiProposalDetails} from './toApiProposalDetails'

const isVerified = (vote: Vote) => vote.verificationState === VoteVerificationState.VERIFIED
const isAbstained = (vote: Vote) => vote.choiceId == null

const votingPower = (vote: Vote) => Number(vote.votingPower)

export const getProposal = async ({txHash}: {txHash: HexString}): Promise<ProposalResponse> => {
  const proposal = await prisma.proposal.findFirstOrThrow({
    where: {
      txHash: Buffer.from(txHash, 'hex'),
    },
    select: proposalDetailsPrismaSelect(true),
    orderBy: {
      slot: 'desc',
    },
  })
  const allVerifiedVotes = proposal.votes.filter(isVerified)
  const totalVotingPower = sum(allVerifiedVotes.map(votingPower))
  const abstainedVotingPower = sum(allVerifiedVotes.filter(isAbstained).map(votingPower))
  const powerPerChoice = Object.fromEntries(
    proposal.proposalChoices.map(({value, votes}) => [
      value,
      sum(votes.filter(isVerified).map(votingPower)),
    ])
  )
  return {
    ...toApiProposalDetails(proposal),
    total: totalVotingPower,
    choices: powerPerChoice,
    abstained: abstainedVotingPower,
  }
}
