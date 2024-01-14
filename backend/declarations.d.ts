declare module 'cardano-crypto.js' {
  export enum BaseAddressTypes {
    BASE = 0b00,
    SCRIPT_KEY = 0b01,
    KEY_SCRIPT = 0b10,
    SCRIPT_SCRIPT = 0b11,
  }

  export function packBaseAddress(
    spendingHash: Buffer /* either a pubkey hash or script hash */,
    stakingKey: Buffer /* either a pubkey hash or script hash */,
    networkId: number,
    type: BaseAddressTypes = BaseAddressTypes.BASE
  ): Buffer

  export function packEnterpriseAddress(
    spendingHash: Buffer /* either a pubkey hash or a script hash */,
    networkId: number,
    isScript?: boolean
  ): Buffer

  export function _sha3_256(input: Buffer): Buffer
}
