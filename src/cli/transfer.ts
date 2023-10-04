#!/usr/bin/env ts-node

import { program } from 'commander';

import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { AssetTransferApi, constructApiPromise, TxResult } from '@substrate/asset-transfer-api';

import log from './log.js';
import { txStatusCallback } from '../utils/index.js';

type CliArgs = {
  url: string,
  seed: string,
  dest: string,
  recipient: string,
  assets: string[],
  amounts: string[],
  xcmVersion?: number
}

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

    log.info(
      'The following call data that is returned:',
      JSON.stringify(submittableTx, null, 2)
    );
  } catch (e) {
    console.error(e);
    throw Error(e as string);
  }

  await submittableTx.tx.signAndSend(signer, txStatusCallback(api, result => {
    if (result.hasErrors) {
      process.exit(1);
    } else {
      log.ok('OK');
      process.exit(0);
    }
  }));
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
});