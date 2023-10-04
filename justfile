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

# Set up assets and sovereign accounts for XCM transfers
assets *ARGS: build
  yarn assets {{ARGS}}

# Initiate asset transfer
transfer *ARGS: build
  yarn transfer {{ARGS}}
