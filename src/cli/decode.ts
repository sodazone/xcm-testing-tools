#!/usr/bin/env ts-node
import '@polkadot/api-augment';

import { program } from 'commander';
import { ApiPromise, WsProvider } from '@polkadot/api';

import log from './log.js';

type CliArgs = {
  url: string,
  data: string
}

async function main({ url, data } : CliArgs) {
  const api = new ApiPromise({
    provider: new WsProvider(url),
    noInitWarn: true,
  });

  await api.isReady;
  const xcmProgram = api.registry.createType(
    'XcmVersionedXcm', data
  );

  log.info(JSON.stringify(xcmProgram.toHuman(), null, 2));
  process.exit(0);
}

program.name('decode')
  .description('Decode XCM data.')
  .version('0.0.1')
  .option('-d, --data <data>', 'XCM data', '0x0310...5322')
  .argument('<url>', 'RPC endpoint URL')
  .addHelpText('after', `

  Example call:
    $ decode ws://127.0.0.1:9944 -d 0x0310...5322`
  );

program.parse();

main({
  ...program.opts(),
  url: program.args[0]
});