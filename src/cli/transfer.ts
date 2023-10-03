#!/usr/bin/env ts-node

import { EventEmitter } from 'node:events';

import { program } from 'commander';

import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { AssetTransferApi, constructApiPromise, TxResult } from '@substrate/asset-transfer-api';

import log from './log.js';
import { txCallback } from '../utils/index.js';

type CliArgs = {
  url: string,
  seed: string,
  dest: string,
  recipient: string,
  assets: string[],
  amounts: string[],
  xcmVersion?: number
}

const eventEmitter = new EventEmitter();

const main = async ({
  url,
  seed,
  dest,
  recipient,
  assets,
  amounts,
  xcmVersion
} : CliArgs) => {
  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519' });
  const signer = keyring.addFromUri(seed);

  log.info(`Initializing API with ${url}`);

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
        xcmVersion: xcmVersion || safeXcmVersion,
      }
    );

    log.info(`The following call data that is returned:\n${JSON.stringify(submittableTx, null, 4)}`);
  } catch (e) {
    console.error(e);
    throw Error(e as string);
  }

  await submittableTx.tx.signAndSend(signer, txCallback(api, 'txFinalized', eventEmitter));
};

program.name('transfer')
  .description('Transfer XCM assets.')
  .version('0.0.1')
  .option('-s, --seed <seed>', 'private account seed', '//Alice')
  .requiredOption('-d, --dest <dest>', 'destination chain id')
  .requiredOption('-r, --recipient <recipient>', 'recipient account address')
  .requiredOption('-a, --assets <assets...>', 'asset ids')
  .requiredOption('-m, --amounts <amounts...>', 'asset amounts')
  .option('-x, -xcm-version <xcmVersion>', 'XCM version', '3')
  .argument('<url>', 'RPC endpoint URL')
  .addHelpText('after', `

  Example call:
    $ transfer ws://127.0.0.1:9944 -s //Alice -d 2000 -r 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY -a 1984 -m 1500000000000`
  );

program.parse();

main({
  ...program.opts(),
  url: program.args[0]
}).finally(() => {
  eventEmitter.on('txFinalized', (errorMessage?: string, polkadotXcmError?: string) => {
    if (polkadotXcmError) {
      log.error('Error in XCM execution:', polkadotXcmError);
    }
    if (errorMessage) {
      log.error('Error in extrinsic:', errorMessage);
    } else {
      log.ok('Extrinsic success');
    }
    log.info('\nTransfer finalized, exiting script...');
    process.exit();
  });
});