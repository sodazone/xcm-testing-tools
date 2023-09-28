import '@polkadot/api-augment';

import { EventEmitter } from 'node:events';

import { KeyringPair } from '@polkadot/keyring/types';
import chalk from 'chalk';

import { txCallback, buildXcmTransactCall} from '../utils/index.js';
import { Asset } from '../types.js';
import { Chain } from '../chains.js';

export const forceCreateAsset = async (
  parachain: Chain,
  relaychain: Chain,
  owner: KeyringPair,
  asset: Asset,
  eventEmitter: EventEmitter
) => {
  const forceCreate = parachain.api.tx.assets.forceCreate(asset.id, owner.address, asset.isSufficient, asset.minBalance);
  const forceCreateCall = parachain.api.createType('Call', {
    callIndex: forceCreate.callIndex,
    args: forceCreate.args,
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

  const xcmCall = buildXcmTransactCall(relaychain.api, 'Superuser', forceCreateCall.toHex(), xcmDest);

  const nonce = await relaychain.incrementGetNonce(owner.address);
  console.log(chalk.white(`Sending Sudo XCM message from ${relaychain.name} to execute forceCreate call. Nonce: ${nonce}`));

  await relaychain.api.tx.sudo.sudo(xcmCall).signAndSend(owner, { nonce }, txCallback(relaychain.api, forceCreateAsset.name, eventEmitter));
};

export const mintAsset = async (chain: Chain, owner: KeyringPair, asset: Asset, eventEmitter: EventEmitter) => {
  const txs = [
    chain.api.tx.assets.setMetadata(
      asset.id,
      asset.name,
      asset.symbol,
      asset.decimals
    ),
    chain.api.tx.assets.mint(asset.id, owner.address, 1234 * 1000000000000),
  ];
  const batch = chain.api.tx.utility.batchAll(txs);

  const nonce = await chain.incrementGetNonce(owner.address);
  console.log(
    chalk.white(`Sending batch call in order to mint asset ${asset.id} (${asset.symbol}) on chain ${asset.location}. Nonce: ${nonce}`)
  );
  await batch.signAndSend(owner, { nonce }, txCallback(chain.api, mintAsset.name, eventEmitter));
};
