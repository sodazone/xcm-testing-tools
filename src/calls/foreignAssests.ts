import log from '../cli/log.js';
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
  log.info(
    `Sending batch call to create asset [${asset.id} - ${asset.name}] and set metadata on chain ${asset.location} (nonce:${nonce})`
  );
  await batch.signAndSend(owner, { nonce }, txStatusCallback(api, ack));
};

export async function forceRegisterAssetLocation(args: AssetCallParaArgs) {
  const { parachain, asset } = args;
  const forceRegister = parachain.api.tx.xcAssetConfig
    .registerAssetLocation({
      V3: { ...asset.assetMultiLocation }
    }, asset.id);

  log.info(
    `Force registering foreign asset [${asset.id} - ${asset.name}] on chain ${asset.location}`
  );
  await sudoXcmCall(forceRegister, args);
}

export async function forceRegisterReserveAsset(args: AssetCallParaArgs) {
  const { parachain, asset } = args;
  const forceRegister = parachain.api.tx.assetRegistry
    .registerReserveAsset(
      asset.id, asset.assetMultiLocation
    );

  log.info(
    `Force registering foreign asset [${asset.id} - ${asset.name}] on chain ${asset.location}`
  );
  await sudoXcmCall(forceRegister, args);
}

export async function forceSetAssetsUnitPerSecond(args: AssetCallParaArgs) {
  const { parachain, asset } = args;

  const setUnitsPerSecond = parachain.api.tx.xcAssetConfig
    .setAssetUnitsPerSecond(
      { V3: asset.assetMultiLocation }, 1
    );

  log.info(
    `Force setting units per second for asset [${asset.id} - ${asset.name}] on chain ${asset.location}`
  );

  await sudoXcmCall(setUnitsPerSecond, args);
}
