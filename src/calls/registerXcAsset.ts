import { EventEmitter } from 'node:events';

import { KeyringPair } from '@polkadot/keyring/types';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { ISubmittableResult } from '@polkadot/types/types';

import { txCallback, buildXcmTransactCall } from '../utils/index.js';
import { AssetConfig } from '../types.js';
import { Chain } from '../chains/index.js';

/**
 * Create and set metadata of the XC asset
 * @param api ApiPromise of the network where XC asset should be created
 * @param owner The keyring pair of the owner account
 */
export const createXcAsset = async (chain: Chain, owner: KeyringPair, asset: AssetConfig, eventEmitter: EventEmitter) => {
  const { api } = chain;
  const txs = [
    api.tx.assets.create(asset.id, owner.address, asset.minBalance),
    api.tx.assets.setMetadata(
      asset.id,
      asset.name,
      asset.symbol,
      asset.decimals
    ),
  ];
  const batch = api.tx.utility.batchAll(txs);

  const nonce = await chain.incrementGetNonce(owner.address);
  console.log(
    `Sending batch call to create asset [${asset.id} - ${asset.name}] and set metadata on chain ${asset.location}. Nonce: ${nonce}`
  );
  await batch.signAndSend(owner, { nonce }, txCallback(api, createXcAsset.name, eventEmitter));
};

async function sudoXcmCall(
  forceCall: SubmittableExtrinsic<'promise', ISubmittableResult>,
  parachain: Chain,
  relaychain: Chain,
  owner: KeyringPair,
  eventName: string,
  eventEmitter: EventEmitter
) {
  const forceRegisterCall = parachain.api.createType('Call', forceCall);

  const xcmDest = {
    V3: {
      parents: 0,
      interior: {
        X1: {
          parachain: parachain.id,
        },
      },
    },
  };

  const xcmCall = buildXcmTransactCall(relaychain.api, 'Superuser', forceRegisterCall.toHex(), xcmDest);
  const nonce = await relaychain.incrementGetNonce(owner.address);

  console.log(`Sending Sudo XCM message from relay chain to execute forceRegister call on . Nonce: ${nonce}`);

  await relaychain.api.tx.sudo.sudo(xcmCall)
    .signAndSend(owner, { nonce }, txCallback(relaychain.api, eventName, eventEmitter));
}

export async function forceRegisterAssetLocation(
  parachain: Chain,
  relaychain: Chain,
  owner: KeyringPair,
  asset: AssetConfig,
  eventEmitter: EventEmitter
) {
  const forceRegister = parachain.api.tx.xcAssetConfig.registerAssetLocation({
    V3: { ...asset.assetMultiLocation }
  }, asset.id);

  await sudoXcmCall(forceRegister, parachain, relaychain, owner, 'forceRegisterAssetLocation', eventEmitter);
}

export async function forceRegisterReserveAsset(
  parachain: Chain,
  relaychain: Chain,
  owner: KeyringPair,
  asset: AssetConfig,
  eventEmitter: EventEmitter
) {
  const forceRegister = parachain.api.tx.assetRegistry.registerReserveAsset(asset.id, asset.assetMultiLocation);

  await sudoXcmCall(forceRegister, parachain, relaychain, owner, 'forceRegisterReserveAsset', eventEmitter);
}
