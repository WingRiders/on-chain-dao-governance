export const proposalDetailsPrismaSelect = (withVotes: boolean) =>
  ({
    txHash: true,
    outputIndex: true,
    ownerAddress: true,
    name: true,
    description: true,
    uri: true,
    communityUri: true,
    poll: {
      select: {
        txHash: true,
        start: true,
        end: true,
        snapshot: true,
        description: true,
      },
    },
    slot: true,
    proposalStates: {
      select: {
        status: true,
      },
      orderBy: {
        slot: 'desc',
      },
    },
    proposalChoices: {
      select: {
        value: true,
        type: true,
        ...(withVotes ? {votes: true} : {}),
      },
      orderBy: {
        index: 'asc',
      },
    },
    requestedAmount: true,
    ...(withVotes ? {votes: true} : {}),
  }) as const
