import CloseIcon from '@mui/icons-material/Close'
import {Stack, Typography, IconButton} from '@mui/material'
import {ActionResult} from '../helpers/actions'

type ActionResultDisplayProps = {
  result: ActionResult
  onClose?: () => void
  successMessage?: string
  errorMessage?: string
}

export const ActionResultDisplay = ({
  result,
  onClose,
  successMessage,
  errorMessage,
}: ActionResultDisplayProps) => {
  return (
    <Stack
      bgcolor={({palette}) => (result.isSuccess ? palette.success.dark : palette.error.dark)}
      mt={1}
      p={1}
      direction="row"
      justifyContent="space-between"
      alignItems="center"
    >
      <Typography
        color={({palette}) =>
          result.isSuccess ? palette.success.contrastText : palette.error.contrastText
        }
      >
        {result.isSuccess
          ? `${successMessage}, transaction: ${result.txHash}`
          : `${errorMessage}:  ${result.error}`}
      </Typography>
      <IconButton onClick={onClose}>
        <CloseIcon />
      </IconButton>
    </Stack>
  )
}
