#!/usr/bin/env node

import { readFileSync } from 'node:fs';

import { program } from 'commander';

import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { AssetTransferApi, constructApiPromise, TxResult, AssetTransferApiOpts } from '@substrate/asset-transfer-api';

import log from './log.js';
import { txStatusCallback } from '../utils/index.js';
import { ApiPromise } from '@polkadot/api';

type CliArgs = {
  url: string,
  seed: string,
  dest: string,
  recipients: string[],
  assets: string[],
  amounts: string[],
  xcmVersion?: number,
  assetRegistry?: string
}

function txCallback(api: ApiPromise) {
  return txStatusCallback(api, result => {
    if (result.hasErrors) {
      process.exit(1);
    } else {
      log.ok('OK');
      process.exit(0);
    }
  });
}

const main = async ({
  url,
  seed,
  dest,
  recipients,
  assets,
  amounts,
  xcmVersion,
  assetRegistry
} : CliArgs) => {
  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519' });
  const signer = keyring.addFromUri(seed);

  log.info(`Initializing API with ${url}`);

  const { api, specName, safeXcmVersion } = await constructApiPromise(url);

  const opts: AssetTransferApiOpts = {};

  if (assetRegistry) {
    const c = readFileSync(assetRegistry).toString();
    opts.injectedRegistry = JSON.parse(c);
    log.info(`Injecting registry: ${c}`);
  }

  const assetApi = new AssetTransferApi(api, specName, safeXcmVersion, opts);

  const submittableTxs: TxResult<'submittable'>[] = [];

  for (const r of recipients) {
    try {
      submittableTxs.push(await assetApi.createTransferTransaction(
        dest,
        r,
        assets,
        amounts,
        {
          format: 'submittable',
          isLimited: true,
          xcmVersion: xcmVersion || safeXcmVersion,
        }
      ));
    } catch (e) {
      console.error(e);
      throw Error(e as string);
    }
  }

  log.info(
    'Call data:',
    JSON.stringify(submittableTxs, null, 2)
  );

  if (submittableTxs.length === 0) {
    log.info('No submittable extrinsics to send. Exiting.');
    process.exit(0);
  } else if (submittableTxs.length === 1) {
    await submittableTxs[0].tx.signAndSend(signer, txCallback(api));
  } else {
    const txs = submittableTxs.map(s => s.tx);
    const batch = api.tx.utility.batchAll(txs);
    log.info(`Sending batched transfer: ${batch.toHex()}`);
    await batch.signAndSend(signer, txCallback(api));
  }
};

program.name('transfer')
  .description('Transfer XCM assets.')
  .version('0.0.1')
  .option('-s, --seed <seed>', 'private account seed', '//Alice')
  .requiredOption('-d, --dest <dest>', 'destination chain id')
  .requiredOption('-r, --recipients <recipients...>', 'recipient account addresses')
  .requiredOption('-a, --assets <assets...>', 'asset ids')
  .requiredOption('-m, --amounts <amounts...>', 'asset amounts')
  .option('-x, -xcm-version <xcmVersion>', 'XCM version', '3')
  .option('--asset-registry <assetRegistryPath>', 'path to injected asset registry')
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