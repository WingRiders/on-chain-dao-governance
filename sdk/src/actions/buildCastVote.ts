import {Except} from 'type-fest'

import * as api from '@wingriders/cab/dappConnector'
import {stakingHashFromAddress} from '@wingriders/cab/ledger/address'
import {BigNumber, TxPlanArgs} from '@wingriders/cab/types'
import {reverseAddress, reverseUtxo} from '@wingriders/cab/wallet/connector'

import {LibError, LibErrorCode} from '../errors'
import {buildTx} from '../helpers/actions'
import {encodeVotesMetadatum} from '../helpers/encodeMetadatum'
import {getWalletOwner} from '../helpers/walletAddress'
import {GovMetadatumLabel, Vote} from '../types'
import {ActionContext, BuildAction, BuildActionParams, BuildActionResult} from './types'

type BuildCastVoteParams = {
  vote: Except<Vote, 'voterAddress'>
} & BuildActionParams

export type CastVoteMetadata = {
  transactionFee: api.Coin
  txHash: api.TxHash
  vote: Vote
  // change UTxO returned back to the user
  utxoRef: api.TxInput
}

type RequiredContext = Pick<ActionContext, 'protocolParameters' | 'network'>

export const buildCastVoteAction =
  ({protocolParameters, network}: RequiredContext) =>
  (jsApi: api.JsAPI): BuildAction<BuildCastVoteParams, CastVoteMetadata> =>
  async ({
    vote: {pollTxHash, choices, votingPower, votingUTxOs},
  }: BuildCastVoteParams): Promise<BuildActionResult<CastVoteMetadata>> => {
    const ownerAddress = reverseAddress(await getWalletOwner(jsApi))
    const stakingHash = stakingHashFromAddress(ownerAddress)

    const apiUtxos = await jsApi.getUtxos()

    if (!apiUtxos || apiUtxos.length === 0) {
      throw new LibError(LibErrorCode.InsufficientAdaForTx, 'No UTxOs found on the wallet')
    }

    // spend the first utxo we get from the wallet
    const firstUtxo = apiUtxos[0]!
    const spendUtxo = reverseUtxo(firstUtxo)

    const vote: Vote = {
      pollTxHash,
      choices,
      voterAddress: ownerAddress,
      votingPower,
      votingUTxOs,
    }

    const planArgs: TxPlanArgs = {
      planId: 'cast-vote',
      inputs: [{isScript: false, utxo: spendUtxo}],
      outputs: [],
      metadata: {
        // NOTE for now custom metadatum until it gets standardised and moved to cab
        custom: new Map([[GovMetadatumLabel.COMMUNITY_VOTING_VOTE, encodeVotesMetadatum([vote])]]),
      },
      requiredSigners: [stakingHash],
      protocolParameters,
    }

    const {tx, txAux, txWitnessSet} = await buildTx({jsApi, planArgs, network})

    const transactionFee = new BigNumber(txAux.fee) as api.Coin

    const txHash = txAux.getId() as api.TxHash
    const metadata: CastVoteMetadata = {
      transactionFee,
      txHash,
      vote,
      utxoRef: {
        index: new BigNumber(0) as api.UInt,
        txHash,
      },
    }

    return {
      tx,
      txAux,
      txWitnessSet,
      metadata,
    }
  }
