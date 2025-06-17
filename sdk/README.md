# On-Chain DAO Governance SDK

`@wingriders/governance-sdk` is a TypeScript SDK that provides:

- a set of helper functions for transaction building, encoding/decoding metadata and others that are used in the backend for On-Chain DAO Governance
- functions for fetching data and creating blockchain transactions that can be used in a frontend application for On-Chain DAO Governance.

If you are building a frontend application in React, check [@wingriders/governance-frontend-react-sdk](https://www.npmjs.com/package/@wingriders/governance-frontend-react-sdk) which is a wrapper around `@wingriders/governance-sdk` to simplify its usage with React.

If you are not using React to build your frontend application, you can use this library directly and it will still provide benefits for you - see the documentation below.

## Installation

```bash
yarn add @wingriders/governance-sdk
```

## Unit tests

All critical parts of the library have corresponding unit tests. You can execute the unit tests by running:

```bash
yarn test
```

## Overview

The library is not specific to one deployment of the governance framework. It gets the required configuration options and deployment-specific data from the backend which acts as the configuration store. This enables the library and associated frontend application to be easy to deploy without any additional manual build steps needed.

The library acts as an SDK to support querying backend data and creating governance actions - specific on-chain transactions. It acts as a de facto glue between the backend and frontend.

## Actions

We refer to blockchain transactions as _actions_. This library provides a function for every blockchain transaction that can be created in the On-Chain DAO Governance.

### Action - Create a proposal

Action to create a proposal in an on-chain transaction with specific metadata.

**Inputs:** Proposal and poll metadata

This action creates a new proposal using an on-chain transaction. The output with the proposal creation collateral paid in governance tokens is sent to the DAO address. The proposal and poll are defined using the transaction metadata.

When creating a proposal the user has the option to create a new poll or reuse an existing one, in case a poll in the future exists.

Sample transaction metadata for creating a proposal with a new poll:

```json
{
  "op": "addProposal",
  "poll": {
    "op": "create",
    "end": 1688731200000,
    "start": 1687867200000,
    "snapshot": 1687867200000,
    "description": ""
  },
  "proposal": {
    "uri": "ipfs://QmUjmC9Pk5h9micdtce2kP1PU9iLort2B9cBmJSuJ52Zz1",
    "name": "Change of Community Portal Platform",
    "owner": "014670db61e18fda86bc547a9ada3824d5358bc3cd5878f6dd5d113047d097ab2804f2bfae3c585d58f1cb1b8797e8297fecb0412a1b73adc0",
    "description": ["Proposal to change the platform for the community portal to Disc", "ourse."],
    "communityUri": "https://community.wingriders.com/feedback/88272",
    "requestedAmount": "1000",
    "acceptChoices": ["Accept"],
    "rejectChoices": ["Reject"]
  }
}
```

Sample transaction metadata for creating a proposal and assigning it to an existing poll (the poll is identified by the transaction hash of its creation transaction):

```json
{
  "op": "addProposal",
  "poll": {
    "id": "7a70f8fe21707a2864bf3597ba73727a834f55d2ec49650871e6d571aec6acaf",
    "op": "assign"
  },
  "proposal": {
    "uri": "ipfs://QmTXYBBSgCaBG6n9tbC74QLk5TZeNtNyynNoDFLffy3ps8",
    "name": "Change of Stake Pool Voting",
    "owner": "014670db61e18fda86bc547a9ada3824d5358bc3cd5878f6dd5d113047d097ab2804f2bfae3c585d58f1cb1b8797e8297fecb0412a1b73adc0",
    "description": [
      "Proposal based on the community's feedback on how to improve the",
      " stake pool voting."
    ],
    "communityUri": "https://community.wingriders.com/feedback/76851",
    "acceptChoices": [
      "Keep the current threshold, use WRM01 as the default stake pool",
      "Set a new threshold to 20%, use WRM01 as the default stake pool",
      "Set a new threshold to 15%, use WRM01 as the default stake pool"
    ],
    "rejectChoices": ["Do not apply any changes"]
  }
}
```

### Action - Cast a vote

Action to cast a vote in an on-chain transaction.

**Inputs:** Proposal TX hash, selected vote option, wallet connector API

This action fetches the user’s voting power from the backend and then constructs an on-chain voting transaction. The transaction is sent to user’s own wallet and the vote itself is cast using a specific transaction metadata that lists the voting power UTxOs, the proposal TX hash, and the selected vote option.

Example metadata of a voting transaction

```json
{
  "9a14979b668a2a81b9c410e67abacafb1e57ddee969b018ae2b6f0e540331cd3": {
    "owner": "01a6759239805f2f8bf752f58efbcb13d5c1709376213ca6efa295639c38e2d045ded08dba428615f270bfe9d3b4370b1c903df231bf5c92c7",
    "power": 10000000,
    "utxos": [
      ["0ed7fe04ac5586b684c245ccb5fcc6dde52e94bafca647a1afb82e630596333c", 2],
      ["e88b60842387a28c9acd77a2109514e4938852d1972ef854d7292190c100814c", 2],
      ["13a4f3f8105e005be991862108893ddc0768c9488f1f366b4f759c44bd2bf3c4", 0]
    ],
    "choices": {
      "2512e949de9d8d170c4b5b46ffea036edd95b2b6966c731df4cdb09ddb20c80c": 0,
      "9a14979b668a2a81b9c410e67abacafb1e57ddee969b018ae2b6f0e540331cd3": 0
    }
  }
}
```

The first key defines the poll id that the user is casting his vote for. Then globally for the poll user’s voting power and its source UTxOs are defined and then follow the user’s voting choices.

### Action - Conclude proposal

Action to conclude a proposal in an on-chain transaction. Concluding a proposal means spending the proposal UTxO that belongs to the DAO wallet.

**Inputs:**

- Proposal txHash
- Results (passed/failed, total votes, votes for each choice, abstained votes)
- Beneficiary - address where the collateral for creating a proposal should be sent.

This creates a transaction spending the proposal UTxO with metadata specifying the “Conclude Proposal” operation and other fields based on the proposal results. The overall result can be either that the proposal passed or failed depending on if the proposal met the participation criteria. The metadata further includes a final tally of the validated votes. The governance tokens collateral is sent to the beneficiary.

Example metadata of a transaction for concluding a proposal

```json
{
  "op": "concludeProposal",
  "id": "7a70f8fe21707a2864bf3597ba73727a834f55d2ec49650871e6d571aec6acaf",
  "result": "PASSED",
  "choices": {
    "choice1": 10,
    "choice2": 20
  },
  "total": 40,
  "abstained": 10,
  "note": "..."
}
```

### Action - Cancel proposal

Action to cancel a proposal in an on-chain transaction. Cancelling a proposal means spending the proposal UTxO that belongs to the DAO wallet.

**Inputs:**

- Proposal txHash
- Cancellation reason
- Beneficiary - address where the collateral for creating a proposal should be sent

This creates a transaction spending the proposal UTxO with metadata specifying the “Cancel Proposal” operation and the reason for cancellation. The governance tokens collateral is sent to the beneficiary.

Example metadata of a proposal cancellation transaction

```json
{
  "op": "cancelProposal",
  "id": "7a70f8fe21707a2864bf3597ba73727a834f55d2ec49650871e6d571aec6acaf",
  "reason": "..."
}
```

## Queries

This library provides well-typed fetchers (queries) for all 6 endpoints exposed by the backend, each as a separate method:

- `/params` - `fetchParams`
- `/protocolParameters` - `fetchProtocolParameters`
- `/theoreticalMaxVotingPower` - `fetchTheoreticalMaxVotingPower`
- `/userVotingDistribution` - `fetchUserVotingDistribution`
- `/proposals` - `fetchProposals`
- `/proposal` - `fetchProposal`
- `/paidFees` - `fetchPaidFees`

## Clients

To simplify the work with queries and actions, the library provides queries and actions clients.

### Queries client

Queries client is an object that can be created by calling `createQueriesClient` with URL to your governance server:

```ts
const queriesClient = createQueriesClient({governanceUrl: 'https://governance.yourapp.com'})
```

The created queries client provides all fetchers (queries) that you can be use to fetch data in your On-Chain DAO Governance. For example querying all proposals would look like this:

```ts
const proposals = await queriesClient.fetchProposals()
```

### Actions client

Actions client is an object that can be created by calling `createActionsClient` with these arguments:

- **networkName**: network for which you want to create the client (either preprod or mainnet)
- **jsApi**: api to users wallet - see the example below for how to create it
- **protocolParameters** - protocol parameters of the Cardano network, can be fetched using the queries client
- **governanceVotingParams** - governance parameters of your On-Chain DAO, can be fetched using the queries client

```ts
const walletConnector = new CborToJsApiWalletConnector(window.cardano.nami, {vendor: 'nami'})
const jsApi = await walletConnector.enableJs()

const governanceVotingParams = await queriesClient.fetchVotingParams()
const protocolParameters = await queriesClient.fetchProtocolParameters()

const actionsClient = await createActionsClient({
  networkName: NetworkName.PREPROD,
  jsApi,
  governanceVotingParams,
  protocolParameters,
})
```

The created actions client provides functions for building all transactions for your On-Chain DAO Governance. For example building a transaction that creates a new proposal would look like this:

```ts
const builtTransaction = actionsClient.buildCreateProposal(...params)
```
