import log from '../cli/log.js';

import { txStatusCallback } from '../utils/index.js';
import { AssetCallArgs, AssetCallParaArgs } from '../types.js';
import { sudoXcmCall } from './sudo.js';

export const forceCreateAsset = async (args: AssetCallParaArgs) => {
  const { asset, parachain, owner } = args;
  const forceCreate = parachain.api.tx.assets.forceCreate(
    asset.id, owner.address, asset.isSufficient, asset.minBalance
  );

  await sudoXcmCall(forceCreate, args);
};

export const mintAsset = async ({
  chain, asset, owner, ack
} : AssetCallArgs) => {
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

  log.info(
    `Sending batch call in order to mint asset ${asset.id} (${asset.symbol}) on chain ${asset.location}. Nonce: ${nonce}`
  );

  await batch.signAndSend(owner, { nonce }, txStatusCallback(chain.api, ack));
};
