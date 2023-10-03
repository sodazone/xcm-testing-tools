#!/usr/bin/env ts-node

import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';

import { program } from 'commander';

import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import {
  forceCreateAsset,
  mintAsset,
  createXcAsset,
  fundRelaySovereignAccounts,
  fundSiblingSovereignAccounts,
  forceRegisterAssetLocation,
  forceRegisterReserveAsset
} from '../calls/index.js';

import log from './log.js';
import { Chains } from '../chains/index.js';
import { Executor } from '../executor/index.js';
import { Config } from '../types.js';

type CliArgs = {
  configPath: string
  seed: string
}

const eventEmitter = new EventEmitter();

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

  const executor = new Executor(eventEmitter);

  // Create and mint assets on their native chains
  for (const asset of config.assets) {
    const chain = chains.getChain(asset.location);
    if (chain.api.tx.assets) {
      executor
        .enqueue(forceCreateAsset, [chain, chains.relaychain, signer, asset])
        .enqueue(mintAsset, [chain, signer, asset]);
    } else {
      throw new Error('Asset creation pallet not supported');
    }
  }

  // Register cross-chain assets
  for (const xcAsset of config.xcAssets) {
    const chain = chains.getChain(xcAsset.location);
    if (chain.api.tx.assetRegistry) {
      executor
        .enqueue(createXcAsset, [chain, signer, xcAsset])
        .enqueue(forceRegisterReserveAsset, [chain, chains.relaychain, signer, xcAsset]);
    } else if (chain.api.tx.xcAssetConfig) {
      executor
        .enqueue(createXcAsset, [chain, signer, xcAsset])
        .enqueue(forceRegisterAssetLocation, [chain, chains.relaychain, signer, xcAsset]);
    } else {
      throw new Error('XC asset registration pallet not supported');
    }
  }

  // Fund sovereign accounts
  executor
    .enqueue(fundRelaySovereignAccounts, [chains, signer])
    .enqueue(fundSiblingSovereignAccounts, [chains, signer]);

  executor.execute();
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
}).catch(console.error)
  .finally(async () => {
    eventEmitter.on('done', (errorMessage: string) => {
      if (errorMessage) {
        log.error(`Error while executing: ${errorMessage}.`);
      }
      log.info('Set up finished. Exiting...');
      process.exit(0);
    });

    eventEmitter.on('error', (errorMessage: string) => {
      log.error(`Error while executing: ${errorMessage}. Aborting subsequent transactions execution.`);
      process.exit(1);
    });
  });

