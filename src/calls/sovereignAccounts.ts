import { encodeAddress } from '@polkadot/util-crypto';

import log from '../cli/log.js';

import { txStatusCallback, deriveSovereignAccount } from '../utils/index.js';
import { CallMultiArgs, SubmittableTx } from '../types.js';

export async function fundRelaySovereignAccounts({
  chains, signer, ack
}: CallMultiArgs) {
  const relay = chains.relaychain;

  const txs: SubmittableTx[] = [];

  for (const para of chains.parachains) {
    const key = deriveSovereignAccount(para.id, 'para');
    const address = encodeAddress(key, relay.ss58Prefix);
    const amount = 2 * (10 ** relay.tokenDecimals);

    log.info(`Transfering ${amount} to fund soverign account ${address} on ${relay.name}`);

    txs.push(relay.api.tx.balances.transferKeepAlive(address, amount));
  }
  const batch = relay.api.tx.utility.batchAll(txs);

  const nonce = await relay.incrementGetNonce(signer.address);

  log.info(
    `Sending batch call to fund relay chain sovereign accounts for parachains [
        ${chains.parachains.map((p) => p.name ).join(', ')}
      ] (nonce:${nonce})`
  );

  await batch.signAndSend(signer, { nonce }, txStatusCallback(relay.api, ack));
}

export async function fundSiblingSovereignAccounts({
  chains, signer, ack
}: CallMultiArgs) {
  // Fund sovereign accounts on sibling chains
  for (const parachain of chains.parachains) {
    const txs: SubmittableTx[] = [];
    // Transfer funds for every sibling chain sovereign account from ALICE account
    for (const sibling of chains.parachains) {
      if (sibling.id !== parachain.id) {
        const key = deriveSovereignAccount(sibling.id, 'sibl');
        const address = encodeAddress(key, sibling.ss58Prefix);
        const amount = BigInt(parachain.tokenDecimals ? 2 * (10 ** parachain.tokenDecimals) : 2 * (10 ** 12));

        log.info(
          `Transfering ${amount} to fund sibling sovereign account ${address} on parachain ${parachain.name}`
        );

        txs.push(parachain.api.tx.balances.transferKeepAlive(address, amount));
      }
    }

    const nonce = await parachain.incrementGetNonce(signer.address);

    if (txs.length > 1) {
      parachain.api.tx.utility.batch(txs)
        .signAndSend(signer, { nonce }, txStatusCallback(parachain.api, ack));
    } else {
      txs[0].signAndSend(signer, { nonce }, txStatusCallback(parachain.api, ack));
    }
  }
}
