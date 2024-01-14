import {BuiltTxInfo} from './helpers/actions'

export enum BuildActionMode {
  PREVIEW,
  BUILD,
}

export type BuildActionParams = {
  actionMode?: BuildActionMode
}

// BuiltTxInfo uses some types from cab/types instead of can/dappConnector to match the required type - is this a problem?
export type BuildActionResult<TMetadata> = BuiltTxInfo & {metadata: TMetadata}

export type BuildAction<TParams extends BuildActionParams, TMetadata> = (
  options: TParams
) => Promise<BuildActionResult<TMetadata>>

export type BuildActionWithoutMode<TParams, TMetadata> = (
  options: TParams
) => Promise<BuildActionResult<TMetadata>>
