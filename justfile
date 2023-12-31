alias z := zombienet

default:
  @just --list

# Builds the project
build:
  yarn build

# Downloads zombienet binaries
download:
  ./scripts/download.sh

# Runs zombienet 
zombienet config='./config/zn-asset-hub-astar.toml':
  ./bin/zombienet -p native spawn {{config}}

# Set up assets and sovereign accounts for XCM transfers
assets *ARGS:
  yarn assets {{ARGS}}

# Initiate asset transfer
transfer *ARGS:
  yarn transfer {{ARGS}}

# Decode XCM data
decode *ARGS:
  yarn decode {{ARGS}}
