alias z := zombienet

default:
  @just --list

# Builds the project
build:
  yarn build > /dev/null

# Downloads zombienet binaries
download:
  ./scripts/download.sh

# Runs zombienet 
zombienet config='./conf/zn-asset-hub-astar.toml':
  ./bin/zombienet -p native spawn {{config}}

# Register XCM assets
assets *ARGS: build
  yarn assets {{ARGS}}

# Transfer assets
transfer *ARGS: build
  yarn transfer {{ARGS}}
