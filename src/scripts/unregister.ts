// import '@polkadot/api-augment';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
// import { DispatchError } from '@polkadot/types/interfaces';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import chalk from 'chalk';

/**
 * This script is intended to be run after zombienet is running.
 * It uses the hard coded values given in `zombienet.toml`.
 */

const TRAPPIST_WS_URL = 'ws://127.0.0.1:9920';
const ROCOCO_ALICE_WS_URL = 'ws://127.0.0.1:9900';

const ASSET_ID = 198401984;

const main = async () => {
  console.log(chalk.yellow('Initializing script to run transaction on chain'));
  await cryptoWaitReady();

  const keyring = new Keyring({ type: 'sr25519' });
  const alice = keyring.addFromUri('//Alice');

  const trappistApi = await ApiPromise.create({
    provider: new WsProvider(TRAPPIST_WS_URL),
    noInitWarn: true,
  });

  await trappistApi.isReady;
  console.log(chalk.green('Created a connection to Trappist'));

  const rococoApi = await ApiPromise.create({
    provider: new WsProvider(ROCOCO_ALICE_WS_URL),
    noInitWarn: true,
  });

  await rococoApi.isReady;
  console.log(chalk.green('Created a connection to Rococo'));

  /**
	 * Create this call via the parachain api, since this is the chain in which it will be called.
	 */
  const forceUnregister = trappistApi.tx.assetRegistry.unregisterReserveAsset(ASSET_ID);
  const forceUnregisterCall = trappistApi.createType('Call', {
    callIndex: forceUnregister.callIndex,
    args: forceUnregister.args,
  });
  /**
	 * Create an xcm call via the relay chain because this is the chain in which it will be called.
	 * NOTE: The relay chain will have sudo powers.
	 */
  const xcmDoubleEncoded = rococoApi.createType('XcmDoubleEncoded', {
    encoded: forceUnregisterCall.toHex(),
  });
  const xcmOriginType = rococoApi.createType('XcmOriginKind', 'Superuser');
  const xcmDest = {
    V3: {
      parents: 0,
      interior: {
        X1: {
          parachain: 2000,
        },
      },
    },
  };
  const xcmMessage = {
    V3: [
      {
        unpaidExecution: {
          weightLimit: { Unlimited: '' },
          checkOrigin: {
            parents: 1,
            interior: { Here: '' },
          },
        },
      },
      {
        transact: {
          originKind: xcmOriginType,
          requireWeightAtMost: {
            refTime: 1000000000,
            proofSize: 900000,
          },
          call: xcmDoubleEncoded,
        },
      },
    ],
  };
  const multiLocation = rococoApi.createType('XcmVersionedMultiLocation', xcmDest);
  const xcmVersionedMsg = rococoApi.createType('XcmVersionedXcm', xcmMessage);
  const xcmMsg = rococoApi.tx.xcmPallet.send(multiLocation, xcmVersionedMsg);
  const xcmCall = rococoApi.createType('Call', {
    callIndex: xcmMsg.callIndex,
    args: xcmMsg.args,
  });

  console.log('Sending Sudo XCM message from relay chain to execute forceUnregister call on Trappist');
  await rococoApi.tx.sudo.sudo(xcmCall).signAndSend(alice);

  console.log(chalk.yellow('Script finished. Exiting'));
};

main()
  .catch(console.error)
  .finally(() => process.exit());
