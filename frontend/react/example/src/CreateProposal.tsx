import CloseIcon from '@mui/icons-material/Close'
import {Box, Button, IconButton, Stack, Typography} from '@mui/material'
import {useContext, useState} from 'react'

import {
  useCreateProposalAction,
  useSignTxAction,
  useSubmitTxAction,
} from '@wingriders/governance-frontend-react-sdk'
import {WalletContext} from './ConnectWalletContext'

export const CreateProposal = () => {
  const {ownerAddress} = useContext(WalletContext)

  const {mutateAsync: createProposal, isLoading: isLoadingCreate} = useCreateProposalAction()
  const {mutateAsync: signTx, isLoading: isLoadingSign} = useSignTxAction()
  const {mutateAsync: submitTx, isLoading: isLoadingSubmit} = useSubmitTxAction()

  const [result, setResult] = useState<
    {isSuccess: true; txHash: string} | {isSuccess: false; error: string} | null
  >(null)

  const handleCreateProposal = async () => {
    if (!ownerAddress) {
      console.error('Owner address is not set, make sure your wallet is connected')
      return
    }

    try {
      const buildTxInfo = await createProposal({
        poll: {
          description: 'poll description',
          start: new Date(),
          end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
        proposal: {
          name: 'proposal name',
          description: 'proposal description',
          uri: 'ipfs://QmXyZ',
          communityUri: 'https://exampleapp.com/proposal/1',
          acceptChoices: ['yes'],
          rejectChoices: ['no'],
          owner: ownerAddress,
        },
      })
      const {cborizedTx, txHash} = await signTx({buildTxInfo})
      await submitTx({cborizedTx})
      setResult({isSuccess: true, txHash})
    } catch (e) {
      console.error(e)
      setResult({isSuccess: false, error: JSON.stringify(e)})
    }
  }

  const isLoading = isLoadingCreate || isLoadingSign || isLoadingSubmit

  return (
    <Box width="100%">
      <Button
        variant="contained"
        onClick={handleCreateProposal}
        fullWidth
        disabled={isLoading || !ownerAddress}
      >
        {isLoading ? 'Creating proposal...' : 'Create example proposal'}
      </Button>
      {result && (
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
              ? `Proposal created, transaction: ${result.txHash}`
              : 'Error while creating proposal: ' + result.error}
          </Typography>
          <IconButton onClick={() => setResult(null)}>
            <CloseIcon />
          </IconButton>
        </Stack>
      )}
    </Box>
  )
}
