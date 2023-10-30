# XCM Testing Tools

This repository contains a set of useful tools designed for setting up a zombienet and testing XCM asset transfers.

## Installation

Follow these steps to set up the project on your system:

1. Install the latest LTS version of [Node.js](https://nodejs.org/en/).

2. Enable [Corepack](https://github.com/nodejs/corepack#how-to-install) at the root of the project:

```shell
corepack enable
```

3. Install dependencies:

```shell
yarn install
```

4. Build:

```shell
yarn build
```

## Zombienet Setup Using Just

Ensure that you have [just](https://github.com/casey/just) installed on your system before proceeding with these steps.

From the root directory of the project, perform the following:

1. Download binaries:

> Note: if you are running in a non x86_64 architecture, please download the appropiate binaries manually.

```shell
just download
```

The script will download the following binaries:
- zombienet
- polkadot
- polkadot-parachain
- astar-collator

2. Run Zombienet:

```shell
just z
```

The script will launch a network of one relay chain `rococo-local` and two parachains, `asset-hub-kusama-local` (paraId:1000) and `shibuya-dev` (paraId:2000).

## Manual Zombienet Setup

> Note: For an easier alternative, refer to the 'Zombienet Setup Using Just' section above.

Follow these steps for manual setup of Zombienet:

1. Download the necessary binaries for launching Zombienet:

- [zombienet](https://github.com/paritytech/zombienet/releases)
- [polkadot](https://github.com/paritytech/polkadot/releases)
- [polkadot-parachain](https://github.com/paritytech/cumulus/releases)
- [astar-collator](https://github.com/AstarNetwork/Astar/releases)

2. Copy the binaries into `<project-root>/bin` and make sure that they are executable (`chmod 755 bin/*`).

3. Run Zombienet:
   
```shell
./bin/zombienet -p native spawn ./config/zn-asset-hub-astar.toml
```

## Setup with Other Parachains

To incorporate different parachain runtimes into Zombienet, follow these straightforward steps. Begin by downloading or building the binaries of the desired parachain. Then, copy these binaries into the `<root-project>/bin` directory and update the Zombienet configuration located at `<root-project>/config`. The scripts mentioned earlier utilize the sample configuration `<root-project>/config/zn-asset-hub-astar.toml`. Alternatively, there's another configuration available that employs [Trappist](https://github.com/paritytech/trappist) as parachain 2000.

However, it's important to note that Trappist employs `pallet-xcm`, which currently lacks support for the withdrawal of reserve-backed assets from a remote location. For additional information, refer to this [pull request](https://github.com/paritytech/polkadot-sdk/pull/1672).

---
**Notes on Polkadot Versions**

* If using Polkadot-SDK v1.1.0 binaries, you will need additional binaries `polkadot-prepare-worker` and `polkadot-execute-worker` ([ref](https://github.com/paritytech/polkadot/pull/7337))
* Currently Polkadot-SDK v1.1.0 binaries do not work with Zombienet preopen HRMP channel config. For preopen HRMP, use v1.0.0 binaries of `polkadot` and `polkadot-parachain`. Alternatively, use v1.1.0 and perform a force_open_hrmp_channel. More details in this [pull request](https://github.com/paritytech/polkadot-sdk/pull/1616).
---

## Testing Asset Transfers

> Ensure that Zombienet is launched and the chains are producing blocks before proceeding.

### Asset Set-up

Before testing cross-chain transfers, run the following script to set up assets and foreign assets on the parachains, and fund the sovereign accounts on each chain.

```shell
just assets config/assets.json
```

This script will execute a series of extrinsics across different chains to configure assets, foreign assets, and sovereign accounts necessary for cross-chain transfers.

The script uses the configuration in `./config/assets.json`, which registers the asset `RUSD` on Asset Hub and foreign assets `xcRUSD` and `xcROC` on Shibuya. Extend the configuration to add other assets and chains if needed.

### Asset Transfer

The transfer script uses [asset-transfer-api](https://github.com/paritytech/asset-transfer-api) to facilitate asset transfer calls.

To view the help menu:

```
> just transfer -h

Usage: transfer [options] <url>

Transfer XCM assets.

Arguments:
  url                                   RPC endpoint URL

Options:
  -V, --version                         output the version number
  -s, --seed <seed>                     private account seed (default: "//Alice")
  -d, --dest <dest>                     destination chain id
  -r, --recipients <recipients...>      recipient account addresses
  -a, --assets <assets...>              asset ids
  -m, --amounts <amounts...>            asset amounts
  -x, -xcm-version <xcmVersion>         XCM version (default: "3")
  --asset-registry <assetRegistryPath>  path to injected asset registry
  -h, --help                            display help for command


  Example call:
    $ transfer ws://127.0.0.1:9944 -s //Alice -d 2000 -r 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY -a 1984 -m 1500000000000
```

Example transfer from Asset Hub to Shibuya:

```shell
just transfer ws://127.0.0.1:9910 -s //Alice -d 2000 -r 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY -a 1984 -m 1500000000000
```

#### Inject Asset Registries

The `asset-transfer-api` contains registries only for well-known relay chains and system parachains (currently only Asset Hub). To use the `asset-transfer-api` for other parachains, inject an asset registry into the API.

Example transfer from Rococo to Shibuya with an injected registry:

```
just transfer ws://127.0.0.1:9900 -s //Bob -d 2000 -r ajYMsCKsEAhEvHpeA4XqsfiA9v1CdzZPrCfS6pEfeGHW9j8 -a 'ROC' -m 3330000000 --asset-registry ./config/asset-registries/rococo-assethub-astar.json
```

#### Testing Batch Transfers

If an array is passed to the recipients parameter, the transfer script will generate a transfer call for each recipient and bundle them into a `utility.batch` extrinsic.

Example:

```
just transfer ws://127.0.0.1:9900 -s //Bob -d 2000 -r ajYMsCKsEAhEvHpeA4XqsfiA9v1CdzZPrCfS6pEfeGHW9j8 ZAP5o2BjWAo5uoKDE6b6Xkk4Ju7k6bDu24LNjgZbfM3iyiR -a 'ROC' -m 3330000000 --asset-registry ./config/asset-registries/rococo-assethub-astar.json
```

#### Testing UMP Messages

It's important to note that currently, the `asset-transfer-api` does not support UMP transfers i.e. transfers from parachain to relaychain ([ref](https://github.com/paritytech/asset-transfer-api/blob/a26de7723e7e3cbd35488b8b30547e6bc08be2c9/src/AssetTransferApi.ts#L602)). To conduct UMP transfers, you can utilize the Polkadot.js explorer to construct the extrinsic and sign it.

Here's an example of an encoded transfer from local Shibuya to local Rococo:

```
0x3700e903000000000000000000000000000000ca9a3b0000000000000000000000000301010100d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d00
```

You can paste this code into the `decode` tab of Polkadot.js app (`https://polkadot.js.org/apps/?rpc=<YOUR_RPC_WS_ENDPOINT>#/extrinsics/decode`) to inspect the decoded extrinsic.

---

Feel free to reach out if you encounter any issues or have questions related to this setup.

🌟 Happy testing!
