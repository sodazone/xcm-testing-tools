import '@polkadot/api-augment';

import { EventEmitter } from 'node:events';

import { ApiPromise } from '@polkadot/api';
import type { ISubmittableResult } from '@polkadot/types/types';
import type { Outcome } from '@polkadot/types/interfaces/xcm';
import chalk from 'chalk';

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
      errorMessage = errorMessage ? errorMessage + dispatchError.toString() : dispatchError.toString();
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

export const txCallback = (api: ApiPromise, name = '', eventEmitter: EventEmitter) => {
  return (result: ISubmittableResult) => {
    const { status } = result;

    console.log(chalk.cyan(`[${name}] Transaction status: ${status}`));

    if (status.isFinalized) {
      const extrinsicError = getExtrinsicError(api, result);
      let polkadotXcmError: string | undefined;
      // pallet_xcm errors are not emitted as module errors so we need to decode the events to extract errors
      if (api.events.polkadotXcm) {
        const es = extractPolkadotXcmError(api, result);
        for (const e of es) {
          if (e) {
            polkadotXcmError = polkadotXcmError ? polkadotXcmError + `\nPolkadotXcm.Attempted Error: ${e}` : e;
          }
        }
      }

      eventEmitter.emit(name, extrinsicError, polkadotXcmError);
    }
  };
};
