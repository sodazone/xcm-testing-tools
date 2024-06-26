import log from '../cli/log.js';

import { txStatusCallback } from '../utils/index.js';
import { AssetCallArgs, ExtrinsicArgs, ForceCallArgs } from '../types.js';
import { sudoXcmCall } from './sudo.js';

export const forceCreateAsset = async (args: ForceCallArgs, sudoTxArgs: ExtrinsicArgs) => {
  const { asset, chain } = args;
  const forceCreate = chain.api.tx.assets.forceCreate(
    asset.id, sudoTxArgs.signer.address, asset.isSufficient, asset.minBalance
  );
  const forceCreateCall = chain.api.createType('Call', forceCreate);

  log.info(
    `Force creating asset ${asset.id} (${asset.symbol}) on chain ${asset.location}`
  );

  await sudoXcmCall(forceCreateCall, chain, sudoTxArgs);
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
    `Sending batch call in order to mint asset ${asset.id} (${asset.symbol}) on chain ${asset.location} (nonce:${nonce})`
  );

  await batch.signAndSend(owner, { nonce }, txStatusCallback(chain.api, ack));
};
