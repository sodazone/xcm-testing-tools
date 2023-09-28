import '@polkadot/api-augment';

import { EventEmitter } from 'node:events';

import { ApiPromise } from '@polkadot/api';
import type { ISubmittableResult } from '@polkadot/types/types';
import chalk from 'chalk';

export const txCallback = (api: ApiPromise, name = '', eventEmitter: EventEmitter) => {
  return (result: ISubmittableResult) => {
    const { status, dispatchError, internalError } = result;

    console.log(chalk.cyan(`[${name}] Transaction status: ${status}`));

    if (status.isInBlock || status.isFinalized) {
      let errorMessage: string | undefined;
      if (dispatchError) {
        if (dispatchError.isModule) {
          const decoded = api.registry.findMetaError(dispatchError.asModule);
          const { docs, method, section } = decoded;

          errorMessage = `${section}.${method}: ${docs.join(' ')}`;
        } else {
          // Other, CannotLookup, BadOrigin, no extra info
          errorMessage = dispatchError.toString();
        }
      }
      if (internalError) {
        errorMessage = internalError.message;
      }
      if (status.isFinalized) {
        eventEmitter.emit(name, errorMessage);
      }
    }
  };
};
