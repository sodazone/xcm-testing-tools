export type XCMRegistryJunction = {
	[x: string]: string | number | undefined | null | Partial<Record<string, string | number | undefined | null>>;
};
export type XCMRegistryJunctions = {
	[x: string]: string | number | undefined | null | Partial<Record<string, string | number | undefined | null>>;
}[];

export type InterMultiLocationJunctionType = 'Here' | 'X1' | 'X2' | 'X3' | 'X4' | 'X5' | 'X6' | 'X7' | 'X8';
type XCMRegistryInteriorMultiLocation = Partial<
	Record<InterMultiLocationJunctionType, null | XCMRegistryJunction | XCMRegistryJunctions>
>;

export interface XCMMultiLocation {
	parents: number;
	interior: XCMRegistryInteriorMultiLocation;
}

export interface AssetConfig {
  id: number;
    name: string;
    symbol: string;
    location: number;
    decimals: number;
    minBalance: number;
    isSufficient: boolean;
    assetMultiLocation: XCMMultiLocation;
}

export interface NetworkConfig {
  id: number;
  ws: string;
}

export interface Config {
  networks: NetworkConfig[];
  assets: AssetConfig[];
  xcAssets: AssetConfig[];
}