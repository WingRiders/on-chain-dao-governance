import {
  useCancelProposalAction,
  useFinalizeProposalAction,
  useCastVoteAction,
  useSignTxAction,
  useSubmitTxAction,
} from '@wingriders/governance-frontend-react-sdk'
import {useCallback, useState} from 'react'
import {BuildCancelProposalParams, BuildFinalizeProposalParams, Vote} from '@wingriders/governance-sdk'

export type ActionResult = {isSuccess: true; txHash: string} | {isSuccess: false; error: string}

export const useCastVote = () => {
  const [result, setResult] = useState<ActionResult | null>(null)

  const {mutateAsync: buildCastVote, isLoading: isLoadingBuildCastVote} = useCastVoteAction()
  const {mutateAsync: signTx, isLoading: isLoadingSign} = useSignTxAction()
  const {mutateAsync: submitTx, isLoading: isLoadingSubmit} = useSubmitTxAction()

  const castVote = useCallback(
    async (vote: Omit<Vote, 'voterAddress'>) => {
      try {
        const buildTxInfo = await buildCastVote({vote})
        const {cborizedTx, txHash} = await signTx({buildTxInfo})
        await submitTx({cborizedTx})
        setResult({isSuccess: true, txHash})
      } catch (e) {
        console.error(e)
        setResult({isSuccess: false, error: JSON.stringify(e)})
      }
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
    async (params: Pick<BuildCancelProposalParams, 'proposalTxHash' | 'beneficiary' | 'reason'>) => {
      try {
        const buildTxInfo = await buildCancelProposal(params)
        const {cborizedTx, txHash} = await signTx({buildTxInfo})
        await submitTx({cborizedTx})
        setResult({isSuccess: true, txHash})
      } catch (e) {
        console.error(e)
        setResult({isSuccess: false, error: JSON.stringify(e)})
      }
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
    useFinalizeProposalAction()
  const {mutateAsync: signTx, isLoading: isLoadingSign} = useSignTxAction()
  const {mutateAsync: submitTx, isLoading: isLoadingSubmit} = useSubmitTxAction()

  const concludeProposal = useCallback(
    async (params: Pick<BuildFinalizeProposalParams, 'proposalTxHash' | 'results' | 'beneficiary'>) => {
      try {
        const buildTxInfo = await buildConcludeProposal(params)
        const {cborizedTx, txHash} = await signTx({buildTxInfo})
        await submitTx({cborizedTx})
        setResult({isSuccess: true, txHash})
      } catch (e) {
        console.error(e)
        setResult({isSuccess: false, error: JSON.stringify(e)})
      }
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
