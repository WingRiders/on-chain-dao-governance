declare module 'cardano-crypto.js' {
  export enum AddressTypes {
    BASE = 0b0000,
    BASE_SCRIPT_KEY = 0b0001,
    BASE_KEY_SCRIPT = 0b0010,
    BASE_SCRIPT_SCRIPT = 0b0011,
    POINTER = 0b0100,
    POINTER_SCRIPT = 0b0101,
    ENTERPRISE = 0b0110,
    ENTERPRISE_SCRIPT = 0b0111,
    BOOTSTRAP = 0b1000,
    REWARD = 0b1110,
    REWARD_SCRIPT = 0b1111,
  }

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
