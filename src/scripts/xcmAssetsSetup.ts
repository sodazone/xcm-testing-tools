#!/usr/bin/env ts-node

import { EventEmitter } from 'node:events';
import path from 'node:path';
import { readFileSync } from 'node:fs';

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

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
} from '../calls/index.js';

import { Chains } from '../chains/index.js';
import { Executor } from '../executor/index.js';
import { Config } from '../types.js';

const eventEmitter = new EventEmitter();

async function main({ configPath, seed }: {configPath: string, seed: string}) {
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
        .enqueue(forceRegisterXcAsset, [chain, chains.relaychain, signer, xcAsset]);
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

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .example(
    '$0 -p ./config.json -s //Alice',
    'Sets up assets and sovereign accounts on networks defined in the configuration file using Alice account'
  )
  .option('p', {
    type: 'string',
    alias: 'path',
    describe: 'The path to the configuration file.',
    coerce: p => path.resolve(p),
    demandOption: true,
    requiresArg: true
  })
  .option('s', {
    type: 'string',
    alias: 'seed',
    describe: 'The account seed to use for making transactions.',
    default: '//Alice',
  })
  .help('h')
  .alias('h', 'help')
  .scriptName('xcm-setup')
  .argv as any;

main({
  configPath: argv.path,
  seed: argv.seed
})
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
      console.log(chalk.red(`Error while executing: ${errorMessage}. Aborting subsequent transactions execution.`));
      process.exit();
    });
  });

