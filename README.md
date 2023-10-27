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

---
**Notes on Polkadot Versions**

* If using Polkadot-SDK v1.1.0 binaries, you will need additional binaries `polkadot-prepare-worker` and `polkadot-execute-worker` ([ref](https://github.com/paritytech/polkadot/pull/7337))
* Currently Polkadot-SDK v1.1.0 binaries do not work with Zombienet preopen HRMP channel config. If you want to use preopen HRMP, you will need v1.0.0 binaries of `polkadot` and `polkadot-parachain`. You can also use v1.1.0 and do a `force_open_hrmp_channel`. More details in this [pull request](https://github.com/paritytech/polkadot-sdk/pull/1616).
---

## Testing Asset Transfers

> Make sure that Zombienet is launched and the chains are producing blocks before proceeding.

### Asset Set-up

Before we can start testing out cross-chain transfers, we first need to set up the assets and foreign assets on the parachains, and fund the sovereign accounts on each chain.

Run:
```shell
just assets config/assets.json
```

The script will make a series of extrinsics across the different chains to set up assets, foreign assets and sovereign accounts required to make cross-chain transfers.

The script uses the configuration found in `./config/assets.json`, which registers the asset `RUSD` on Asset Hub and foreign assets `xcRUSD` and `xcROC` on Shibuya. You can extend the configuration to add other assets if required.

### Asset Transfer

The transfer script utilizes [asset-transfer-api](https://github.com/paritytech/asset-transfer-api) under the hood to facilitate asset transfer calls.

To see the help menu:

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

The `asset-transfer-api` only contain registries for the well-known relay chains and system parachains (currently only Asset Hub). As such, to use the `asset-transfer-api` for other parachains, we will need to inject an asset registry to the API.

Example transfer from Rococo to Shibuya with injected registry:

```
just transfer ws://127.0.0.1:9900 -s //Bob -d 2000 -r ajYMsCKsEAhEvHpeA4XqsfiA9v1CdzZPrCfS6pEfeGHW9j8 -a 'ROC' -m 3330000000 --asset-registry ./config/asset-registries/rococo-assethub-astar.json
```

#### Testing Batch Transfers

If an array is passed to the recipients parameter, the transfer script will automatically generate a transfer call for each recipient and bundle them into a `utility.batch` extrinsic.

Example:

```
just transfer ws://127.0.0.1:9900 -s //Bob -d 2000 -r ajYMsCKsEAhEvHpeA4XqsfiA9v1CdzZPrCfS6pEfeGHW9j8 ZAP5o2BjWAo5uoKDE6b6Xkk4Ju7k6bDu24LNjgZbfM3iyiR -a 'ROC' -m 3330000000 --asset-registry ./config/asset-registries/rococo-assethub-astar.json
```

---

Feel free to reach out if you encounter any issues or have questions related to this setup.

🌟 Happy testing!
