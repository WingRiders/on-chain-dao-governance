import {Box, Button, Stack, TextField, Typography} from '@mui/material'
import {useContext} from 'react'

import {WalletContext} from '../../ConnectWalletContext'
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

const DEFAULT_VALUES: CreateProposalForm = {
  name: '',
  description: '',
  uri: '',
  communityUri: '',
  acceptChoices: [{id: nanoid(), label: 'Yes'}],
  rejectChoices: [{id: nanoid(), label: 'No'}],
  start: startOfDay(addDays(new Date(), 1)),
  end: endOfDay(addDays(new Date(), 6)),
}

export const CreateProposal = () => {
  const {ownerAddress} = useContext(WalletContext)

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
    reset(DEFAULT_VALUES)

    if (!ownerAddress) return

    await createProposal({
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
      },
    })
  }

  return (
    <Box width="100%">
      <Typography variant="h5">Create proposal</Typography>

      {!ownerAddress ? (
        <Typography color="error" textAlign="center" mt={5}>
          Connect wallet
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

          <Button
            variant="contained"
            onClick={handleSubmit(handleCreateProposal)}
            disabled={isLoading}
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
