#!/usr/bin/env node

import { program } from 'commander';

import { TypeRegistry, Metadata } from '@polkadot/types';
import staticMetadata from '@polkadot/types-support/metadata/static-polkadot';
import type { Bytes } from '@polkadot/types';
import type { VersionedXcm } from '@polkadot/types/interfaces/xcm';

import log from './log.js';

type CliArgs = {
  data: string,
  hrmp: boolean
}

function asVersionedXcm(
  data: Bytes | Uint8Array,
  registry: TypeRegistry
): VersionedXcm {
  return registry.createType(
    'XcmVersionedXcm', data
  );
}

function asXcmpVersionedXcms(
  buffer: Uint8Array,
  registry: TypeRegistry
) : VersionedXcm[] {
  const len = buffer.length;
  const xcms : VersionedXcm[] = [];
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
) : VersionedXcm[] {
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
    })
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
    $ decode --hrmp 0x000310010400010100591f001761f247160a6575a80b0a1300010100591f001761f247160a6575a80b000d01020400010100f2b9740bff0f93715ec5e83f6a27346904558ba33c5e93da03cf9ef75052a952`
  );

program.parse();

main({
  ...program.opts(),
  data: program.args[0]
});