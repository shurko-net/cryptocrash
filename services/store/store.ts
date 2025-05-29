import { AuthenticationStatus } from "@rainbow-me/rainbowkit";
import { create } from "zustand";
import dappConfig from "~~/dapp.config";
import { ChainWithAttributes } from "~~/utils/web3";

type GlobalState = {
  targetNetwork: ChainWithAttributes;
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => void;
  authStatus: AuthenticationStatus;
  setAuthStatus: (newStatus: AuthenticationStatus) => void;
};

export const useGlobalState = create<GlobalState>(set => ({
  targetNetwork: dappConfig.targetNetworks[0],
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => set(() => ({ targetNetwork: newTargetNetwork })),
  authStatus: "loading",
  setAuthStatus: (newStatus: AuthenticationStatus) => set(() => ({ authStatus: newStatus })),
}));
