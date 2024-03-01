import {Stack, Typography} from '@mui/material'
import {Control, Controller, ControllerProps, FieldErrors, FieldValues, Path} from 'react-hook-form'

type InputFieldProps<TFieldValues extends FieldValues, TFieldName extends Path<TFieldValues>> = {
  control: Control<TFieldValues>
  name: TFieldName
  render: ControllerProps<TFieldValues, TFieldName>['render']
  rules?: ControllerProps<TFieldValues, TFieldName>['rules']
  errors: FieldErrors<TFieldValues>
}

export const InputField = <TFieldValues extends FieldValues, TFieldName extends Path<TFieldValues>>({
  control,
  name,
  rules,
  render,
  errors,
}: InputFieldProps<TFieldValues, TFieldName>) => {
  const error = errors[name]

  return (
    <Stack spacing={0.5}>
      <Controller control={control} name={name} rules={rules} render={render} />
      {error != null && (
        <Typography variant="body2" color={({palette}) => palette.error.main}>
          {error.message
            ? error.message.toString()
            : error.type === 'required'
              ? 'This field is required'
              : 'Invalid value'}
        </Typography>
      )}
    </Stack>
  )
}
