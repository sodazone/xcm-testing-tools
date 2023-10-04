# XCM Testing Tools

This repository contains a set of useful tools designed for setting up a zombienet and testing XCM asset transfers.
These tools utilize the [asset-transfer-api](https://github.com/paritytech/asset-transfer-api) under the hood to facilitate asset transfer calls.

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

> Note: if you are running in an non x86_64 architecture, please download the appropiate binaries manually.

```shell
just download
```

2. Run Zombienet:

```shell
just z
```

3. Set up assets and sovereign accounts for XCM transfers:

```shell
just assets conf/assets.json
```

4. Initiate a transfer:

```shell
just transfer ws://127.0.0.1:9910 -s //Alice -d 2000 -r 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY -a 1984 -m 1500000000000
```

## Manual Zombienet Setup

> Note: For an easier alternative, refer to the 'Zombienet Setup Using Just' section above.

Follow these steps for manual setup of Zombienet:

1. Download the necessary binaries for launching Zombienet:

- [zombienet](https://github.com/paritytech/zombienet/releases)
- [polkadot](https://github.com/paritytech/polkadot/releases)
- [polkadot-parachain](https://github.com/paritytech/cumulus/releases)
- [astar-collator](https://github.com/AstarNetwork/Astar/releases)

2. Copy the binaries into `<project-root>/bin` and make sure that they are executable (`chmod 755 bin/*`).

---
**Notes on Polkadot Versions**

* If using Polkadot-SDK v1.1.0 binaries, you will need additional binaries `polkadot-prepare-worker` and `polkadot-execute-worker` ([ref](https://github.com/paritytech/polkadot/pull/7337))
* Currently Polkadot-SDK v1.1.0 binaries do not work with Zombienet preopen HRMP channel config. If you want to use preopen HRMP, you will need v1.0.0 binaries of `polkadot` and `polkadot-parachain`. You can also use v1.1.0 and do a `force_open_hrmp_channel`. More details in this [pull request](https://github.com/paritytech/polkadot-sdk/pull/1616).
---

A sample Zombienet configuration file is located in `<project-root>/conf/zn-asset-hub-astar.toml`. 

To launch Zombienet with this configuration, execute the following command from the project root:

```shell
./bin/zombinet -p native spawn ./conf/zn-asset-hub-astar.toml
```

Ensure the project is built:

```shell
yarn install && yarn build
```

To set up assets and sovereign accounts required for an XCM asset transfer, use the following command:

```shell
yarn assets ./conf/assets.json
```

> You can modify the configuration file to register different assets than the default '1984' token.

## XCM Transfers

Use the following command to initiate XCM transfers:

```shell
yarn transfer [options] <url>
```

Example:

```shell
yarn transfer ws://127.0.0.1:9910 -s //Alice -d 2000 -r 5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw -a 1984 -m 1500000000000
```

---

Feel free to reach out if you encounter any issues or have questions related to this setup.

🌟 Happy testing!
