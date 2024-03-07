#!/usr/bin/env node

import { readFileSync } from 'node:fs';

import { program } from 'commander';

import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { AssetTransferApi, constructApiPromise, TxResult, AssetTransferApiOpts } from '@substrate/asset-transfer-api';

import { ApiPromise } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { ISubmittableResult } from '@polkadot/types/types';

import log from './log.js';
import { txStatusCallback } from '../utils/index.js';

type CliArgs = {
  url: string,
  seed: string,
  dest: string,
  recipients: string[],
  assets: string[],
  amounts: string[],
  xcmVersion?: string,
  assetRegistry?: string,
  print: boolean
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
  assetRegistry,
  print
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
          xcmVersion: xcmVersion ? parseInt(xcmVersion) : safeXcmVersion,
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
  
  let finalTx: SubmittableExtrinsic<"promise", ISubmittableResult> | undefined;

  if (submittableTxs.length === 1) {
    finalTx = submittableTxs[0].tx;
  } else if (submittableTxs.length > 1) {
    finalTx = api.tx.utility.batch(
      submittableTxs.map(s => s.tx)
    );
  }

  if (finalTx === undefined) {
    log.info('No submittable extrinsics to send. Exiting.');
    process.exit(0);
  }

  if (print) {
    log.info(`Hex-encoded extrinsic: ${finalTx.toHex()}`);
    log.info(`Decoded: ${JSON.stringify(finalTx.toHuman(), null, 2)}`);
    process.exit(0);
  } else {
    log.info(`Sending transfer: ${finalTx.toHex()}`);
    await finalTx.signAndSend(signer, txCallback(api));
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
  .option('-x, --xcm-version [xcmVersion]', 'XCM version')
  .option('--asset-registry [assetRegistryPath]', 'path to injected asset registry')
  .option('-p, --print', 'prints the resulting extrinsic without sending')
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