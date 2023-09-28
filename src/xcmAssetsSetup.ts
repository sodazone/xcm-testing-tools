#!/usr/bin/env ts-node

import '@polkadot/api-augment';

import { EventEmitter } from 'node:events';

import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import chalk from 'chalk';

import {
  forceCreateAsset,
  mintAsset,
  createXcAsset,
  forceRegisterXcAsset,
  fundRelaySovereignAccounts,
  fundSiblingSovereignAccounts
} from './calls/index.js';

import { Chains } from './chains.js';
import { Executor } from './executor.js';

import config from './config.json' assert { type: 'json' };

const eventEmitter = new EventEmitter();

async function main() {
  // Initiate Alice keyring
  // We'll use Alice to make all subsequent calls
  await cryptoWaitReady();

  const keyring = new Keyring({ type: 'sr25519' });
  const alice = keyring.addFromUri('//Alice');

  const chains = new Chains();
  await chains.addNetworks(config.networks);

  const executor = new Executor(eventEmitter);

  for (const asset of config.assets) {
    const chain = chains.getChain(asset.location);
    if (chain.api.tx.assets) {
      executor
        .enqueue(forceCreateAsset, [chain, chains.relaychain, alice, asset])
        .enqueue(mintAsset, [chain, alice, asset]);
    } else {
      throw new Error('Asset creation pallet not supported');
    }
  }

  for (const xcAsset of config.xcAssets) {
    const chain = chains.getChain(xcAsset.location);
    if (chain.api.tx.assetRegistry) {
      executor
        .enqueue(createXcAsset, [chain, alice, xcAsset])
        .enqueue(forceRegisterXcAsset, [chain, chains.relaychain, alice, xcAsset]);
    } else {
      throw new Error('XC asset registration pallet not supported');
    }
  }

  executor
    .enqueue(fundRelaySovereignAccounts, [chains, alice])
    .enqueue(fundSiblingSovereignAccounts, [chains, alice]);

  executor.execute();
}

main()
  .catch(console.error)
  .finally(async () => {
    eventEmitter.on('done', (errorMessage: string) => {
      if (errorMessage) {
        console.log(chalk.red(`Error while executing: ${errorMessage}.`));
      }
      console.log(chalk.yellow('Set up finished. Exiting...'));
      process.exit();
    });

    eventEmitter.on('error', (errorMessage: string) => {
      console.log(chalk.red(`Error while executing: ${errorMessage}. Aborting execution.`));
      process.exit();
    });
  });

