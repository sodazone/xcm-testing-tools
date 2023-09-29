#!/usr/bin/env ts-node

import { EventEmitter } from 'node:events';

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { AssetTransferApi, constructApiPromise, TxResult } from '@substrate/asset-transfer-api';

import { txCallback } from '../utils/index.js';

const eventEmitter = new EventEmitter();

const main = async ({
  url,
  seed,
  dest,
  recipient,
  assets,
  amounts,
  version
} : {
  url: string,
  seed: string,
  dest: string,
  recipient: string,
  assets: string[],
  amounts: string[],
  version?: number
}) => {
  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519' });
  const signer = keyring.addFromUri(seed);

  console.log(chalk.yellow(`Initializing API with ${url}`));
  const { api, specName, safeXcmVersion } = await constructApiPromise(url);
  const assetApi = new AssetTransferApi(api, specName, safeXcmVersion);

  let submittableTx: TxResult<'submittable'>;
  try {
    submittableTx = await assetApi.createTransferTransaction(
      dest,
      recipient,
      assets,
      amounts,
      {
        format: 'submittable',
        isLimited: true,
        xcmVersion: version || safeXcmVersion,
      }
    );

    console.log(
      chalk.magenta(`The following call data that is returned:\n${JSON.stringify(submittableTx, null, 4)}`)
    );
  } catch (e) {
    console.error(e);
    throw Error(e as string);
  }

  await submittableTx.tx.signAndSend(signer, txCallback(api, 'txFinalized', eventEmitter));
};

const argv = yargs(hideBin(process.argv))
  .command('Usage: $0 <url> [options]', 'Transfer assets', (args) => {
    args.positional('url', {
      describe: 'The RPC endpoint URL',
      type: 'string'
    });
  })
  .example(
    '$0 ws://127.0.0.1:9944 -s //Alice -d 2000 -r 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY -a 1984 -m 1500000000000',
    'Connects to network and transfers 1500000000000 units of asset with ID 1984 to recipient account on parachain 2000.'
  )
  .option('seed', {
    type: 'string',
    alias: 's',
    describe: 'The account seed to use for making transactions',
    default: '//Alice',
  })
  .option('dest', {
    type: 'string',
    alias: 'd',
    describe: 'ID of the destination chain',
    requiresArg: true,
  })
  .option('recipient', {
    type: 'string',
    alias: 'r',
    describe: 'Address of recipient account',
    requiresArg: true,
  })
  .option('assets', {
    type: 'string',
    alias: 'a',
    describe: 'Array of assetId\'s to be transferred',
    requiresArg: true,
    array: true
  })
  .option('amounts', {
    type: 'string',
    alias: 'm',
    describe: 'Array of the amounts of each token to transfer',
    requiresArg: true,
    array: true
  })
  .option('xcmVersion', {
    type: 'number',
    alias: 'v',
    describe: 'XCM version to use',
  })
  .help('h')
  .alias('h', 'help')
  .scriptName('transfer')
  .argv as any;

main({
  url: argv._[0],
  seed: argv.seed,
  dest: argv.dest,
  recipient: argv.recipient,
  assets: argv.assets,
  amounts: argv.amounts,
  version: argv.version
}).finally(() => {
  eventEmitter.on('txFinalized', (errorMessage?: string, polkadotXcmError?: string) => {
    if (polkadotXcmError) {
      console.log(chalk.red('Error in XCM execution:', polkadotXcmError));
    }
    if (errorMessage) {
      console.log(chalk.red('Error in extrinsic:', errorMessage));
    } else {
      console.log(chalk.green('Extrinsic success'));
    }
    console.log(chalk.yellow('\nTransfer finalized, exiting script...'));
    process.exit();
  });
});
