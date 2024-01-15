import {chain} from 'lodash'

import {ProposalsResponse} from '@wingriders/governance-sdk'

import {ProposalStatus as DbProposalStatus, prisma} from '../../db/prismaClient'
import {proposalDetailsPrismaSelect} from '../../db/proposalDetailsPrismaSelect'
import {toApiProposalDetails} from './toApiProposalDetails'

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
