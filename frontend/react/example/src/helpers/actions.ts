import {
  useCancelProposalAction,
  useConcludeProposalAction,
  useCastVoteAction,
  useSignTxAction,
  useSubmitTxAction,
  useCreateProposalAction,
} from '@wingriders/governance-frontend-react-sdk'
import {useCallback, useState} from 'react'
import {
  BuildCancelProposalParams,
  BuildCreateProposalParams,
  BuildConcludeProposalParams,
  Vote,
} from '@wingriders/governance-sdk'

export type ActionResult = {isSuccess: true; txHash: string} | {isSuccess: false; error: string}

export const useCreateProposal = () => {
  const [result, setResult] = useState<ActionResult | null>(null)

  const {mutateAsync: buildCreateProposalVote, isLoading: isLoadingBuildCreateProposal} =
    useCreateProposalAction()
  const {mutateAsync: signTx, isLoading: isLoadingSign} = useSignTxAction()
  const {mutateAsync: submitTx, isLoading: isLoadingSubmit} = useSubmitTxAction()

  const createProposal = useCallback(
    async (params: Pick<BuildCreateProposalParams, 'proposal' | 'poll'>) => {
      let result: ActionResult
      try {
        const buildTxInfo = await buildCreateProposalVote(params)
        const {cborizedTx, txHash} = await signTx({buildTxInfo})
        await submitTx({cborizedTx})
        result = {isSuccess: true, txHash}
      } catch (e) {
        console.error(e)
        result = {isSuccess: false, error: JSON.stringify(e)}
      }

      setResult(result)
      return result
    },
    [buildCreateProposalVote, signTx, submitTx]
  )

  const isLoading = isLoadingBuildCreateProposal || isLoadingSign || isLoadingSubmit

  return {
    createProposal,
    isLoading,
    result,
    setResult,
  }
}

export const useCastVote = () => {
  const [result, setResult] = useState<ActionResult | null>(null)

  const {mutateAsync: buildCastVote, isLoading: isLoadingBuildCastVote} = useCastVoteAction()
  const {mutateAsync: signTx, isLoading: isLoadingSign} = useSignTxAction()
  const {mutateAsync: submitTx, isLoading: isLoadingSubmit} = useSubmitTxAction()

  const castVote = useCallback(
    async (vote: Omit<Vote, 'voterAddress'>) => {
      let result: ActionResult
      try {
        const buildTxInfo = await buildCastVote({vote})
        const {cborizedTx, txHash} = await signTx({buildTxInfo})
        await submitTx({cborizedTx})
        result = {isSuccess: true, txHash}
      } catch (e) {
        console.error(e)
        result = {isSuccess: false, error: JSON.stringify(e)}
      }

      setResult(result)
      return result
    },
    [buildCastVote, signTx, submitTx]
  )

  const isLoading = isLoadingBuildCastVote || isLoadingSign || isLoadingSubmit

  return {
    castVote,
    isLoading,
    result,
    setResult,
  }
}

export const useCancelProposal = () => {
  const [result, setResult] = useState<ActionResult | null>(null)

  const {mutateAsync: buildCancelProposal, isLoading: isLoadingBuildCancelProposal} =
    useCancelProposalAction()
  const {mutateAsync: signTx, isLoading: isLoadingSign} = useSignTxAction()
  const {mutateAsync: submitTx, isLoading: isLoadingSubmit} = useSubmitTxAction()

  const cancelProposal = useCallback(
    async (params: Pick<BuildCancelProposalParams, 'proposalTxRef' | 'beneficiary' | 'reason'>) => {
      let result: ActionResult
      try {
        const buildTxInfo = await buildCancelProposal(params)
        const {cborizedTx, txHash} = await signTx({buildTxInfo})
        await submitTx({cborizedTx})
        result = {isSuccess: true, txHash}
      } catch (e) {
        console.error(e)
        result = {isSuccess: false, error: JSON.stringify(e)}
      }

      setResult(result)
      return result
    },
    [buildCancelProposal, signTx, submitTx]
  )

  const isLoading = isLoadingBuildCancelProposal || isLoadingSign || isLoadingSubmit

  return {
    cancelProposal,
    isLoading,
    result,
    setResult,
  }
}

export const useConcludeProposal = () => {
  const [result, setResult] = useState<ActionResult | null>(null)

  const {mutateAsync: buildConcludeProposal, isLoading: isLoadingBuildConcludeProposal} =
    useConcludeProposalAction()
  const {mutateAsync: signTx, isLoading: isLoadingSign} = useSignTxAction()
  const {mutateAsync: submitTx, isLoading: isLoadingSubmit} = useSubmitTxAction()

  const concludeProposal = useCallback(
    async (params: Pick<BuildConcludeProposalParams, 'proposalTxRef' | 'results' | 'beneficiary'>) => {
      let result: ActionResult
      try {
        const buildTxInfo = await buildConcludeProposal(params)
        const {cborizedTx, txHash} = await signTx({buildTxInfo})
        await submitTx({cborizedTx})
        result = {isSuccess: true, txHash}
      } catch (e) {
        console.error(e)
        result = {isSuccess: false, error: JSON.stringify(e)}
      }

      setResult(result)
      return result
    },
    [buildConcludeProposal, signTx, submitTx]
  )

  const isLoading = isLoadingBuildConcludeProposal || isLoadingSign || isLoadingSubmit

  return {
    concludeProposal,
    isLoading,
    result,
    setResult,
  }
}
