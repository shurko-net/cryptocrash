import { useState } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { MutateOptions } from "@tanstack/react-query";
import { Abi, ExtractAbiFunctionNames } from "abitype";
import toast from "react-hot-toast";
import { Config, UseWriteContractParameters, useAccount, useWriteContract } from "wagmi";
import { WriteContractErrorType, WriteContractReturnType } from "wagmi/actions";
import { WriteContractVariables } from "wagmi/query";
import { useDeployedContractInfo, useTransactor } from "~~/hooks/web3";
import {
  ContractAbi,
  ContractName,
  DappWriteContractOptions,
  DappWriteContractVariables,
} from "~~/utils/web3/contract";

export const useCustomWriteContract = <TContractName extends ContractName>(
  contractName: TContractName,
  writeContractParams?: UseWriteContractParameters,
) => {
  const { chain } = useAccount();
  const writeTx = useTransactor();
  const [isMining, setIsMining] = useState(false);
  const { targetNetwork } = useTargetNetwork();

  const wagmiContractWrite = useWriteContract(writeContractParams);

  const { data: deployedContractData } = useDeployedContractInfo(contractName);

  const sendContractWriteAsyncTx = async <
    TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>, "nonpayable" | "payable">,
  >(
    variables: DappWriteContractVariables<TContractName, TFunctionName>,
    options?: DappWriteContractOptions,
  ) => {
    if (!deployedContractData) {
      toast.error("Target Contract is not deployed, did you forget to run `yarn deploy`?");
      return;
    }

    if (!chain?.id) {
      toast.error("Please connect your wallet");
      return;
    }
    if (chain?.id !== targetNetwork.id) {
      toast.error("You are on the wrong network");
      return;
    }

    try {
      setIsMining(true);
      const { blockConfirmations, onBlockConfirmation, ...mutateOptions } = options || {};
      const makeWriteWithParams = () =>
        wagmiContractWrite.writeContractAsync(
          {
            abi: deployedContractData.abi as Abi,
            address: deployedContractData.address,
            ...variables,
          } as WriteContractVariables<Abi, string, any[], Config, number>,
          mutateOptions as
            | MutateOptions<
                WriteContractReturnType,
                WriteContractErrorType,
                WriteContractVariables<Abi, string, any[], Config, number>,
                unknown
              >
            | undefined,
        );
      const writeTxResult = await writeTx(makeWriteWithParams, { blockConfirmations, onBlockConfirmation });

      return writeTxResult;
    } catch (e: any) {
      throw e;
    } finally {
      setIsMining(false);
    }
  };

  const sendContractWriteTx = <
    TContractName extends ContractName,
    TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>, "nonpayable" | "payable">,
  >(
    variables: DappWriteContractVariables<TContractName, TFunctionName>,
    options?: Omit<DappWriteContractOptions, "onBlockConfirmation" | "blockConfirmations">,
  ) => {
    if (!deployedContractData) {
      toast.error("Target Contract is not deployed, did you forget to run `yarn deploy`?");
      return;
    }
    if (!chain?.id) {
      toast.error("Please connect your wallet");
      return;
    }
    if (chain?.id !== targetNetwork.id) {
      toast.error("You are on the wrong network");
      return;
    }

    wagmiContractWrite.writeContract(
      {
        abi: deployedContractData.abi as Abi,
        address: deployedContractData.address,
        ...variables,
      } as WriteContractVariables<Abi, string, any[], Config, number>,
      options as
        | MutateOptions<
            WriteContractReturnType,
            WriteContractErrorType,
            WriteContractVariables<Abi, string, any[], Config, number>,
            unknown
          >
        | undefined,
    );
  };

  return {
    ...wagmiContractWrite,
    isMining,
    writeContractAsync: sendContractWriteAsyncTx,
    writeContract: sendContractWriteTx,
  };
};
