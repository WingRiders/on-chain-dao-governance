import {ProposalsResponse} from '@wingriders/governance-sdk'
import {chain} from 'lodash'

import {prisma, ProposalStatus as DbProposalStatus} from '../../db/prismaClient'
import {toApiProposalDetails} from './toApiProposalDetails'
import {proposalDetailsPrismaSelect} from '../../db/proposalDetailsPrismaSelect'

/**
 * Fetch all proposals assuming the number of proposals will be very limited,
 * hence there is no need for paging
 */
export const getProposals = async (): Promise<ProposalsResponse> => {
  const proposals = await prisma.proposal.findMany({
    select: proposalDetailsPrismaSelect(false),
    orderBy: {
      slot: 'desc',
    },
  })
  return (
    chain(proposals)
      // filter out cancelled proposals
      .filter((proposal) => proposal.proposalStates[0]?.status !== DbProposalStatus.CANCELLED)
      .map(toApiProposalDetails)
      .value()
  )
}
