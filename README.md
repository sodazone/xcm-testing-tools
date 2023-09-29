# XCM Test Tools

Some useful tools to set up a zombienet and test XCM asset transfers.

Uses `asset-transfer-api` under-the-hood to make asset transfer calls.

## Install

1. Install the latest LTS version of [Node.js](https://nodejs.org/en/).

2. Enable [Corepack](https://github.com/nodejs/corepack#how-to-install) at the root of the project:

```shell
corepack enable
```
3. Install dependencies:

```shell
yarn install
```
4. Build Ocelloids libraries:

```shell
yarn build
```

## Zombienet Setup

Download the necessary binaries for launching zombienet:

- [zombienet](https://github.com/paritytech/zombienet/releases)
- [polkadot](https://github.com/paritytech/polkadot-sdk/releases)
- [polkadot-parachain](https://github.com/paritytech/polkadot-sdk/releases)
- [trappist](https://github.com/paritytech/trappist)

Copy the binaries into `<root>/bin` and make sure that they are executable.

NOTES:

1. If using Polkadot-SDK v1.1.0 binaries, you will need additional binaries `polkadot-prepare-worker` and `polkadot-execute-worker` ([ref](https://github.com/paritytech/polkadot/pull/7337))
2. Currently Polkadot-SDK v1.1.0 binaries do not work with Zombienet preopen HRMP channel config. If you want to use preopen HRMP, you will need v1.0.0 binaries of `polkadot` and `polkadot-parachain`. You can also use v1.1.0 and do a `force_open_hrmp_channel`. More details in this [pull request](https://github.com/paritytech/polkadot-sdk/pull/1616).

There is a sample Zombienet configuration file found in `<root>/zombienet.toml`. You can spin up Zombienet with this command from project root:

```shell
./bin/<zombienet_binary> -p native spawn ./zombienet.toml | tee zombienet.log
```

