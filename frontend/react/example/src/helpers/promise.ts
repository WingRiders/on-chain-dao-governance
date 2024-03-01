import {useReducer, useCallback, useEffect, Reducer, DependencyList} from 'react'

type PromiseReducer<T> = Reducer<
  {
    origin: (() => Promise<T>) | undefined
    data: {value: T} | undefined
    error: {value: unknown} | undefined
  },
  | {type: 'resolved'; payload: {origin: () => Promise<T>; result: T}}
  | {type: 'pending'; payload: {origin: () => Promise<T>}}
  | {type: 'rejected'; payload: {origin: () => Promise<T>; error: unknown}}
>

export const usePromise = <T>(factory: () => Promise<T>, deps: DependencyList) => {
  const [state, dispatch] = useReducer<PromiseReducer<T>>(
    (state, action) => {
      switch (action.type) {
        case 'pending':
          return {origin: action.payload.origin, data: undefined, error: undefined}
        case 'resolved':
          if (state.origin !== action.payload.origin) return state
          return {...state, data: {value: action.payload.result}, error: undefined}
        case 'rejected':
          if (state.origin !== action.payload.origin) return state
          return {...state, data: undefined, error: {value: action.payload.error}}
      }
    },
    {data: undefined, error: undefined, origin: undefined}
  )

  const resolve = useCallback(factory, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const promise = resolve()
    dispatch({type: 'pending', payload: {origin: resolve}})

    // NOTE: assuming the reducer will handle stale state, where origin functions
    // do not match.
    promise
      .then((result) => dispatch({type: 'resolved', payload: {origin: resolve, result}}))
      .catch((error) => dispatch({type: 'rejected', payload: {origin: resolve, error}}))
  }, [resolve])

  const stale = resolve !== state.origin // means the effect hasn't run for this factory yet
  const {data, error} = stale ? {data: undefined, error: undefined} : state

  return {
    currentData: data?.value, // naming based on rtk query (currentData is reset with new request)
    error: error?.value,
    isSuccess: !!data,
    isError: !!error,
    isLoading: !data && !error, // for UI
    isResolving: !!state.origin && !state.data && !state.error, // actually reflects whether a promise is being resolved
  }
}
