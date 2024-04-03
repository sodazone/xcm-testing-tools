import '@polkadot/api-augment';

import { ApiPromise } from '@polkadot/api';
import type { ISubmittableResult } from '@polkadot/types/types';
import type { Outcome } from '@polkadot/types/interfaces/xcm';

import log from '../cli/log.js';
import { AckCallback, TxResult } from '../types.js';

function getExtrinsicError(api: ApiPromise, result: ISubmittableResult) {
  let errorMessage: string | undefined;
  const { dispatchError, internalError } = result;
  if (dispatchError) {
    if (dispatchError.isModule) {
      const decoded = api.registry.findMetaError(dispatchError.asModule);
      const { docs, method, section } = decoded;

      const moduleError = `Module Error: ${section}.${method}: ${docs.join(' ')}`;
      errorMessage = errorMessage ? errorMessage + moduleError : moduleError;
    } else {
      // Other, CannotLookup, BadOrigin, no extra info
      errorMessage = errorMessage
        ? errorMessage + dispatchError.toString()
        : dispatchError.toString();
    }
  }
  if (internalError) {
    const ie = `Internal Error: ${internalError.message}`;
    errorMessage = errorMessage ? errorMessage + ie : ie;
  }
  return errorMessage;
}

function extractPolkadotXcmError(api: ApiPromise, { events }: ISubmittableResult) {
  return events
    .filter(({ event }) => api.events.polkadotXcm.Attempted.is(event))
    .map(({
      event: {
        data: [outcome],
      },
    }) => {
      const o = outcome as Outcome;
      if (o.isIncomplete) {
        const [_, err] = o.asIncomplete;
        return err.type.toString();
      }
      if (o.isError) {
        return o.asError.type.toString();
      }
      return undefined;
    });
}

export const txStatusCallback = (api: ApiPromise, ack: AckCallback) => {
  return async (result: ISubmittableResult) => {
    const { status } = result;

    log.info('Transaction status:', status.toHuman());

    if (status.isFinalized) {
      const xterr = getExtrinsicError(api, result);
      const txRes = new TxResult(xterr);

      if (xterr) {
        log.error('Extrinsic error:', xterr);
      }

      // pallet_xcm errors are not emitted as module errors
      // so we need to decode the events to extract errors
      if (api.events.polkadotXcm) {
        const errors = extractPolkadotXcmError(api, result);
        for (const error of errors) {
          if (error) {
            txRes.addXcmError(error);
            log.error('XCM execution error:', error);
          }
        }
      }

      await ack(txRes);
    } else if (status.isInvalid) {
      log.warn('Extrinsic is invalid');
      const xterr = getExtrinsicError(api, result);
      const txRes = new TxResult(xterr);

      if (xterr) {
        log.error('Extrinsic error:', xterr);
      }

      await ack(txRes);
    }
  };
};
