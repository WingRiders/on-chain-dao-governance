import {Transaction, TxHash} from '@wingriders/cab/dappConnector'
import {ShelleyTxAux, TxSigned} from '@wingriders/cab/ledger/transaction'
import {Network, ProtocolParameters, TxWitnessSet} from '@wingriders/cab/types'

import {GovernanceVotingParams} from '../types'
import type {createActionsClient} from './actionsClient'

export type ActionContext = {
  network: Network
  protocolParameters: ProtocolParameters
  governanceVotingParams: GovernanceVotingParams
}

export type ActionsClient = Awaited<ReturnType<typeof createActionsClient>>

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

export type BuiltTxInfo = {
  tx: Transaction
  txAux: ShelleyTxAux
  txWitnessSet: TxWitnessSet
}

export type SignedTxInfo = {
  signedTx: Transaction
  cborizedTx: TxSigned
  txHash: TxHash
}
