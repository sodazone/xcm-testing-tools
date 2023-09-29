#!/usr/bin/env ts-node

import { EventEmitter } from 'node:events';

import chalk from 'chalk';
import { Keyring } from '@polkadot/keyring';
import { AssetTransferApi, constructApiPromise, TxResult } from '@substrate/asset-transfer-api';

const eventEmitter = new EventEmitter();

const main = async () => {
  const { api, specName, safeXcmVersion } = await constructApiPromise('ws://127.0.0.1:9910');
  console.log('spec name:', specName);
  const assetApi = new AssetTransferApi(api, specName, safeXcmVersion);

  let submittableTx: TxResult<'submittable'>;
  try {
    submittableTx = await assetApi.createTransferTransaction(
      '2000',
      '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', // Alice
      ['1984'],
      ['1500000000000'],
      {
        format: 'submittable',
        isLimited: true,
        xcmVersion: 3,
      }
    );

    console.log(
      chalk.magenta(`The following call data that is returned:\n${JSON.stringify(submittableTx, null, 4)}`)
    );
  } catch (e) {
    console.error(e);
    throw Error(e as string);
  }

  // const decoded = assetApi.decodeExtrinsic(submittableTx.tx.toString(), 'submittable');
  // console.log(`\n${PURPLE}The following decoded tx:\n${GREEN} ${JSON.stringify(JSON.parse(decoded), null, 4)}${RESET}`);

  // Actually send the tx...
  const keyring = new Keyring({ type: 'sr25519' });
  const alice = keyring.addFromUri('//Alice');

  await submittableTx.tx.signAndSend(alice, ({ status, dispatchError, internalError }) => {
    console.log(chalk.cyan('Transaction status: ', status));
    if (status.isInBlock || status.isFinalized) {
      let errorMessage: string | undefined;
      if (dispatchError) {
        if (dispatchError.isModule) {
          const decoded = api.registry.findMetaError(dispatchError.asModule);
          const { docs, method, section } = decoded;

          errorMessage = `${section}.${method}: ${docs.join(' ')}`;
        } else {
          // Other, CannotLookup, BadOrigin, no extra info
          errorMessage = dispatchError.toString();
        }
      }
      if (internalError) {
        errorMessage = internalError.message;
      }
      if (status.isFinalized) {
        eventEmitter.emit('txFinalized', errorMessage);
      }
    }
  });
};

main().finally(() => {
  eventEmitter.on('txFinalized', (errorMessage?: string) => {
    if (errorMessage) {
      console.error('Error in extrinsic:', errorMessage);
    } else {
      console.log(chalk.green('Extrinsic success'));
    }
    console.log(chalk.yellow('\nTransfer finalized, exiting script...'));
    process.exit();
  });
});
