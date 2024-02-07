import {Card, CardContent, PaletteColor, Stack, Theme, Typography, alpha} from '@mui/material'

import {useVotesQuery} from '@wingriders/governance-frontend-react-sdk'
import {ProposalDetails} from '@wingriders/governance-sdk'

type ProposalProps = {
  proposal: ProposalDetails
}

export const Proposal = ({proposal}: ProposalProps) => {
  const {data: votesData} = useVotesQuery({
    proposalTxHashes: [proposal.txHash],
  })
  const proposalVotes = votesData?.[proposal.txHash]
  const choices = [...proposal.acceptChoices, ...proposal.rejectChoices]

  return (
    <Card sx={({palette}) => ({bgcolor: palette.grey[100]})}>
      <CardContent>
        <Typography sx={{fontSize: 14}} color="text.secondary" gutterBottom>
          {new Date(proposal.poll.start).toLocaleString()} -{' '}
          {new Date(proposal.poll.end).toLocaleString()}
        </Typography>
        <Typography variant="h5" component="div">
          {proposal.name}
        </Typography>
        <Typography variant="body2">{proposal.description}</Typography>

        <Stack spacing={1} mt={1}>
          {choices.map((choice, index) => (
            <ProposalChoice
              key={index}
              label={choice}
              type={index < proposal.acceptChoices.length ? 'accept' : 'reject'}
              votingPower={
                proposalVotes?.byChoice.find((a) => a.index === index)?.votingPower.VERIFIED ?? '-'
              }
            />
          ))}
          <ProposalChoice
            label="Abstain"
            type="abstain"
            votingPower={
              proposalVotes?.byChoice.find((a) => a.index === -1)?.votingPower.VERIFIED ?? '-'
            }
          />
        </Stack>
      </CardContent>
    </Card>
  )
}

type ProposalChoiceProps = {
  label: string
  type: 'accept' | 'reject' | 'abstain'
  votingPower: string
}

const ProposalChoice = ({label, type, votingPower}: ProposalChoiceProps) => {
  const getColor = (fn: (color: PaletteColor) => string) => (theme: Theme) => {
    return fn(
      {
        accept: theme.palette.success,
        reject: theme.palette.error,
        abstain: theme.palette.info,
      }[type]
    )
  }
  return (
    <Stack
      bgcolor={getColor((c) => alpha(c.light, 0.8))}
      p={1}
      direction="row"
      alignItems="center"
      justifyContent="space-between"
    >
      <Typography variant="body1">{label}</Typography>
      <Typography variant="body1">{votingPower}</Typography>
    </Stack>
  )
}
