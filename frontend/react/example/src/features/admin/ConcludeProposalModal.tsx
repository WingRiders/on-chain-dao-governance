import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import {useContext} from 'react'
import {WalletContext} from '../wallet/ConnectWalletContext'
import {useForm} from 'react-hook-form'
import {InputField} from '../../components/InputField'
import {
  BuildConcludeProposalParams,
  ChoiceVoteAggregation,
  GovernanceVotingParams,
} from '@wingriders/governance-sdk'
import {Address, BigNumber, TxInputRef} from '@wingriders/cab/types'
import {useVotingParamsQuery} from '@wingriders/governance-frontend-react-sdk'
import {AssetQuantityDisplay} from '../../components/AssetQuantityDisplay'
import {ActionResult} from '../../helpers/actions'

type ConcludeProposalForm = {
  beneficiary: string
  result: 'PASSED' | 'FAILED'
  note: string
}

type ConcludeProposalModalProps = {
  open: boolean
  onClose: () => void
  proposalTxRef: TxInputRef
  proposalVotes: ChoiceVoteAggregation[]
  proposalChoices: string[]
  onConclude: (params: BuildConcludeProposalParams) => Promise<ActionResult>
  isLoading?: boolean
}

export const ConcludeProposalModal = ({
  open,
  onClose,
  proposalTxRef,
  proposalVotes,
  proposalChoices,
  onConclude,
  isLoading,
}: ConcludeProposalModalProps) => {
  const {ownerAddress} = useContext(WalletContext)

  const {data: votingParams} = useVotingParamsQuery([])

  const {
    handleSubmit,
    control,
    formState: {errors},
  } = useForm<ConcludeProposalForm>({
    defaultValues: {
      result: 'PASSED',
      beneficiary: ownerAddress,
    },
  })

  const abstainedVotes = Number(
    proposalVotes.find((vote) => vote.index == -1)?.votingPower.VERIFIED ?? 0
  )
  const totalVotes = Number(
    proposalVotes.reduce((acc, vote) => acc + Number(vote.votingPower.VERIFIED), 0)
  )

  const handleConcludeProposal = async (data: ConcludeProposalForm) => {
    if (!ownerAddress) return

    await onConclude({
      proposalTxRef,
      beneficiary: data.beneficiary as Address,
      results: {
        result: data.result,
        choices: Object.fromEntries(
          proposalVotes
            .filter((vote) => vote.index != -1)
            .map((vote) => [vote.index, Number(vote.votingPower.VERIFIED)])
        ),
        abstained: abstainedVotes,
        total: totalVotes,
        note: data.note,
      },
    })
    onClose()
  }

  if (!votingParams) return null

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <Typography variant="h5">Conclude proposal</Typography>
        <Stack spacing={2} mt={3} minWidth={500}>
          <InputField
            name="result"
            control={control}
            rules={{required: true}}
            render={({field}) => (
              <ToggleButtonGroup
                {...field}
                onChange={(_e, newValue) => field.onChange(newValue)}
                exclusive
              >
                <ToggleButton value="PASSED">
                  <Typography>Passed</Typography>
                </ToggleButton>
                <ToggleButton value="FAILED">
                  <Typography>Failed</Typography>
                </ToggleButton>
              </ToggleButtonGroup>
            )}
            errors={errors}
          />
          <InputField
            name="beneficiary"
            control={control}
            rules={{required: true}}
            render={({field}) => (
              <TextField {...field} placeholder="addr_test..." label="Beneficiary" size="medium" />
            )}
            errors={errors}
          />
          <InputField
            name="note"
            control={control}
            rules={{required: true}}
            render={({field}) => (
              <TextField {...field} placeholder="concluded by DAO admin" label="Note" size="medium" />
            )}
            errors={errors}
          />

          <Stack>
            <Typography variant="h6">Voting results</Typography>
            <Stack spacing={0.5}>
              {proposalVotes
                .filter(({index}) => index != -1)
                .map((vote) => (
                  <VotingResultsItem
                    key={vote.index}
                    label={proposalChoices[vote.index]}
                    votes={Number(vote.votingPower.VERIFIED)}
                    governanceToken={votingParams.governanceToken}
                  />
                ))}
              <VotingResultsItem
                label="Abstained"
                votes={abstainedVotes}
                governanceToken={votingParams.governanceToken}
              />
              <VotingResultsItem
                label="Total"
                votes={totalVotes}
                governanceToken={votingParams.governanceToken}
              />
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={handleSubmit(handleConcludeProposal)} disabled={isLoading}>
          {isLoading ? 'Concluding...' : 'Conclude proposal'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

type VotingResultsItemProps = {
  label: string
  votes: number
  governanceToken: GovernanceVotingParams['governanceToken']
}

const VotingResultsItem = ({label, votes, governanceToken}: VotingResultsItemProps) => {
  return (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
      <Typography>{label}</Typography>
      <Typography>
        <AssetQuantityDisplay
          token={{...governanceToken.asset, quantity: new BigNumber(votes)}}
          assetMetadata={governanceToken.metadata}
        />
      </Typography>
    </Stack>
  )
}
