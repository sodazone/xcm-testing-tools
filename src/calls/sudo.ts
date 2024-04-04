import type { AnyTuple } from '@polkadot/types-codec/types';
import { GenericCall } from '@polkadot/types';

import log from '../cli/log.js';

import { txStatusCallback, buildXcmTransactCall } from '../utils/index.js';
import { ExtrinsicArgs, MultiChainExtrinsicArgs, HrmpChannelConfig } from '../types.js';
import { Chain } from '../chains/index.js';

export async function sudoXcmCall(
  forceCall: GenericCall<AnyTuple>,
  parachain: Chain,
  { chain, signer, ack }: ExtrinsicArgs
) {
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
  const xcmCall = buildXcmTransactCall(chain.api, 'Superuser', forceCall.toHex(), xcmDest);
  const nonce = await chain.incrementGetNonce(signer.address);

  log.info(
    `Sending sudo XCM message from relay to ${parachain.name} (nonce:${nonce})`,
  );

  await chain.api.tx.sudo.sudo(xcmCall)
    .signAndSend(
      signer,
      { nonce },
      txStatusCallback(chain.api, ack)
    );
}

export async function sudoForceOpenHrmpChannel(
  { chains, signer, ack }: MultiChainExtrinsicArgs,
  { sender, recipient, maxCapacity, maxMessageSize }: HrmpChannelConfig
) {
  const relaychain = chains.relaychain;
  const openChannel = relaychain.api.tx.hrmp.forceOpenHrmpChannel(sender, recipient, maxCapacity, maxMessageSize);

  const nonce = await relaychain.incrementGetNonce(signer.address);

  log.info(
    `Sending sudo XCM message from relay to force open HRMP channel ${sender}-${recipient} (nonce:${nonce})`,
  );

  await relaychain.api.tx.sudo.sudo(openChannel)
    .signAndSend(
      signer,
      { nonce },
      txStatusCallback(relaychain.api, ack)
    );
}

export async function sudoForceDefaultXcmVersion({ chain, signer, ack }: ExtrinsicArgs) {
  const forceDefaultXcmVersion = chain.api.tx.xcmPallet.forceDefaultXcmVersion(3);
  const call = chain.api.createType('Call', forceDefaultXcmVersion);

  await chain.api.tx.sudo.sudo(call)
    .signAndSend(
      signer,
      txStatusCallback(chain.api, ack)
    );
}