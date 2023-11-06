#!/usr/bin/env node

import { readFileSync } from 'node:fs';

import { program } from 'commander';

import type { KeyringPair } from '@polkadot/keyring/types';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import {
  forceCreateAsset,
  mintAsset,
  createXcAsset,
  fundRelaySovereignAccounts,
  fundSiblingSovereignAccounts,
  forceRegisterAssetLocation,
  forceRegisterReserveAsset,
  forceSetAssetsUnitPerSecond
} from '../calls/index.js';

import log from './log.js';

import { Chains } from '../chains/index.js';
import { Executor } from '../executor/index.js';
import { AckCallback, AssetCallArgs, AssetCallParaArgs, AssetConfig, Config } from '../types.js';

type CliArgs = {
  configPath: string
  seed: string
}

function prepareArgs(
  chains: Chains,
  asset: AssetConfig,
  owner: KeyringPair,
  ack: AckCallback
) {
  const chain = chains.getChain(asset.location);
  const callArgs : AssetCallArgs = {
    chain, owner, asset, ack
  };
  const callParaArgs: AssetCallParaArgs = {
    relaychain: chains.relaychain,
    parachain: chain,
    owner,
    asset,
    ack
  };

  return { chain, callArgs, callParaArgs };
}

async function main({ configPath, seed }: CliArgs) {
  // Parse config
  const c = readFileSync(configPath).toString();
  const config: Config = JSON.parse(c);

  // Set up signer account
  await cryptoWaitReady();

  const keyring = new Keyring({ type: 'sr25519' });
  const signer = keyring.addFromUri(seed);

  const chains = new Chains();
  await chains.addNetworks(config.networks);

  const executor = new Executor();

  // Create and mint assets on their native chains
  for (const asset of config.assets) {
    const {
      chain, callArgs, callParaArgs
    } = prepareArgs(chains, asset, signer, executor.ack);

    if (chain.api.tx.assets) {
      executor
        .push(() => forceCreateAsset(callParaArgs))
        .push(() => mintAsset(callArgs));
    } else {
      throw new Error('Asset creation pallet not supported');
    }
  }

  // Register cross-chain assets
  for (const asset of config.xcAssets) {
    const {
      chain, callArgs, callParaArgs
    } = prepareArgs(chains, asset, signer, executor.ack);

    if (chain.api.tx.assetRegistry) {
      executor
        .push(() => createXcAsset(callArgs))
        .push(() => forceRegisterReserveAsset(callParaArgs));
    } else if (chain.api.tx.xcAssetConfig) {
      executor
        .push(() => createXcAsset(callArgs))
        .push(() => forceRegisterAssetLocation(callParaArgs))
        .push(() => forceSetAssetsUnitPerSecond(callParaArgs));
    } else {
      throw new Error('Asset registration pallet not supported');
    }
  }

  // Fund sovereign accounts
  const callArgs = { chains, signer, ack: executor.ack };
  executor
    .push(() => fundRelaySovereignAccounts(callArgs))
    .push(() => fundSiblingSovereignAccounts(callArgs));

  await executor.execute(() => {
    log.ok('✨ All done! ✨');
    process.exit(0);
  });
}

program.name('assets')
  .description('Setup XCM assets')
  .version('0.0.1')
  .option('-s, --seed <seed>', 'private seed', '//Alice')
  .argument('<configPath>', 'assets configuration file');

program.parse();

main({
  ...program.opts(),
  configPath: program.args[0]
}).catch(log.error);

