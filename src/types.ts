import type { KeyringPair } from '@polkadot/keyring/types';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { ISubmittableResult } from '@polkadot/types/types';

import { Chain, Chains } from './chains/index.js';

export type XCMRegistryJunction = {
	[x: string]: string | number | undefined | null | Partial<Record<string, string | number | undefined | null>>;
};
export type XCMRegistryJunctions = {
	[x: string]: string | number | undefined | null | Partial<Record<string, string | number | undefined | null>>;
}[];

export type InterMultiLocationJunctionType = 'Here' | 'X1' | 'X2' | 'X3' | 'X4' | 'X5' | 'X6' | 'X7' | 'X8';
type XCMRegistryInteriorMultiLocation = Partial<
	Record<InterMultiLocationJunctionType, null | XCMRegistryJunction | XCMRegistryJunctions>
>;

export interface XCMMultiLocation {
	parents: number;
	interior: XCMRegistryInteriorMultiLocation;
}

export type AssetConfig = {
  id: number;
    name: string;
    symbol: string;
    location: number;
    decimals: number;
    minBalance: number;
    isSufficient: boolean;
    assetMultiLocation: XCMMultiLocation;
}

export type NetworkConfig = {
  id: number;
  ws: string;
}

export type HrmpChannelConfig = {
  sender: number;
  recipient: number;
  maxCapacity: number;
  maxMessageSize: number;
}

export type Config = {
  networks: NetworkConfig[];
  channels: HrmpChannelConfig[];
  assets: AssetConfig[];
  xcAssets: AssetConfig[];
}

export class TxResult {
  xcmErrors: string[] = [];
  extrinsicError: string | undefined;

  constructor(extrinsicErrorMessage: string | undefined) {
    this.extrinsicError = extrinsicErrorMessage;
  }

  addXcmError(error: string) {
    this.xcmErrors.push(error);
  }

  get hasXcmErrors() : boolean {
    return this.xcmErrors.length > 0;
  }

  get hasErrors() : boolean {
    return this.extrinsicError !== undefined || this.hasXcmErrors;
  }
}

export type TxError = {
  extrinsicError?: string,
  xcmError?: string
}

export type SubmittableTx = SubmittableExtrinsic<'promise', ISubmittableResult>;

export type AckCallback = (result: TxResult) => void | Promise<void>;

export type AssetCallArgs = {
  chain: Chain,
  owner: KeyringPair,
  asset: AssetConfig,
  ack: AckCallback
}

export type ForceCallArgs = {
  chain: Chain,
  asset: AssetConfig,
}

export type MultiChainExtrinsicArgs = {
  chains: Chains,
  signer: KeyringPair,
  ack: AckCallback
}

export type ExtrinsicArgs = {
  chain: Chain,
  signer: KeyringPair,
  ack: AckCallback
}
