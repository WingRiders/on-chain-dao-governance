import {
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Palette,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import {
  useTheoreticalMaxVotingPowerQuery,
  useUserVotesQuery,
  useUserVotingDistributionQuery,
  useVotesQuery,
} from '@wingriders/governance-frontend-react-sdk'
import {ProposalDetails, UserVotesResponse, VotesByState} from '@wingriders/governance-sdk'
import {useContext, useState} from 'react'
import {WalletContext} from './ConnectWalletContext'
import {formatBigNumber} from './helpers/formatNumber'
import {VoteVerificationStateIcon} from './components/VoteVerificationStateIcon'
import {ipfsToHttps} from './helpers/ipfs'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import {BigNumber} from '@wingriders/cab/types'
import {getExplorerAddressUrl} from './helpers/explorer'
import {useTime} from './helpers/time'
import {utxoIdToApiTxInput} from './helpers/utxo'
import {useCastVote} from './helpers/actions'

type ProposalProps = {
  proposal: ProposalDetails
}

export const Proposal = ({proposal}: ProposalProps) => {
  const time = useTime(10_000)
  const {ownerStakeKeyHash} = useContext(WalletContext)

  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null)

  const {data: votesData} = useVotesQuery([{proposalTxHashes: [proposal.txHash]}])
  const proposalVotes = votesData?.[proposal.txHash]
  const choices = [...proposal.acceptChoices, ...proposal.rejectChoices]

  const {data: userVotesData} = useUserVotesQuery(
    ownerStakeKeyHash ? [{ownerStakeKeyHash, proposalTxHashes: [proposal.txHash]}] : undefined
  )
  const proposalUserVotes = userVotesData?.[proposal.txHash]

  const {data: userVotingDistributionData} = useUserVotingDistributionQuery(
    ownerStakeKeyHash ? [{ownerStakeKeyHash, slot: proposal.poll.snapshot}] : undefined
  )
  const userVotingPower = userVotingDistributionData?.walletTokens.votingPower

  const {data: theoreticalMaxVotingPower} = useTheoreticalMaxVotingPowerQuery([])

  const votingParticipation =
    proposalVotes && theoreticalMaxVotingPower
      ? new BigNumber(proposalVotes.votingPower.VERIFIED).div(theoreticalMaxVotingPower).decimalPlaces(5)
      : undefined

  const isActive = time >= proposal.poll.start && time <= proposal.poll.end
  const hasUserVoted = proposalUserVotes != null

  const {
    castVote,
    isLoading: isLoadingCastVote,
    result: castVoteResult,
    setResult: setCastVoteResult,
  } = useCastVote()

  const handleCastVote = () => {
    if (selectedChoiceIndex == null || !userVotingPower) return

    castVote({
      choices: {[proposal.txHash]: selectedChoiceIndex},
      pollTxHash: proposal.poll.txHash,
      votingPower: Number(userVotingPower),
      votingUTxOs: userVotingDistributionData.utxoIds.map(utxoIdToApiTxInput),
    })
  }

  const getChoiceLabel = (index: number) => (index === -1 ? 'Abstain' : choices[index]!)

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

          <Grid item xs={8}>
            <Typography variant="subtitle1" fontWeight="bold">
              Your voting power for this proposal:
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle1" textAlign="end">
              {userVotingPower ? formatBigNumber(userVotingPower) : '-'}
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
          />
        </Stack>

        {isActive && (
          <Stack>
            <Stack direction="row" mt={3} justifyContent="flex-end">
              <Button
                variant="contained"
                sx={{minWidth: '200px'}}
                disabled={
                  !ownerStakeKeyHash ||
                  selectedChoiceIndex == null ||
                  isLoadingCastVote ||
                  selectedChoiceIndex === proposalUserVotes?.index
                }
                onClick={handleCastVote}
              >
                {isLoadingCastVote
                  ? 'loading'
                  : hasUserVoted
                    ? selectedChoiceIndex != null && selectedChoiceIndex !== proposalUserVotes?.index
                      ? `Change vote to '${getChoiceLabel(selectedChoiceIndex)}'`
                      : 'Change vote'
                    : selectedChoiceIndex != null
                      ? `Vote for '${getChoiceLabel(selectedChoiceIndex)}'`
                      : 'Vote'}
              </Button>
            </Stack>

            {castVoteResult && (
              <Stack
                bgcolor={({palette}) =>
                  castVoteResult.isSuccess ? palette.success.dark : palette.error.dark
                }
                mt={1}
                p={1}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography
                  color={({palette}) =>
                    castVoteResult.isSuccess ? palette.success.contrastText : palette.error.contrastText
                  }
                >
                  {castVoteResult.isSuccess
                    ? `Cast vote successful, transaction: ${castVoteResult.txHash}`
                    : 'Error while casting vote: ' + castVoteResult.error}
                </Typography>
                <IconButton onClick={() => setCastVoteResult(null)}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            )}
          </Stack>
        )}
      </CardContent>
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
                <VoteByStateDisplay state="Verified" value={totalVotingPower.VERIFIED} />
                <VoteByStateDisplay state="Unverified" value={totalVotingPower.UNVERIFIED} />
                <VoteByStateDisplay state="Invalid" value={totalVotingPower.INVALID} />
              </Stack>
            ) : undefined
          }
          sx={{width: 'fit-content'}}
        >
          <Typography variant="body1" px={1} py={0.5}>
            {totalVotingPower ? formatBigNumber(totalVotingPower.VERIFIED) : '-'}
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
            <span>{formatBigNumber(userVote.votingPower)}</span>
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
}

const VoteByStateDisplay = ({state, value}: VoteByStateDisplayProps) => {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
      <Typography>{state}</Typography>
      <Typography>{formatBigNumber(value)}</Typography>
    </Stack>
  )
}
