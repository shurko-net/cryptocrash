import { MutateOptions } from "@tanstack/react-query";
import type { ExtractAbiFunctionNames } from "abitype";
import { Abi, AbiParametersToPrimitiveTypes, ExtractAbiFunction } from "abitype";
import type { MergeDeepRecord } from "type-fest/source/merge-deep";
import { Address, TransactionReceipt, WriteContractErrorType } from "viem";
import { Config } from "wagmi";
import { WriteContractParameters, WriteContractReturnType } from "wagmi/actions";
import { WriteContractVariables } from "wagmi/query";
import deployedContractsData from "~~/contracts/deployedContracts";
import externalContractsData from "~~/contracts/externalContracts";
import dappConfig from "~~/dapp.config";

export type InheritedFunctions = { readonly [key: string]: string };

export type WriteAbiStateMutability = "nonpayable" | "payable";
type AbiStateMutability = "pure" | "view" | "nonpayable" | "payable";

export type GenericContract = {
  address: Address;
  abi: Abi;
  inheritedFunctions?: InheritedFunctions;
  external?: true;
};

type AddExternalFlag<T> = {
  [ChainId in keyof T]: {
    [ContractName in keyof T[ChainId]]: T[ChainId][ContractName] & { external?: true };
  };
};

const deepMergeContracts = <L extends Record<PropertyKey, any>, E extends Record<PropertyKey, any>>(
  local: L,
  external: E,
) => {
  const result: Record<PropertyKey, any> = {};
  const allKeys = Array.from(new Set([...Object.keys(external), ...Object.keys(local)]));
  for (const key of allKeys) {
    if (!external[key]) {
      result[key] = local[key];
      continue;
    }
    const amendedExternal = Object.fromEntries(
      Object.entries(external[key] as Record<string, Record<string, unknown>>).map(([contractName, declaration]) => [
        contractName,
        { ...declaration, external: true },
      ]),
    );
    result[key] = { ...local[key], ...amendedExternal };
  }
  return result as MergeDeepRecord<AddExternalFlag<L>, AddExternalFlag<E>, { arrayMergeMode: "replace" }>;
};

const contractsData = deepMergeContracts(deployedContractsData, externalContractsData);

type IsContractDeclarationMissing<TYes, TNo> = typeof contractsData extends { [key in ConfiguredChainId]: any }
  ? TNo
  : TYes;

export type GenericContractsDeclaration = {
  [chainId: number]: {
    [contractName: string]: GenericContract;
  };
};

type ContractsDeclaration = IsContractDeclarationMissing<GenericContractsDeclaration, typeof contractsData>;

type ConfiguredChainId = (typeof dappConfig)["targetNetworks"][0]["id"];

type Contracts = ContractsDeclaration[ConfiguredChainId];

export type ContractName = keyof Contracts;

export type Contract<TContractName extends ContractName> = Contracts[TContractName];

type InferContractAbi<TContract> = TContract extends { abi: infer TAbi } ? TAbi : never;

export type ContractAbi<TContractName extends ContractName = ContractName> = InferContractAbi<Contract<TContractName>>;

type WriteVariables = WriteContractVariables<Abi, string, any[], Config, number>;

export type TransactorFuncOptions = {
  onBlockConfirmation?: (txnReceipt: TransactionReceipt) => void;
  blockConfirmations?: number;
};

export type DappWriteContractOptions = MutateOptions<
  WriteContractReturnType,
  WriteContractErrorType,
  WriteVariables,
  unknown
> &
  TransactorFuncOptions;

export type AbiFunctionInputs<TAbi extends Abi, TFunctionName extends string> = ExtractAbiFunction<
  TAbi,
  TFunctionName
>["inputs"];

type OptionalTuple<T> = T extends readonly [infer H, ...infer R] ? readonly [H | undefined, ...OptionalTuple<R>] : T;

type Expand<T> = T extends object ? (T extends infer O ? { [K in keyof O]: O[K] } : never) : T;

type UnionToIntersection<U> = Expand<(U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never>;

export type AbiFunctionArguments<TAbi extends Abi, TFunctionName extends string> = AbiParametersToPrimitiveTypes<
  AbiFunctionInputs<TAbi, TFunctionName>
>;

export type FunctionNamesWithInputs<
  TContractName extends ContractName,
  TAbiStateMutability extends AbiStateMutability = AbiStateMutability,
> = Exclude<
  Extract<
    ContractAbi<TContractName>[number],
    {
      type: "function";
      stateMutability: TAbiStateMutability;
    }
  >,
  {
    inputs: readonly [];
  }
>["name"];

type UseDappArgsParam<
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>>,
> =
  TFunctionName extends FunctionNamesWithInputs<TContractName>
    ? {
        args: OptionalTuple<UnionToIntersection<AbiFunctionArguments<ContractAbi<TContractName>, TFunctionName>>>;
        value?: ExtractAbiFunction<ContractAbi<TContractName>, TFunctionName>["stateMutability"] extends "payable"
          ? bigint | undefined
          : undefined;
      }
    : {
        args?: never;
      };

export type DappWriteContractVariables<
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>, WriteAbiStateMutability>,
> = IsContractDeclarationMissing<
  Partial<WriteContractParameters>,
  {
    functionName: TFunctionName;
  } & UseDappArgsParam<TContractName, TFunctionName> &
    Omit<WriteContractParameters, "chainId" | "abi" | "address" | "functionName" | "args">
>;
