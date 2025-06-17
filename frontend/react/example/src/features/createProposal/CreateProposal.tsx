import {Box, Button, Stack, TextField, Typography} from '@mui/material'
import {useContext} from 'react'

import {WalletContext} from '../wallet/ConnectWalletContext'
import {useCreateProposal} from '../../helpers/actions'
import {ActionResultDisplay} from '../../components/ActionResultDisplay'
import {DateTimePicker} from '@mui/x-date-pickers'
import {CreateProposalForm} from './types'
import {useForm} from 'react-hook-form'
import {compact} from 'lodash'
import {nanoid} from 'nanoid'
import {startOfDay, endOfDay, addDays} from 'date-fns'
import {InputField} from '../../components/InputField'
import {ChoicesFormField} from './ChoicesFormField'
import {useVotingParamsQuery} from '@wingriders/governance-frontend-react-sdk'
import {useUserBalance} from '../../helpers/userBalance'
import {assetQuantity} from '@wingriders/cab/ledger/assets'
import {AssetQuantityDisplay} from '../../components/AssetQuantityDisplay'
import {BigNumber} from '@wingriders/cab/types'

const DEFAULT_VALUES: CreateProposalForm = {
  name: '',
  description: '',
  uri: '',
  communityUri: '',
  acceptChoices: [{id: nanoid(), label: 'Yes'}],
  rejectChoices: [{id: nanoid(), label: 'No'}],
  start: startOfDay(addDays(new Date(), 1)),
  end: endOfDay(addDays(new Date(), 6)),
  requestedAmount: undefined,
}

export const CreateProposal = () => {
  const {ownerAddress} = useContext(WalletContext)

  const {data: votingParams, isLoading: isLoadingVotingParams} = useVotingParamsQuery([])
  const governanceToken = votingParams?.governanceToken
  const requiredCollateralQuantity = votingParams?.proposalCollateralQuantity

  const {userBalance, isLoading: isLoadingUserBalance} = useUserBalance()
  const userAvailableBalanceForCollateral =
    userBalance && governanceToken ? assetQuantity(userBalance, governanceToken.asset) : undefined

  const hasUserSufficientBalanceForCollateral =
    userAvailableBalanceForCollateral && requiredCollateralQuantity
      ? userAvailableBalanceForCollateral.gte(requiredCollateralQuantity)
      : undefined

  const {createProposal, isLoading, result, setResult} = useCreateProposal()

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: {errors, isSubmitted},
    reset,
  } = useForm<CreateProposalForm>({
    defaultValues: DEFAULT_VALUES,
  })

  const acceptChoices = watch('acceptChoices')
  const rejectChoices = watch('rejectChoices')

  const hasEnoughChoices = compact(acceptChoices).length + compact(rejectChoices).length >= 2

  const handleCreateProposal = async (data: CreateProposalForm) => {
    if (!ownerAddress || !governanceToken) return

    const {isSuccess} = await createProposal({
      poll: {
        description: '',
        start: data.start,
        end: data.end,
        snapshot: data.start,
      },
      proposal: {
        owner: ownerAddress,
        name: data.name,
        description: data.description,
        uri: data.uri,
        communityUri: data.communityUri,
        acceptChoices: data.acceptChoices.map((choice) => choice.label),
        rejectChoices: data.rejectChoices.map((choice) => choice.label),
        requestedAmount: data.requestedAmount
          ? new BigNumber(data.requestedAmount).shiftedBy(governanceToken.metadata?.decimals ?? 0)
          : undefined,
      },
    })

    if (isSuccess) reset(DEFAULT_VALUES)
  }

  return (
    <Box width="100%">
      <Typography variant="h5">Create proposal</Typography>

      {!ownerAddress ? (
        <Typography color="error" textAlign="center" mt={5}>
          Connect wallet
        </Typography>
      ) : isLoadingVotingParams || isLoadingUserBalance ? (
        <Typography textAlign="center" mt={5}>
          Loading...
        </Typography>
      ) : (
        <>
          <Stack spacing={3} mt={3} minWidth={500}>
            <InputField
              name="name"
              control={control}
              rules={{required: true}}
              render={({field}) => (
                <TextField {...field} placeholder="Proposal name" label="Name" size="medium" />
              )}
              errors={errors}
            />
            <InputField
              name="description"
              control={control}
              rules={{required: true}}
              render={({field}) => (
                <TextField
                  {...field}
                  placeholder="Proposal description"
                  label="Description"
                  size="medium"
                />
              )}
              errors={errors}
            />
            <InputField
              name="uri"
              control={control}
              rules={{
                required: true,
                pattern: {
                  value: /^ipfs:\/\/.*/,
                  message: 'URI must start with ipfs://',
                },
              }}
              render={({field}) => (
                <TextField {...field} placeholder="ipfs://" label="URI" size="medium" />
              )}
              errors={errors}
            />
            <InputField
              name="communityUri"
              control={control}
              rules={{
                required: true,
                pattern: {
                  value: /^https:\/\/.*/,
                  message: 'Community URI must start with https://',
                },
              }}
              render={({field}) => (
                <TextField
                  {...field}
                  placeholder="https://community.yourapp.com/"
                  label="Community URI"
                  size="medium"
                />
              )}
              errors={errors}
            />
            <InputField
              name="requestedAmount"
              control={control}
              rules={{
                required: false,
                validate: (value) => {
                  if (!value) return true

                  const parsedValue = new BigNumber(value)
                  if (parsedValue.isNaN()) return 'Invalid amount'
                  if (parsedValue.lte(0)) return 'Amount must be greater than 0'

                  return true
                },
              }}
              render={({field}) => (
                <TextField
                  {...field}
                  placeholder="1000"
                  label="Requested amount (optional)"
                  size="medium"
                />
              )}
              errors={errors}
            />
            <ChoicesFormField
              label="Accept choices"
              fieldName="acceptChoices"
              placeholder="Yes"
              watch={watch}
              setValue={setValue}
              control={control}
              errors={errors}
            />
            <ChoicesFormField
              label="Reject choices"
              fieldName="rejectChoices"
              placeholder="No"
              watch={watch}
              setValue={setValue}
              control={control}
              errors={errors}
            />
            <InputField
              name="start"
              control={control}
              rules={{required: true}}
              render={({field}) => <DateTimePicker {...field} ampm={false} label="Start date" />}
              errors={errors}
            />
            <InputField
              name="end"
              control={control}
              rules={{required: true}}
              render={({field}) => <DateTimePicker {...field} ampm={false} label="End date" />}
              errors={errors}
            />
          </Stack>

          {!hasEnoughChoices && isSubmitted && (
            <Typography color={({palette}) => palette.error.main} mt={3}>
              Proposal must have at least two choices in total (either accept or reject)
            </Typography>
          )}

          {!hasUserSufficientBalanceForCollateral && (
            <Typography color={({palette}) => palette.error.main} mt={3}>
              You don't have enough collateral to create a proposal.
              {requiredCollateralQuantity && userAvailableBalanceForCollateral && governanceToken && (
                <>
                  You need at least{' '}
                  <AssetQuantityDisplay
                    token={{...governanceToken.asset, quantity: requiredCollateralQuantity}}
                    assetMetadata={governanceToken.metadata}
                    showTicker
                  />{' '}
                  but you have{' '}
                  <AssetQuantityDisplay
                    token={{...governanceToken.asset, quantity: userAvailableBalanceForCollateral}}
                    assetMetadata={governanceToken.metadata}
                    showTicker
                  />
                  .
                </>
              )}
            </Typography>
          )}
          <Button
            variant="contained"
            onClick={handleSubmit(handleCreateProposal)}
            disabled={isLoading || isLoadingVotingParams || !hasUserSufficientBalanceForCollateral}
            sx={{width: '100%', mt: 4}}
          >
            {isLoading ? 'Creating...' : 'Create proposal'}
          </Button>

          {result && (
            <ActionResultDisplay
              result={result}
              successMessage="Proposal created"
              errorMessage="Error while creating proposal"
              onClose={() => setResult(null)}
            />
          )}
        </>
      )}
    </Box>
  )
}
