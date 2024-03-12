# React SDK for Open-Source On-Chain DAO Governance

This package provides a set of helper functions and components that can be used in a frontend React application for the Open-Source On-Chain DAO Governance.

The main functionality of this package includes:

- Context provider for clients that are used to fetch data and create blockchain transactions
- Set of hooks for data fetching
- Set of hooks for creating blockchain transactions

Look at our [example application](https://github.com/WingRiders/on-chain-dao-governance/tree/main/frontend/react/example) which is an example implementation of frontend for On-Chain DAO Governance that uses this package.

## Installation

```bash
yarn add @wingriders/cab
yarn add @wingriders/governance-sdk
yarn add @wingriders/governance-frontend-react-sdk
```

## Setup

### 1. Create queries client

Create a queries client which will be used to fetch data. Pass in the url to your governance backend server:

```ts
import {createQueriesClient} from '@wingriders/governance-sdk'

const queriesClient = createQueriesClient({
  governanceUrl: 'https://api.governance.exampleapp.com', // pass in your URL
})
```

The queries client should be created only once so you can call this on a global level in one of your root components.

### 2. Create actions client

Actions client is used to create actions (mutations) for blockchain transactions, for example creating a proposal or casting a vote. As these actions are dependant on users wallet, you should create an action client once user connects a wallet to your site.

```ts
import {CborToJsApiWalletConnector} from '@wingriders/cab/wallet/connector'
import {createActionsClient} from '@wingriders/governance-sdk'

const walletConnector = new CborToJsApiWalletConnector(window.cardano.nami, {vendor: null}) // choose wallet based on users connected wallet type
const jsApi = await walletConnector.enableJs()

const actionsClient = await createActionsClient({
  networkName: NetworkName.PREPROD, // set your network
  jsApi,
  governanceVotingParams,
  protocolParameters,
})
```

`governanceVotingParams` and `protocolParameters` can be fetched using the queries client, see [Fetching data](#fetching-data).

### 3. Wrap you application in `<DaoGovernanceProvider />`

Once you create your queries and actions clients, you should pass them to `<DaoGovernanceProvider />` which should wrap your entire application:

```tsx
const App = () => {
  return (
    <DaoGovernanceProvider queriesClient={queriesClient} actionsClient={actionsClient}>
      ...your app
    </DaoGovernanceProvider>
  )
}
```

Not that `actionsClient` is optional and should be passed in only if the user has his wallet connected to your site.

## Usage

Once you complete the setup steps, you will be able to use the following hooks for fetching data and creating actions.

### Fetching data

Every endpoint that is provided by the governance server, has it's own _useQuery_ hook that can be used to fetch data from that endpoint. For example, fetching all proposals would look like this:

```tsx
import {useProposalsQuery} from '@wingriders/governance-frontend-react-sdk'

const Proposals = () => {
  const {data, isLoading, isError} = useProposalsQuery()

  return <div>{data?.map((proposal) => <div>...render proposals</div>)}</div>
}
```

Here is the list of query hooks that is available in `@wingriders/governance-frontend-react-sdk`:
|query hook|corresponding backend endpoint|
|---|---|
|useActiveProposalsCountQuery|/activeProposalsCount|
|useProposalsQuery|/proposals|
|useProposalQuery|/proposal|
|useTheoreticalMaxVotingPowerQuery|/theoreticalMaxVotingPower|
|useUserVotableProposalsCountPowerQuery|/userVotableProposalsCount|
|useUserVotesQuery|/userVotes|
|useUserVotingDistributionQuery|/userVotingDistribution|
|useVotesQuery|/votes|
|useVotingParamsQuery|/params|
|useProtocolParametersQuery|/protocolParameters|
|usePaidFeesQuery|/paidFees|

### Creating actions

Every blockchain transaction that can be created in the On-Chain DAO Governance has its own _useAction_ hook. For example creating a new proposal would look like this:

```tsx
import {
  useCreateProposalAction,
  useSignTxAction,
  useSubmitTxAction,
} from '@wingriders/governance-frontend-react-sdk'

const CreateProposal = () => {
  const {mutateAsync: createProposal, isLoading: isLoadingCreate} = useCreateProposalAction()
  const {mutateAsync: signTx, isLoading: isLoadingSign} = useSignTxAction()
  const {mutateAsync: submitTx, isLoading: isLoadingSubmit} = useSubmitTxAction()

  const handleCreateProposal = async () => {
    try {
      const buildTxInfo = await createProposal({
        ...proposal parameters
      })
      // sign the built transaction
      const {cborizedTx, txHash} = await signTx({buildTxInfo})
      // submit the signed transaction
      await submitTx({cborizedTx})
    } catch (e) {
      console.error(e)
    }
}
```

Here is the list of actions hooks that is available in `@wingriders/governance-frontend-react-sdk`:
|action hook|corresponding SDK action|
|---|---|
|useCancelProposalAction|buildCancelProposalAction|
|useCastVoteAction|buildCastVoteAction|
|useCreateProposalAction|buildCreateProposalAction|
|useConcludeProposalAction|buildConcludeProposalAction|
|useSignTxAction|signTxAction|
|useSubmitTxAction|submitTxAction|
