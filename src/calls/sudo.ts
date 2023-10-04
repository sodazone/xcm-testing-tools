import log from '../cli/log.js';

import { txStatusCallback, buildXcmTransactCall } from '../utils/index.js';
import { AssetCallParaArgs, SubmittableTx } from '../types.js';

export async function sudoXcmCall(
  forceCall: SubmittableTx,
  { parachain, relaychain, owner, ack }: AssetCallParaArgs
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

  log.info(
    `Sending sudo XCM message from relay to ${parachain.name} (nonce:${nonce})`,
  );

  await relaychain.api.tx.sudo.sudo(xcmCall)
    .signAndSend(
      owner,
      { nonce },
      txStatusCallback(relaychain.api, ack)
    );
}