#!/usr/bin/env node
import '@polkadot/api-augment/polkadot';

import { program } from 'commander';

import { TypeRegistry, Metadata } from '@polkadot/types';
import staticMetadata from '@polkadot/types-support/metadata/static-polkadot';
import type { Bytes } from '@polkadot/types';
import type { XcmVersionedXcm } from '@polkadot/types/lookup';

import log from './log.js';

type CliArgs = {
  data: string,
  hrmp: boolean
}

function asVersionedXcm(
  data: Bytes | Uint8Array,
  registry: TypeRegistry
): XcmVersionedXcm {
  return registry.createType(
    'XcmVersionedXcm', data
  );
}

function asXcmpVersionedXcms(
  buffer: Uint8Array,
  registry: TypeRegistry
) : XcmVersionedXcm[] {
  const len = buffer.length;
  const xcms : XcmVersionedXcm[] = [];
  let ptr = 1;

  while (ptr < len) {
    try {
      const xcm = asVersionedXcm(buffer.slice(ptr), registry);
      xcms.push(xcm);
      ptr += xcm.encodedLength;
    } catch (error) {
      // TODO use logger
      console.error(error);
      break;
    }
  }

  return xcms;
}

function fromXcmpFormat(
  buf: Uint8Array,
  registry: TypeRegistry
) : XcmVersionedXcm[] {
  switch (buf[0]) {
  case 0x00: { // Concatenated XCM fragments
    return asXcmpVersionedXcms(buf, registry);
  }
  case 0x01: { // XCM blobs
    // XCM blobs not supported, ignore
    break;
  }
  case 0x02: { // Signals
    // TODO handle signals
    break;
  }
  default: {
    throw new Error('Unknown XCMP format');
  }
  }
  return [];
}

async function main({ data, hrmp } : CliArgs) {
  const registry = new TypeRegistry();
  const metadata = new Metadata(registry, staticMetadata);
  registry.setMetadata(metadata);

  let d = data;
  if (data.startsWith('0x')) {
    d = data.substring(2);
  }

  const bu = new Uint8Array(Buffer.from(d, 'hex'));

  if (hrmp) {
    const xcmPrograms = fromXcmpFormat(bu, registry);

    xcmPrograms.forEach(p => {
      log.info('Message hash:', p.hash.toHex());
      log.info('Instruction:', JSON.stringify(p.toHuman(), null, 2));
    });
  } else {
    const xcmProgram = asVersionedXcm(bu, registry);

    log.info('Message hash:', xcmProgram.hash.toHex());
    log.info('Instruction:', JSON.stringify(xcmProgram.toHuman(), null, 2));
  }
  process.exit(0);
}

program.name('decode')
  .description('Decode XCM data.')
  .version('0.1.0')
  .argument('<data>', 'XCM program as hex string')
  .option('--hrmp', 'Flag to indicate if data is HRMP program')
  .addHelpText('after', `

  Example call:
    $ decode --hrmp 0x00031001...5052a952`
  );

program.parse();

main({
  ...program.opts(),
  data: program.args[0]
});