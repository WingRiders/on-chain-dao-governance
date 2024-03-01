import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {adaToLovelace} from '@wingriders/cab/helpers'
import {TxSigned} from '@wingriders/cab/ledger/transaction'
import {Ada} from '@wingriders/cab/types'

import {buildCreateProposalAction, signTxAction} from '../../src'
import {createAction} from '../fixtures/createAction'
import {POLL_WITH_SNAPSHOT, PROPOSAL} from '../fixtures/data/entities'
import {GOVERNANCE_VOTING_PARAMS} from '../fixtures/data/governanceVotingParams'
import {getSimpleMockedWallet} from '../fixtures/mockWallet'

describe('sign transaction', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('successfully signs a transaction', async () => {
    vi.setSystemTime(new Date('2024-08-01T00:00:00Z'))
    const {jsApi} = await getSimpleMockedWallet({
      utxos: [
        {
          coins: adaToLovelace(new Ada(100) as Ada),
          outputIndex: 0,
          txHash: 'b8a6e89adc8801e5739b53eee38cdee6ca8d0c3716a5ee83c1f8609c7269a6d5',
          tokenBundle: [
            {
              ...GOVERNANCE_VOTING_PARAMS.governanceToken.asset,
              quantity: GOVERNANCE_VOTING_PARAMS.proposalCollateralQuantity,
            },
          ],
        },
      ],
    })
    const proposal = PROPOSAL
    const poll = POLL_WITH_SNAPSHOT

    const createProposal = createAction(buildCreateProposalAction, jsApi)
    const signTx = createAction(signTxAction, jsApi)

    const buildTxInfo = await createProposal({proposal, poll})

    const signedTx = await signTx({buildTxInfo})
    const expectedCborizedTx: TxSigned = {
      txHash: 'f4f400717716f0aef30a1abc34b7f84d22e9bc696d19f790a9649b9d18029c1d',
      txBody:
        '84a60081825820b8a6e89adc8801e5739b53eee38cdee6ca8d0c3716a5ee83c1f8609c7269a6d500018282583900b47c7c0ca235a188003fde3e6a583141a89125f346572bb87e81a8702966ddf1dacf046d52483389174713c212a3b549370f996066569251821a0012050ca1581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a05f5e10082583900b47c7c0ca235a188003fde3e6a583141a89125f346572bb87e81a8702966ddf1dacf046d52483389174713c212a3b549370f9960665692511a05e0fc17021a0002dfdd031a03fb2338075820fc890fad8de5a73a448babcbaf01ba94de17ec4a2ea25bca94b814f74fe5b56f081a03fb1528a1008182582023db24dd4ec11a54e462d39ced6c1541ed727f8b6d2fe775cf6135f67f79d5eb5840a7b630f602543af7ce42d2ca178157db535d9b1b5b2049b0c27b1f7c2a754d231682c930530a9973f65cb85948d8c24f5a67a8ab3ad7579d309096dd44509b08f5a1191678a3626f706b61646450726f706f73616c64706f6c6ca5626f706663726561746563656e641b000001911062dc006573746172741b000001910b3c800068736e617073686f741b000001910b3c80006b6465736372697074696f6e6b6465736372697074696f6e6870726f706f73616ca7637572696c697066733a2f2f516d58795a646e616d65646e616d65656f776e6572583900b47c7c0ca235a188003fde3e6a583141a89125f346572bb87e81a8702966ddf1dacf046d52483389174713c212a3b549370f9960665692516b6465736372697074696f6e6b6465736372697074696f6e6c636f6d6d756e6974795572697368747470733a2f2f6578616d706c652e636f6d6d61636365707443686f6963657381666163636570746d72656a65637443686f69636573816672656a656374',
    }
    expect(signedTx.cborizedTx).toEqual(expectedCborizedTx)
  })
})
