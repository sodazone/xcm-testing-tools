import { txStatusCallback } from '../utils/index.js';
import { AssetCallArgs, AssetCallParaArgs } from '../types.js';
import { sudoXcmCall } from './sudo.js';

/**
 * Create and set metadata of the XC asset
 */
export const createXcAsset = async (
  { chain, asset, owner, ack }: AssetCallArgs
) => {
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
  await batch.signAndSend(owner, { nonce }, txStatusCallback(api, ack));
};

export async function forceRegisterAssetLocation(args: AssetCallParaArgs) {
  const { parachain, asset } = args;
  const forceRegister = parachain.api.tx.xcAssetConfig
    .registerAssetLocation({
      V3: { ...asset.assetMultiLocation }
    }, asset.id);

  await sudoXcmCall(forceRegister, args);
}

export async function forceRegisterReserveAsset(args: AssetCallParaArgs) {
  const { parachain, asset } = args;
  const forceRegister = parachain.api.tx.assetRegistry
    .registerReserveAsset(
      asset.id, asset.assetMultiLocation
    );

  await sudoXcmCall(forceRegister, args);
}
