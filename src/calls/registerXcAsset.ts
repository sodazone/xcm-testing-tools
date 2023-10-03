import { EventEmitter } from 'node:events';

import { KeyringPair } from '@polkadot/keyring/types';
import chalk from 'chalk';

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
    chalk.white(
      `Sending batch call to create asset [${asset.id} - ${asset.name}] and set metadata on chain ${asset.location}. Nonce: ${nonce}`
    )
  );
  await batch.signAndSend(owner, { nonce }, txCallback(api, createXcAsset.name, eventEmitter));
};

export async function x(
  parachain: Chain,
  relaychain: Chain,
  owner: KeyringPair,
  asset: AssetConfig,
  eventEmitter: EventEmitter
) {
  const forceRegister = parachain.api.tx.xcAssetConfig.registerAssetLocation({ V3: {
    ...asset.assetMultiLocation
  }}, asset.id);
  const forceRegisterCall = parachain.api.createType('Call', {
    callIndex: forceRegister.callIndex,
    args: forceRegister.args,
  });

  const xcmDest = {
    V3: {
      parents: 0,
      interior: {
        X1: {
          parachain: asset.location,
        },
      },
    },
  };

  const xcmCall = buildXcmTransactCall(relaychain.api, 'Superuser', forceRegisterCall.toHex(), xcmDest);

  const nonce = await relaychain.incrementGetNonce(owner.address);
  console.log(chalk.white(`Sending Sudo XCM message from relay chain to execute forceRegister call on . Nonce: ${nonce}`));

  await relaychain.api.tx.sudo.sudo(xcmCall)
    .signAndSend(owner, { nonce }, txCallback(relaychain.api, x.name, eventEmitter));
}

export const forceRegisterXcAsset = async (
  parachain: Chain,
  relaychain: Chain,
  owner: KeyringPair,
  asset: AssetConfig,
  eventEmitter: EventEmitter
) => {
  const forceRegister = parachain.api.tx.assetRegistry.registerReserveAsset(asset.id, asset.assetMultiLocation);
  const forceRegisterCall = parachain.api.createType('Call', {
    callIndex: forceRegister.callIndex,
    args: forceRegister.args,
  });

  const xcmDest = {
    V3: {
      parents: 0,
      interior: {
        X1: {
          parachain: asset.location,
        },
      },
    },
  };

  const xcmCall = buildXcmTransactCall(relaychain.api, 'Superuser', forceRegisterCall.toHex(), xcmDest);

  const nonce = await relaychain.incrementGetNonce(owner.address);
  console.log(chalk.white(`Sending Sudo XCM message from relay chain to execute forceRegister call on Trappist. Nonce: ${nonce}`));

  await relaychain.api.tx.sudo.sudo(xcmCall)
    .signAndSend(owner, { nonce }, txCallback(relaychain.api, forceRegisterXcAsset.name, eventEmitter));
};
