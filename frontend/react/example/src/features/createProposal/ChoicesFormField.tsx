import DeleteIcon from '@mui/icons-material/Delete'
import {Box, Button, IconButton, Stack, TextField, Typography} from '@mui/material'
import {Control, Controller, FieldErrors, UseFormSetValue, UseFormWatch} from 'react-hook-form'
import {CreateProposalChoice, CreateProposalForm} from './types'
import {InputField} from '../../components/InputField'
import {nanoid} from 'nanoid'

type ChoicesFieldName = 'acceptChoices' | 'rejectChoices'

type ChoicesFormFieldProps<TFieldName extends ChoicesFieldName> = {
  label: string
  fieldName: TFieldName
  placeholder: string
  watch: UseFormWatch<CreateProposalForm>
  setValue: UseFormSetValue<CreateProposalForm>
  control: Control<CreateProposalForm>
  errors: FieldErrors<CreateProposalForm>
}

export const ChoicesFormField = <TFieldName extends ChoicesFieldName>({
  fieldName,
  placeholder,
  control,
  watch,
  setValue,
  label,
  errors,
}: ChoicesFormFieldProps<TFieldName>) => {
  const choices = watch(fieldName)
  const choicesErrors = errors[fieldName]

  const setChoices = (value: CreateProposalChoice[]) => setValue(fieldName as ChoicesFieldName, value)

  const handleAddChoice = () => setChoices([...choices, {id: nanoid(), label: ''}])

  const handleRemoveChoice = (index: number) => {
    const newChoices = [...choices]
    newChoices.splice(index, 1)
    setChoices(newChoices)
  }
  return (
    <InputField
      name={fieldName}
      control={control}
      errors={errors}
      render={() => (
        <Stack>
          <Typography>{label}</Typography>
          <Stack spacing={1}>
            {choices.map((choice, index) => {
              const error = Array.isArray(choicesErrors) ? choicesErrors?.[index] : undefined
              return (
                <Stack key={choice.id}>
                  <Controller
                    name={`${fieldName}.${index}`}
                    control={control}
                    rules={{
                      validate: ({label}) => {
                        if (label === '') {
                          return 'This field is required'
                        }
                        return true
                      },
                    }}
                    render={({field}) => (
                      <TextField
                        placeholder={placeholder}
                        InputProps={{
                          endAdornment: (fieldName ===
                            'rejectChoices' /* any reject choice can be deleted */ ||
                            index > 0) /* don't allow deletion of the first accept choice */ && (
                            <IconButton onClick={() => handleRemoveChoice(index)}>
                              <DeleteIcon />
                            </IconButton>
                          ),
                        }}
                        {...field}
                        value={field.value.label}
                        onChange={(e) => field.onChange({id: choice.id, label: e.target.value})}
                      />
                    )}
                  />
                  {error && (
                    <Typography mt={0.5} color={({palette}) => palette.error.main}>
                      {error.message.toString()}
                    </Typography>
                  )}
                </Stack>
              )
            })}
          </Stack>
          <Box>
            <Button onClick={handleAddChoice}>Add new choice</Button>
          </Box>
        </Stack>
      )}
    />
  )
}
