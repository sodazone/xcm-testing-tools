// import '@polkadot/api-augment';

import { ApiPromise } from '@polkadot/api';
import { stringToU8a, bnToU8a } from '@polkadot/util';
import { blake2AsU8a } from '@polkadot/util-crypto';
import type { XcmVersionedLocation } from '@polkadot/types/lookup';

/**
 * Creates an XCM transact call from origin chain to destination chain.
 *
 * @param api ApiPromise of origin chain where XCM call is to be sent
 * @param originKind Dispatch origin @see https://paritytech.github.io/polkadot-sdk/master/cumulus_primitives_core/enum.OriginKind.html
 * @param call The underlying hex encoded call to be executed on destination parachain
 * @param dest MultiLocation destination
 * @returns
 */
export function buildXcmTransactCall(api: ApiPromise, originKind: string, call: `0x${string}`, dest: any) {
  const xcmDoubleEncoded = api.createType('XcmDoubleEncoded', {
    encoded: call,
  });
  const xcmOriginType = api.createType('XcmOriginKind', originKind);
  const xcmMessage = {
    V3: [
      {
        unpaidExecution: {
          weightLimit: { Unlimited: '' },
          checkOrigin: {
            parents: 1,
            interior: { Here: '' },
          },
        },
      },
      {
        transact: {
          originKind: xcmOriginType,
          requireWeightAtMost: {
            refTime: 1000000000,
            proofSize: 900000,
          },
          call: xcmDoubleEncoded,
        },
      },
    ],
  };
  // VersionedMultiLocation deprecated -> VersionedLocation in XCM v4
  const multiLocation = api.createType('XcmVersionedLocation', dest) as XcmVersionedLocation;
  const xcmVersionedMsg = api.createType('XcmVersionedXcm', xcmMessage);
  return api.tx.xcmPallet.send(multiLocation, xcmVersionedMsg);
}

export function deriveSovereignAccount(paraId: number, type = 'para') {
  const typeEncoded = stringToU8a(type);
  const paraIdEncoded = bnToU8a(paraId, { bitLength: 16 });
  const zeroPadding = new Uint8Array(32 - typeEncoded.length - paraIdEncoded.length).fill(0);
  return new Uint8Array([...typeEncoded, ...paraIdEncoded, ...zeroPadding]);
}

type Family = 'SiblingChain' | 'ChildChain' | 'ParentChain';
export function deriveHashedAccount(api: ApiPromise, key: Uint8Array, family: Family) {
  const aid32 = 'AccountId32';
  const typeEncoded = stringToU8a(family);
  // const paraIdEncoded = api.createType('Compact<u32>', 1000);
  const mac = new Uint8Array([
    ...typeEncoded,
    // ...paraIdEncoded.toU8a(),
    ...api.createType('Compact<u32>', aid32.length + 32).toU8a(),
    ...stringToU8a(aid32),
    ...key
  ]);

  return blake2AsU8a(mac);
}