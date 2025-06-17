export type CreateProposalChoice = {
  id: string
  label: string
}

export type CreateProposalForm = {
  name: string
  description: string
  uri: string
  communityUri: string
  acceptChoices: CreateProposalChoice[]
  rejectChoices: CreateProposalChoice[]
  start: Date
  end: Date
  requestedAmount?: string
}
