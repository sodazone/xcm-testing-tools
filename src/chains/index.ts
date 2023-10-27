import { ApiPromise, WsProvider } from '@polkadot/api';

import { NetworkConfig } from '../types.js';
import log from '../cli/log.js';

const DEFAULT_TOKEN_DECIMALS = 12;
const DEFAULT_SS58_PREFIX = 42;

export class Chain {
  id: number;
  api: ApiPromise;
  name: string;
  ss58Prefix: number;
  tokenDecimals: number;
  accountNonce: Record<string, number>;

  constructor(
    id: number,
    api: ApiPromise
  ) {
    this.id = id;
    this.api = api;
    this.name = 'Default Testnet';
    this.ss58Prefix = DEFAULT_SS58_PREFIX;
    this.tokenDecimals = DEFAULT_TOKEN_DECIMALS;
    this.accountNonce = {};
  }

  async init() {
    const name = await this.api.rpc.system.chain();
    const props = await this.api.registry.getChainProperties();
    const decimals = props?.tokenDecimals.unwrapOrDefault();
    const ss58Format = props?.ss58Format.unwrapOrDefault();

    this.name = name.toString();
    this.tokenDecimals = decimals && decimals[0] ? decimals[0].toNumber() : DEFAULT_TOKEN_DECIMALS;
    this.ss58Prefix = ss58Format ? ss58Format.toNumber() : DEFAULT_SS58_PREFIX;
    log.ok(`${this.name} (ID: ${this.id}) initialized.`);
  }

  async getNonceFromChain(address: string) {
    const { nonce } = await this.api.query.system.account(address);
    return nonce.toNumber();
  }

  async getNonce(address: string) {
    if (!this.accountNonce[address]) {
      this.accountNonce[address] = await this.getNonceFromChain(address);
    }
    return this.accountNonce[address];
  }

  async incrementGetNonce(address: string) {
    if (!this.accountNonce[address]) {
      this.accountNonce[address] = await this.getNonceFromChain(address);
    } else {
      this.accountNonce[address] += 1;
    }
    return this.accountNonce[address];
  }
}

export class Chains {
  chains: Chain[];

  constructor() {
    this.chains = [];
  }

  get relaychain() {
    const relay = this.chains.find(c => c.id === 0);
    if (!relay) {
      throw new Error('Relay chain not found!');
    }
    return relay;
  }

  get parachains() {
    return this.chains.filter(c => c.id !== 0);
  }

  async addNetworks(configs: NetworkConfig[]) {
    for (const config of configs) {
      await this.addNetwork(config);
    }
  }

  async addNetwork(config: NetworkConfig) {
    const { id, ws } = config;
    // Connect to network
    const api = new ApiPromise({
      provider: new WsProvider(ws),
      noInitWarn: true,
    });
    await api.isReady;

    const chain = new Chain(id, api);
    await chain.init();
    this.chains.push(chain);
  }

  getChain(id: number) {
    const chain = this.chains.find(c => c.id === id);
    if (!chain) {
      throw new Error(`Chain properties not found for chain ID ${id}`);
    }
    return chain;
  }
}
