import {
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  Grid,
  Palette,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material'
import {
  useTheoreticalMaxVotingPowerQuery,
  useUserVotesQuery,
  useUserVotingDistributionQuery,
  useVotesQuery,
  useVotingParamsQuery,
} from '@wingriders/governance-frontend-react-sdk'
import {
  GovernanceVotingParams,
  ProposalDetails,
  ProposalStatus,
  UserVotesResponse,
  VotesByState,
} from '@wingriders/governance-sdk'
import {useContext, useState} from 'react'
import {WalletContext} from '../wallet/ConnectWalletContext'
import {VoteVerificationStateIcon} from '../../components/VoteVerificationStateIcon'
import {ipfsToHttps} from '../../helpers/ipfs'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import {BigNumber, TxInputRef} from '@wingriders/cab/types'
import {getExplorerAddressUrl} from '../../helpers/explorer'
import {useTime} from '../../helpers/time'
import {utxoIdToApiTxInput} from '../../helpers/utxo'
import {useCancelProposal, useCastVote, useConcludeProposal} from '../../helpers/actions'
import {useIsAdmin} from '../../helpers/isAdmin'
import {CancelProposalModal} from '../admin/CancelProposalModal'
import {ActionResultDisplay} from '../../components/ActionResultDisplay'
import {ConcludeProposalModal} from '../admin/ConcludeProposalModal'
import {AssetQuantityDisplay} from '../../components/AssetQuantityDisplay'
import {dateToSlot} from '../../common'

type ProposalProps = {
  proposal: ProposalDetails
}

export const Proposal = ({proposal}: ProposalProps) => {
  const time = useTime(10_000)
  const {ownerStakeKeyHash} = useContext(WalletContext)
  const isAdmin = useIsAdmin()

  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null)
  const [cancellingProposalTxRef, setCancellingProposalTxRef] = useState<TxInputRef | null>(null)
  const [concludingProposalTxRef, setConcludingProposalTxRef] = useState<TxInputRef | null>(null)

  const {data: votingParams} = useVotingParamsQuery([])
  const {data: votesData} = useVotesQuery([{proposalTxHashes: [proposal.txHash]}])
  const proposalVotes = votesData?.[proposal.txHash]
  const choices = [...proposal.acceptChoices, ...proposal.rejectChoices]

  const {data: userVotesData} = useUserVotesQuery(
    ownerStakeKeyHash ? [{ownerStakeKeyHash, proposalTxHashes: [proposal.txHash]}] : undefined
  )
  const proposalUserVotes = userVotesData?.[proposal.txHash]

  const {data: userVotingDistributionData} = useUserVotingDistributionQuery(
    ownerStakeKeyHash ? [{ownerStakeKeyHash, slot: dateToSlot(proposal.poll.snapshot)}] : undefined
  )
  const userVotingPower = userVotingDistributionData
    ? new BigNumber(userVotingDistributionData.walletTokens.votingPower)
    : undefined
  const hasUserVotingPower = userVotingPower?.gt(0)

  const {data: theoreticalMaxVotingPower} = useTheoreticalMaxVotingPowerQuery([])

  const votingParticipation =
    proposalVotes && theoreticalMaxVotingPower
      ? new BigNumber(proposalVotes.votingPower.VERIFIED).div(theoreticalMaxVotingPower).decimalPlaces(5)
      : undefined

  const isActive = time >= proposal.poll.start && time <= proposal.poll.end
  const isFinished = time > proposal.poll.end
  const canBeConcluded = isFinished && proposal.status === ProposalStatus.AVAILABLE
  const canBeCancelled = proposal.status === ProposalStatus.AVAILABLE
  const hasUserVoted = proposalUserVotes != null

  const {
    castVote,
    isLoading: isLoadingCastVote,
    result: castVoteResult,
    setResult: setCastVoteResult,
  } = useCastVote()

  const {
    cancelProposal,
    isLoading: isLoadingCancelProposal,
    result: cancelProposalResult,
    setResult: setCancelProposalResult,
  } = useCancelProposal()

  const {
    concludeProposal,
    isLoading: isLoadingConcludeProposal,
    result: concludeProposalResult,
    setResult: setConcludeProposalResult,
  } = useConcludeProposal()

  const handleCastVote = () => {
    if (selectedChoiceIndex == null || !userVotingPower || !userVotingDistributionData) return

    castVote({
      choices: {[proposal.txHash]: selectedChoiceIndex},
      pollTxHash: proposal.poll.txHash,
      votingPower: userVotingPower.toNumber(),
      votingUTxOs: userVotingDistributionData.utxoIds.map(utxoIdToApiTxInput),
    })
  }

  const getChoiceLabel = (index: number) => (index === -1 ? 'Abstain' : choices[index]!)

  if (!votingParams) return null

  return (
    <Card sx={({palette}) => ({bgcolor: palette.grey[100]})}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography sx={{fontSize: 14}} color="text.secondary" gutterBottom>
            {new Date(proposal.poll.start).toLocaleString()} -{' '}
            {new Date(proposal.poll.end).toLocaleString()}
          </Typography>
          {isActive && <Chip label="Active" color="success" size="small" />}
        </Stack>
        <Typography variant="h5" component="div" mt={1}>
          {proposal.name}
        </Typography>
        <Typography variant="body2">{proposal.description}</Typography>

        <ButtonGroup sx={{mt: 2}} size="small">
          <Button
            href={ipfsToHttps(proposal.uri)}
            target="_blank"
            rel="noreferrer"
            endIcon={<OpenInNewIcon />}
          >
            Proposal documentation
          </Button>
          <Button
            href={proposal.communityUri}
            target="_blank"
            rel="noreferrer"
            endIcon={<OpenInNewIcon />}
          >
            Community discussion
          </Button>
        </ButtonGroup>

        <Grid
          container
          mt={2}
          width="100%"
          bgcolor={({palette}) => palette.background.paper}
          p={1.5}
          rowGap={1}
        >
          <Grid item xs={8}>
            <Typography variant="subtitle1" fontWeight="bold">
              Proposal creator:
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Stack alignItems="flex-end">
              <Button
                href={getExplorerAddressUrl(proposal.owner)}
                target="_blank"
                rel="noreferrer"
                variant="text"
                sx={({palette}) => ({
                  p: 0,
                  textTransform: 'none',
                  textDecoration: 'underline',
                  textUnderlineOffset: '0.3em',
                  color: palette.text.primary,
                })}
              >
                <Typography variant="subtitle1" textAlign="end">
                  {proposal.owner.slice(0, 10)}…{proposal.owner.slice(-10)}
                </Typography>
              </Button>
            </Stack>
          </Grid>

          <>
            <Grid item xs={8}>
              <Typography variant="subtitle1" fontWeight="bold">
                Requested amount:
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="subtitle1" textAlign="end">
                {proposal.requestedAmount ? (
                  <AssetQuantityDisplay
                    token={{
                      ...votingParams.governanceToken.asset,
                      quantity: new BigNumber(proposal.requestedAmount),
                    }}
                    assetMetadata={votingParams.governanceToken.metadata}
                  />
                ) : (
                  '-'
                )}
              </Typography>
            </Grid>
          </>

          <Grid item xs={8}>
            <Typography variant="subtitle1" fontWeight="bold">
              Your voting power for this proposal:
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle1" textAlign="end">
              {userVotingPower ? (
                <AssetQuantityDisplay
                  token={{
                    ...votingParams.governanceToken.asset,
                    quantity: userVotingPower,
                  }}
                  assetMetadata={votingParams.governanceToken.metadata}
                />
              ) : (
                '-'
              )}
            </Typography>
          </Grid>

          <Grid item xs={8}>
            <Typography variant="subtitle1" fontWeight="bold">
              Voting participation:
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle1" textAlign="end">
              {votingParticipation ? `${votingParticipation.toString()}%` : '-'}
            </Typography>
          </Grid>
        </Grid>

        <Stack direction="row" alignItems="baseline" mt={2} spacing={4}>
          <Typography variant="body2" flex={3} fontWeight="bold">
            Choice
          </Typography>
          <Typography variant="body2" flex={1} fontWeight="bold" textAlign="end">
            Total verified voting power
          </Typography>
          <Typography variant="body2" flex={1} fontWeight="bold" textAlign="end">
            My voting power
          </Typography>
        </Stack>
        <Stack spacing={1} mt={0.5}>
          {choices.map((choice, index) => (
            <ProposalChoice
              key={index}
              label={choice}
              choiceIndex={index}
              type={index < proposal.acceptChoices.length ? 'accept' : 'reject'}
              totalVotingPower={proposalVotes?.byChoice.find((a) => a.index === index)?.votingPower}
              userVote={proposalUserVotes?.index === index ? proposalUserVotes : undefined}
              enableClick={isActive && ownerStakeKeyHash != null}
              isSelected={selectedChoiceIndex === index}
              onClick={() => setSelectedChoiceIndex((prevIndex) => (prevIndex == index ? null : index))}
              governanceToken={votingParams.governanceToken}
            />
          ))}
          <ProposalChoice
            label="Abstain"
            choiceIndex={-1}
            type="abstain"
            totalVotingPower={proposalVotes?.byChoice.find((a) => a.index === -1)?.votingPower}
            userVote={proposalUserVotes?.index === -1 ? proposalUserVotes : undefined}
            enableClick={isActive && ownerStakeKeyHash != null}
            isSelected={selectedChoiceIndex === -1}
            onClick={() => setSelectedChoiceIndex((prevIndex) => (prevIndex == -1 ? null : -1))}
            governanceToken={votingParams.governanceToken}
          />
        </Stack>

        <Stack>
          <Stack direction="row" mt={3} justifyContent="flex-end" spacing={2}>
            {isAdmin && canBeConcluded && (
              <Button
                variant="contained"
                sx={{minWidth: '200px'}}
                onClick={() => setConcludingProposalTxRef(proposal)}
              >
                {'Conclude proposal'}
              </Button>
            )}
            {isAdmin && canBeCancelled && (
              <Button
                variant="contained"
                sx={{minWidth: '200px'}}
                onClick={() => setCancellingProposalTxRef(proposal)}
              >
                {'Cancel proposal'}
              </Button>
            )}
            {isActive && (
              <Button
                variant="contained"
                sx={{minWidth: '200px'}}
                disabled={
                  !ownerStakeKeyHash ||
                  selectedChoiceIndex == null ||
                  isLoadingCastVote ||
                  selectedChoiceIndex === proposalUserVotes?.index ||
                  !hasUserVotingPower
                }
                onClick={handleCastVote}
              >
                {!ownerStakeKeyHash
                  ? 'Connect wallet'
                  : !hasUserVotingPower
                    ? 'No voting power'
                    : isLoadingCastVote
                      ? 'loading'
                      : hasUserVoted
                        ? selectedChoiceIndex != null && selectedChoiceIndex !== proposalUserVotes?.index
                          ? `Change vote to '${getChoiceLabel(selectedChoiceIndex)}'`
                          : 'Change vote'
                        : selectedChoiceIndex != null
                          ? `Vote for '${getChoiceLabel(selectedChoiceIndex)}'`
                          : 'Vote'}
              </Button>
            )}
          </Stack>

          {castVoteResult && (
            <ActionResultDisplay
              result={castVoteResult}
              onClose={() => setCastVoteResult(null)}
              successMessage="Cast vote successful"
              errorMessage="Error while casting vote"
            />
          )}

          {cancelProposalResult && (
            <ActionResultDisplay
              result={cancelProposalResult}
              onClose={() => setCancelProposalResult(null)}
              successMessage="Cancel proposal successful"
              errorMessage="Error while cancelling proposal"
            />
          )}

          {concludeProposalResult && (
            <ActionResultDisplay
              result={concludeProposalResult}
              onClose={() => setConcludeProposalResult(null)}
              successMessage="Conclude proposal successful"
              errorMessage="Error while concluding proposal"
            />
          )}
        </Stack>
      </CardContent>

      {cancellingProposalTxRef && (
        <CancelProposalModal
          open={cancellingProposalTxRef != null}
          onClose={() => setCancellingProposalTxRef(null)}
          proposalTxRef={cancellingProposalTxRef}
          onCancel={cancelProposal}
          isLoading={isLoadingCancelProposal}
        />
      )}

      {concludingProposalTxRef && proposalVotes && (
        <ConcludeProposalModal
          open={concludingProposalTxRef != null}
          onClose={() => setConcludingProposalTxRef(null)}
          proposalTxRef={concludingProposalTxRef}
          proposalVotes={proposalVotes.byChoice}
          proposalChoices={choices}
          onConclude={concludeProposal}
          isLoading={isLoadingConcludeProposal}
        />
      )}
    </Card>
  )
}

type ProposalChoiceProps = {
  label: string
  choiceIndex: number
  type: 'accept' | 'reject' | 'abstain'
  totalVotingPower?: VotesByState
  userVote?: UserVotesResponse[string]
  enableClick?: boolean
  isSelected?: boolean
  onClick?: () => void
  governanceToken: GovernanceVotingParams['governanceToken']
}

const ProposalChoice = ({
  label,
  choiceIndex,
  type,
  totalVotingPower,
  userVote,
  enableClick,
  isSelected,
  onClick,
  governanceToken,
}: ProposalChoiceProps) => {
  const getBgColor = (palette: Palette) => {
    return {
      accept: palette.success.light,
      reject: palette.error.light,
      abstain: palette.info.light,
    }[type]
  }

  const hasBorder = userVote != null || isSelected
  const isUserVote = userVote?.index === choiceIndex

  return (
    <Stack
      p={hasBorder ? 0.5 : 1}
      px={hasBorder ? 1.5 : 2}
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      border={({palette, spacing}) =>
        hasBorder ? `${spacing(0.5)} solid ${palette.primary.dark}` : undefined
      }
      boxShadow={({palette}) =>
        isSelected && !isUserVote ? `2px 2px 5px ${palette.success.main}` : undefined
      }
      onClick={enableClick ? onClick : undefined}
      sx={({palette}) => ({
        cursor: enableClick ? 'pointer' : 'default',
        transition: 'background-color 0.2s ease-in-out',
        bgcolor: alpha(getBgColor(palette), 0.8),
        '&:hover': enableClick
          ? {
              bgcolor: alpha(getBgColor(palette), 1),
            }
          : {},
      })}
    >
      <Typography variant="body1" flex={3}>
        {label}
      </Typography>

      <Stack flex={1} alignItems="flex-end">
        <Tooltip
          title={
            totalVotingPower ? (
              <Stack>
                <VoteByStateDisplay
                  state="Verified"
                  value={totalVotingPower.VERIFIED}
                  governanceToken={governanceToken}
                />
                <VoteByStateDisplay
                  state="Unverified"
                  value={totalVotingPower.UNVERIFIED}
                  governanceToken={governanceToken}
                />
                <VoteByStateDisplay
                  state="Invalid"
                  value={totalVotingPower.INVALID}
                  governanceToken={governanceToken}
                />
              </Stack>
            ) : undefined
          }
          sx={{width: 'fit-content'}}
        >
          <Typography variant="body1" px={1} py={0.5}>
            {totalVotingPower ? (
              <AssetQuantityDisplay
                token={{...governanceToken.asset, quantity: new BigNumber(totalVotingPower.VERIFIED)}}
                assetMetadata={governanceToken.metadata}
              />
            ) : (
              '-'
            )}
          </Typography>
        </Tooltip>
      </Stack>

      <Typography variant="body1" flex={1} textAlign="end">
        {userVote ? (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            component="span"
            width="100%"
            justifyContent="flex-end"
          >
            <AssetQuantityDisplay
              token={{...governanceToken.asset, quantity: new BigNumber(userVote.votingPower)}}
              assetMetadata={governanceToken.metadata}
            />
            <VoteVerificationStateIcon state={userVote.verificationState} />
          </Stack>
        ) : (
          '-'
        )}
      </Typography>
    </Stack>
  )
}

type VoteByStateDisplayProps = {
  state: string
  value: string
  governanceToken: GovernanceVotingParams['governanceToken']
}

const VoteByStateDisplay = ({state, value, governanceToken}: VoteByStateDisplayProps) => {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
      <Typography>{state}</Typography>
      <Typography>
        {
          <AssetQuantityDisplay
            token={{...governanceToken.asset, quantity: new BigNumber(value)}}
            assetMetadata={governanceToken.metadata}
          />
        }
      </Typography>
    </Stack>
  )
}
