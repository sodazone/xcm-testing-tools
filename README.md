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

## Zombienet Setup

### Using Just

Ensure that you have [just](https://github.com/casey/just) installed on your system before proceeding with these steps.

From the root directory of the project, perform the following:

1. Download binaries:

```shell
just download
```

>[!NOTE]
> If you are running in a non x86_64 architecture, please download the appropiate binaries manually.

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

When successfully launched, you should see an output in your console similar to the one below:

<details>
  <summary>Zombienet Launch Output</summary>
   
   ```shell
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                            Network launched 🚀🚀                                                       │
├──────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Namespace        │ zombie-a1d940d226fdab4786ef5ae83243bd28                                                            │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Provider         │ native                                                                                             │
├──────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                             Node Information                                                          │
├──────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Name             │ alice                                                                                              │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Direct Link      │ https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:9900#/explorer                                    │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Prometheus Link  │ http://127.0.0.1:37621/metrics                                                                     │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Log Cmd          │ tail -f  /tmp/zombie-a1d940d226fdab4786ef5ae83243bd28_-16922-Qt9cqWI0vPx1/alice.log                │
├──────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                             Node Information                                                          │
├──────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Name             │ charlie                                                                                            │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Direct Link      │ https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:43581#/explorer                                   │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Prometheus Link  │ http://127.0.0.1:43643/metrics                                                                     │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Log Cmd          │ tail -f  /tmp/zombie-a1d940d226fdab4786ef5ae83243bd28_-16922-Qt9cqWI0vPx1/charlie.log              │
├──────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                             Node Information                                                          │
├──────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Name             │ bob                                                                                                │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Direct Link      │ https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:42271#/explorer                                   │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Prometheus Link  │ http://127.0.0.1:33155/metrics                                                                     │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Log Cmd          │ tail -f  /tmp/zombie-a1d940d226fdab4786ef5ae83243bd28_-16922-Qt9cqWI0vPx1/bob.log                  │
├──────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                             Node Information                                                          │
├──────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Name             │ asset-hub-collator1                                                                                │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Direct Link      │ https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:9910#/explorer                                    │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Prometheus Link  │ http://127.0.0.1:42899/metrics                                                                     │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Log Cmd          │ tail -f  /tmp/zombie-a1d940d226fdab4786ef5ae83243bd28_-16922-Qt9cqWI0vPx1/asset-hub-collator1.log  │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Parachain ID     │ 1000                                                                                               │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ChainSpec Path   │ /tmp/zombie-a1d940d226fdab4786ef5ae83243bd28_-16922-Qt9cqWI0vPx1/asset-hub-kusama-local-1000-roco… │
├──────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                             Node Information                                                          │
├──────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Name             │ astar-collator1                                                                                    │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Direct Link      │ https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:9920#/explorer                                    │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Prometheus Link  │ http://127.0.0.1:38369/metrics                                                                     │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Log Cmd          │ tail -f  /tmp/zombie-a1d940d226fdab4786ef5ae83243bd28_-16922-Qt9cqWI0vPx1/astar-collator1.log      │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Parachain ID     │ 2000                                                                                               │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ChainSpec Path   │ /tmp/zombie-a1d940d226fdab4786ef5ae83243bd28_-16922-Qt9cqWI0vPx1/shibuya-dev-2000-rococo-local.js… │
└──────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────┘
   ```
</details>

Please verify that your chains are producing blocks before proceeding to [test asset transfers](#testing-asset-transfers). If your Zombienet is not producing blocks or has stalled, please try restarting it.

### Manual Setup

> [!NOTE]
> For an easier alternative, refer to the [Zombienet Setup Using Just](#using-just) section above.

Follow these steps for manual setup of Zombienet:

1. Download the necessary binaries for launching Zombienet:

- [zombienet](https://github.com/paritytech/zombienet/releases)
- [polkadot](https://github.com/paritytech/polkadot/releases)
- [polkadot-parachain](https://github.com/paritytech/cumulus/releases)
- [astar-collator](https://github.com/AstarNetwork/Astar/releases)

2. Copy the binaries into `<root>/bin` and make sure that they are executable (`chmod 755 bin/*`).

3. Run Zombienet:
   
```shell
./bin/zombienet -p native spawn ./config/zn-asset-hub-astar.toml
```

## Setup with Other Parachains

To incorporate different parachain runtimes into Zombienet, download or build the binaries of the desired parachains and copy them into the `<root>/bin` directory. Update the configuration located at `<root>/config` to add the new chains before running Zombienet. 

The scripts mentioned earlier utilize the sample configuration `<root>/config/zn-asset-hub-astar.toml`. Alternatively, there's another configuration available that employs [Trappist](https://github.com/paritytech/trappist) as parachain 2000. However, it is important to note that Trappist employs `pallet-xcm`, which currently lacks support for the withdrawal of reserve-backed assets from a remote location. For additional information, refer to this [pull request](https://github.com/paritytech/polkadot-sdk/pull/1672).

---
**Notes on Polkadot Versions**

* If using Polkadot-SDK v1.1.0 binaries, you will need additional binaries `polkadot-prepare-worker` and `polkadot-execute-worker` ([ref](https://github.com/paritytech/polkadot/pull/7337))
* Currently Polkadot-SDK v1.1.0 binaries do not work with Zombienet preopen HRMP channel config. For preopen HRMP, use v1.0.0 binaries of `polkadot` and `polkadot-parachain`. Alternatively, use v1.1.0 and perform a force_open_hrmp_channel. More details in this [pull request](https://github.com/paritytech/polkadot-sdk/pull/1616).
---

## Testing Asset Transfers

> [!IMPORTANT]
> Ensure that Zombienet is launched and the chains are producing blocks before proceeding. If not, refer to [Zombienet Setup](#zombienet-setup) to set up your Zombienet.

### Assets Configuration
Before testing cross-chain transfers, run the following script to configure assets and foreign assets on the parachains, and fund the sovereign accounts on each chain.

```shell
just assets config/assets.json
```

This script executes a series of extrinsics across different chains to configure assets, foreign assets, and sovereign accounts required for cross-chain transfers. The script waits for each previous extrinsic to be finalized before executing the next one, so it may take some time to complete.

At the end of the script, you should see an output similar to the one shown below:

<details>
  <summary>Zombienet Launch Output</summary>

```shell
...
...
Transfering 2000000000000 to fund sibling sovereign account YYd75rNoMUyogjtjaJPjWX7QHvYky5BSHz1wTmQ3dXj2pk6 on parachain Kusama Asset Hub Local (nonce:1)
Transfering 2000000000000000000 to fund sibling sovereign account FBeL7EFTDeHnuViqaUHUXvhhUusN5FawDmHgfvzF97DXFr3 on parachain Shibuya Testnet (nonce:2)
Transaction status: Ready
Transaction status: Ready
Transaction status: {
  InBlock: '0xef4f7d39c92012747c6ea69b77cda09a9d0dd7f6e3d2b8e645193593b9ea293e'
}
Transaction status: {
  InBlock: '0xb968dbad489daeee698c2cef2ef03fb525641c21114c69fa12ccb42a702e1a81'
}
Transaction status: {
  Finalized: '0xef4f7d39c92012747c6ea69b77cda09a9d0dd7f6e3d2b8e645193593b9ea293e'
}
OK
```
</details>

The script uses the configuration in `./config/assets.json`, which registers the asset `RUSD` on parachain 1000 and foreign assets `xcRUSD` and `xcROC` on parachain 2000. Extend the configuration to add other assets and chains if needed.

### Assets Tranfser 

The transfer script uses [asset-transfer-api](https://github.com/paritytech/asset-transfer-api) to facilitate asset transfer calls.

To view the help menu:

```shell
just transfer -h
```

```shell
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

Example transfer from parachain 1000 to parachain 2000:

```shell
just transfer ws://127.0.0.1:9910 -s //Alice -d 2000 -r 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY -a 1984 -m 1500000000000
```

#### Inject Asset Registries

The `asset-transfer-api` contains registries only for well-known relay chains and system parachains (currently only Asset Hub). To use the `asset-transfer-api` for other parachains, inject an asset registry into the API.

Example transfer from relaychain to parachain 2000 (Shibuya) with an injected registry:

```shell
just transfer ws://127.0.0.1:9900 -s //Bob -d 2000 -r ajYMsCKsEAhEvHpeA4XqsfiA9v1CdzZPrCfS6pEfeGHW9j8 -a 'ROC' -m 3330000000 --asset-registry ./config/asset-registries/rococo-assethub-astar.json
```

#### Testing Batch Transfers

If an array is passed to the recipients parameter, the transfer script will generate a transfer call for each recipient and bundle them into a `utility.batch` extrinsic.

Example:

```shell
just transfer ws://127.0.0.1:9900 -s //Bob -d 2000 -r ajYMsCKsEAhEvHpeA4XqsfiA9v1CdzZPrCfS6pEfeGHW9j8 ZAP5o2BjWAo5uoKDE6b6Xkk4Ju7k6bDu24LNjgZbfM3iyiR -a 'ROC' -m 3330000000 --asset-registry ./config/asset-registries/rococo-assethub-astar.json
```

#### Testing UMP Messages

It's important to note that currently, the `asset-transfer-api` does not support UMP transfers i.e. transfers from parachain to relaychain ([ref](https://github.com/paritytech/asset-transfer-api/blob/a26de7723e7e3cbd35488b8b30547e6bc08be2c9/src/AssetTransferApi.ts#L602)). To conduct UMP transfers, you can utilize the Polkadot.js explorer to construct the extrinsic and sign it.

Here's an example of an encoded transfer from local Shibuya to local Rococo relay:

```
0x3700e903000000000000000000000000000000ca9a3b0000000000000000000000000301010100d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d00
```

You can paste this code into the `decode` tab of Polkadot.js app (`https://polkadot.js.org/apps/?rpc=<YOUR_RPC_WS_ENDPOINT>#/extrinsics/decode`) to inspect the decoded extrinsic.

---

Feel free to reach out if you encounter any issues or have questions related to this setup.

🌟 Happy testing!
