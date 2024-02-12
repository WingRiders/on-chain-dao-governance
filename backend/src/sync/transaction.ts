import {Transaction} from '@cardano-ogmios/schema'

import {PrismaTxClient} from '../db/prismaClient'

type UpsertTransactionArgs = {
  prismaTx: PrismaTxClient
  transaction: Transaction
  slot: number
}
export const upsertTransaction = ({prismaTx, transaction, slot}: UpsertTransactionArgs) => {
  const txHash = Buffer.from(transaction.id, 'hex')
  return prismaTx.transaction.upsert({
    create: {
      txFee: transaction.fee!.ada.lovelace,
      txHash,
      block: {
        connect: {
          slot,
        },
      },
    },
    update: {},
    where: {
      txHash,
    },
  })
}
