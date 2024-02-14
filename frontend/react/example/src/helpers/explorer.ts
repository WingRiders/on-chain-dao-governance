const EXPLORER_BASE_URL = 'https://preprod.cardanoscan.io'

export const getExplorerAddressUrl = (address: string) => `${EXPLORER_BASE_URL}/address/${address}`
