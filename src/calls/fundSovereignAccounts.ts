import '@polkadot/api-augment';

import { EventEmitter } from 'node:events';

import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { ISubmittableResult } from '@polkadot/types/types';
import { KeyringPair } from '@polkadot/keyring/types';
import { encodeAddress } from '@polkadot/util-crypto';
import chalk from 'chalk';

import { txCallback, deriveSovereignAccount } from '../utils/index.js';
import { Chains } from '../chains.js';

export async function fundRelaySovereignAccounts(chains: Chains, account: KeyringPair, eventEmitter: EventEmitter) {
  const relay = chains.relaychain;

  const txs: SubmittableExtrinsic<'promise', ISubmittableResult>[] = [];

  for (const para of chains.parachains) {
    const key = deriveSovereignAccount(para.id, 'para');
    const address = encodeAddress(key, relay.ss58Prefix);
    const amount = 2 * (10 ** relay.tokenDecimals);
    console.log(chalk.white(`Transfering ${amount} to fund soverign account ${address} on ${relay.name}`));
    txs.push(relay.api.tx.balances.transfer(address, amount));
  }
  const batch = relay.api.tx.utility.batchAll(txs);

  const nonce = await relay.incrementGetNonce(account.address);
  console.log(
    chalk.white(
      `Sending batch call to fund relay chain sovereign accounts for parachains [
        ${chains.parachains.map((p) => p.name ).join(', ')}
      ]. Nonce: ${nonce}`
    )
  );
  await batch.signAndSend(account, { nonce }, txCallback(relay.api, fundRelaySovereignAccounts.name, eventEmitter));
}

export async function fundSiblingSovereignAccounts(chains: Chains, account: KeyringPair, eventEmitter: EventEmitter) {
  // Fund sovereign accounts on sibling chains
  for (const parachain of chains.parachains) {
    // Transfer funds for every sibling chain sovereign account from ALICE account
    for (const sibling of chains.parachains) {
      if (sibling.id !== parachain.id) {
        const key = deriveSovereignAccount(sibling.id, 'sibl');
        const address = encodeAddress(key, sibling.ss58Prefix);
        const amount = parachain.tokenDecimals ? 2 * (10 ** parachain.tokenDecimals) : 2 * (10 ** 12);

        const nonce = await parachain.incrementGetNonce(account.address);
        console.log(
          chalk.white(
            `Transfering ${amount} to fund sibling sovereign account ${address} on parachain ${parachain.name}. Nonce: ${nonce}`
          )
        );
        await parachain.api.tx.balances.transfer(address, amount)
          .signAndSend(account, { nonce }, txCallback(parachain.api, fundSiblingSovereignAccounts.name, eventEmitter));
      }
    }
  }
}
