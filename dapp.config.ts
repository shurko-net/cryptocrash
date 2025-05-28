import { monadTestnet } from "./utils/customChains";
import * as chains from "viem/chains";

export type ScaffoldConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

const dappConfig = {
  targetNetworks: [monadTestnet],

  pollingInterval: 30000,

  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "",

  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "0a79da1799af007b9382d4e1d94df703",

  onlyLocalBurnerWallet: true,
} as const satisfies ScaffoldConfig;

export default dappConfig;
