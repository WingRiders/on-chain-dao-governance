import {Button, Dialog, DialogActions, DialogContent, Stack, TextField, Typography} from '@mui/material'
import {useContext} from 'react'
import {WalletContext} from '../wallet/ConnectWalletContext'
import {useForm} from 'react-hook-form'
import {InputField} from '../../components/InputField'
import {BuildCancelProposalParams} from '@wingriders/governance-sdk'
import {Address, TxInputRef} from '@wingriders/cab/types'
import {ActionResult} from '../../helpers/actions'

type CancelProposalForm = {
  beneficiary: string
  reason: string
}

type CancelProposalModalProps = {
  open: boolean
  onClose: () => void
  proposalTxRef: TxInputRef
  onCancel: (params: BuildCancelProposalParams) => Promise<ActionResult>
  isLoading?: boolean
}

export const CancelProposalModal = ({
  open,
  onClose,
  proposalTxRef,
  onCancel,
  isLoading,
}: CancelProposalModalProps) => {
  const {ownerAddress} = useContext(WalletContext)

  const {
    handleSubmit,
    control,
    formState: {errors},
  } = useForm<CancelProposalForm>({
    defaultValues: {
      beneficiary: ownerAddress,
    },
  })

  const handleCancelProposal = async (data: CancelProposalForm) => {
    if (!ownerAddress) return

    await onCancel({
      proposalTxRef,
      beneficiary: data.beneficiary as Address,
      reason: data.reason,
    })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <Typography variant="h5">Cancel proposal</Typography>
        <Stack spacing={1} mt={3} minWidth={500}>
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
            name="reason"
            control={control}
            rules={{required: true}}
            render={({field}) => (
              <TextField {...field} placeholder="cancelled by DAO admin" label="Reason" size="medium" />
            )}
            errors={errors}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={handleSubmit(handleCancelProposal)} disabled={isLoading}>
          {isLoading ? 'Cancelling...' : 'Cancel proposal'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
