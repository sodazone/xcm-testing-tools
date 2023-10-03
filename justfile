alias z := zombienet

default:
  @just --list

# Downloads zombienet binaries
download:
  ./scripts/download.sh

# Runs zombienet 
zombienet config='./conf/zn-asset-hub-astar.toml':
  ./bin/zombienet -p native spawn {{config}}

# Register XCM assets
assets *ARGS:
  ts-node-esm src/cli/assets.ts {{ARGS}}

# Transfer assets
transfer *ARGS:
  ts-node-esm src/cli/transfer.ts {{ARGS}}