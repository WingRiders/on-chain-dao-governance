type PaginatedFetchFnArgs = {
  lastSeenTxo?: string
  limit?: number
}

type PaginatedFetchFnRes = {
  lastSeenTxo?: string
}

type PaginatedFetchFn<TArgs extends PaginatedFetchFnArgs, TRes extends PaginatedFetchFnRes> = (
  args: TArgs
) => Promise<TRes>

export const fetchAllPaginatedData =
  <TItem, TArgs extends PaginatedFetchFnArgs, TRes extends PaginatedFetchFnRes>(
    fetchFunction: PaginatedFetchFn<TArgs, TRes>,
    itemsExtractor: (res: TRes) => TItem[]
  ): ((args?: TArgs) => Promise<TItem[]>) =>
  async (args?: TArgs) => {
    const data: TItem[] = []
    const LIMIT = 500
    let lastSeenTxo: string | undefined

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const res = await fetchFunction({
        lastSeenTxo,
        limit: LIMIT,
        ...(args ?? ({} as TArgs)),
      })
      const newData = itemsExtractor(res)
      data.push(...newData)
      if (newData.length < LIMIT) {
        break
      }
      lastSeenTxo = res.lastSeenTxo
    }

    return data
  }
