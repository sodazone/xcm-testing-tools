#!/usr/bin/env bash
set -eu

cd "$(cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"

mkdir -p ../bin
cd ../bin

test $(uname -m) = "x86_64" || {
  echo This script downloads binaries for x86_64.
  echo Please, download the binaries for your architecture from the git repositories.
  exit 1
}

test -f zombienet || wget https://github.com/paritytech/zombienet/releases/download/v1.3.68/zombienet-linux-x64 -O zombienet
test -f polkadot || wget https://github.com/paritytech/polkadot/releases/download/v1.0.0/polkadot -O polkadot
test -f polkadot-parachain || wget https://github.com/paritytech/cumulus/releases/download/v1.0.0/polkadot-parachain -O polkadot-parachain
test -f astar-collator || { 
  wget https://github.com/AstarNetwork/Astar/releases/download/v5.19.0/astar-collator-v5.19.0-ubuntu-x86_64.tar.gz -O astar-collator.tgz
  tar xzf astar-collator.tgz
  rm astar-collator.tgz
}

chmod 755 *
ls .
