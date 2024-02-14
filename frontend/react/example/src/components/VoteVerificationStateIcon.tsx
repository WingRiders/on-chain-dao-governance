import {VoteVerificationState} from '@wingriders/governance-sdk'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CheckIcon from '@mui/icons-material/Check'
import {match} from 'ts-pattern'
import CloseIcon from '@mui/icons-material/Close'
import {Tooltip} from '@mui/material'

type VoteVerificationStateIconProps = {
  state: VoteVerificationState
}

export const VoteVerificationStateIcon = ({state}: VoteVerificationStateIconProps) => {
  const {tooltip, icon} = match(state)
    .with(VoteVerificationState.VERIFIED, () => ({
      icon: <CheckIcon fontSize="inherit" />,
      tooltip: 'your vote is verified',
    }))
    .with(VoteVerificationState.UNVERIFIED, () => ({
      icon: <AccessTimeIcon fontSize="inherit" />,
      tooltip: 'your vote is being verified',
    }))
    .with(VoteVerificationState.INVALID, () => ({
      icon: <CloseIcon fontSize="inherit" />,
      tooltip: 'your vote is invalid',
    }))
    .exhaustive()

  return <Tooltip title={tooltip}>{icon}</Tooltip>
}
