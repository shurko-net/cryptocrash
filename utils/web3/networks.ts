import { monadTestnet } from "../customChains";
import * as chains from "viem/chains";
import dappConfig from "~~/dapp.config";

type ChainAttributes = {
  color: string | [string, string];

  nativeCurrencyTokenAddress?: string;
};

export type ChainWithAttributes = chains.Chain & Partial<ChainAttributes>;

export const RPC_CHAIN_NAMES: Record<number, string> = {
  [monadTestnet.id]: "monad-testnet",
};

export const getAlchemyHttpUrl = (chainId: number) => {
  return dappConfig.alchemyApiKey && RPC_CHAIN_NAMES[chainId]
    ? `https://${RPC_CHAIN_NAMES[chainId]}.g.alchemy.com/v2/${dappConfig.alchemyApiKey}`
    : undefined;
};

export const NETWORKS_EXTRA_DATA: Record<string, ChainAttributes> = {
  [monadTestnet.id]: {
    color: "#200052",
  },
};

export function getBlockExplorerTxLink(chainId: number, txnHash: string) {
  const chainNames = Object.keys(chains);

  const targetChainArr = chainNames.filter(chainName => {
    const wagmiChain = chains[chainName as keyof typeof chains];
    return wagmiChain.id === chainId;
  });

  if (targetChainArr.length === 0) {
    return "";
  }

  const targetChain = targetChainArr[0] as keyof typeof chains;
  const blockExplorerTxURL = chains[targetChain]?.blockExplorers?.default?.url;

  if (!blockExplorerTxURL) {
    return "";
  }

  return `${blockExplorerTxURL}/tx/${txnHash}`;
}

export function getBlockExplorerAddressLink(network: chains.Chain, address: string) {
  const blockExplorerBaseURL = network.blockExplorers?.default?.url;
  if (network.id === chains.hardhat.id) {
    return `/blockexplorer/address/${address}`;
  }

  if (!blockExplorerBaseURL) {
    return `https://etherscan.io/address/${address}`;
  }

  return `${blockExplorerBaseURL}/address/${address}`;
}

export function getTargetNetworks(): ChainWithAttributes[] {
  return dappConfig.targetNetworks.map(targetNetwork => ({
    ...targetNetwork,
    ...NETWORKS_EXTRA_DATA[targetNetwork.id],
  }));
}
