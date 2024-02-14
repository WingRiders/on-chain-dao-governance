import {
  useCastVoteAction,
  useSignTxAction,
  useSubmitTxAction,
} from '@wingriders/governance-frontend-react-sdk'
import {useCallback, useState} from 'react'
import {Vote} from '@wingriders/governance-sdk'

type ActionResult = {isSuccess: true; txHash: string} | {isSuccess: false; error: string}

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
