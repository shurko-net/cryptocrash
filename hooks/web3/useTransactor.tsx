import { getPublicClient } from "@wagmi/core";
import toast from "react-hot-toast";
import { Hash, SendTransactionParameters, TransactionReceipt, WalletClient } from "viem";
import { Config, useWalletClient } from "wagmi";
import { SendTransactionMutate } from "wagmi/query";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { getBlockExplorerTxLink, getParsedError } from "~~/utils/web3";
import { TransactorFuncOptions } from "~~/utils/web3/contract";

type TransactionFunc = (
  tx: (() => Promise<Hash>) | Parameters<SendTransactionMutate<Config, undefined>>[0],
  options?: TransactorFuncOptions,
) => Promise<Hash | undefined>;

const TxnNotification = ({ message, blockExplorerLink }: { message: string; blockExplorerLink?: string }) => {
  return (
    <div className={`flex flex-col ml-1 cursor-default`}>
      <p className="my-0">{message}</p>
      {blockExplorerLink && blockExplorerLink.length > 0 ? (
        <a href={blockExplorerLink} target="_blank" rel="noreferrer" className="block link text-md">
          check out transaction
        </a>
      ) : null}
    </div>
  );
};

export const useTransactor = (_walletClient?: WalletClient): TransactionFunc => {
  let walletClient = _walletClient;
  const { data } = useWalletClient();
  if (walletClient === undefined && data) {
    walletClient = data;
  }

  const result: TransactionFunc = async (tx, options) => {
    if (!walletClient) {
      toast.error("Cannot access account");
      console.error("⚡️ ~ file: useTransactor.tsx ~ error");
      return;
    }

    let notificationId = null;
    let transactionHash: Hash | undefined = undefined;
    let transactionReceipt: TransactionReceipt | undefined;
    let blockExplorerTxURL = "";
    try {
      const network = await walletClient.getChainId();
      const publicClient = getPublicClient(wagmiConfig);
      notificationId = toast.loading(<TxnNotification message="Awaiting for user confirmation" />);
      if (typeof tx === "function") {
        const result = await tx();
        transactionHash = result;
      } else if (tx != null) {
        transactionHash = await walletClient.sendTransaction(tx as SendTransactionParameters);
      } else {
        throw new Error("Incorrect transaction passed to transactor");
      }
      toast.remove(notificationId);

      blockExplorerTxURL = network ? getBlockExplorerTxLink(network, transactionHash) : "";

      notificationId = toast.loading(
        <TxnNotification message="Waiting for transaction to complete." blockExplorerLink={blockExplorerTxURL} />,
      );

      transactionReceipt = await publicClient.waitForTransactionReceipt({
        hash: transactionHash,
        confirmations: options?.blockConfirmations,
      });
      toast.remove(notificationId);

      if (transactionReceipt.status === "reverted") throw new Error("Transaction reverted");

      toast.success(
        <TxnNotification message="Transaction completed successfully!" blockExplorerLink={blockExplorerTxURL} />,
        {
          icon: "🎉",
        },
      );

      if (options?.onBlockConfirmation) options.onBlockConfirmation(transactionReceipt);
    } catch (error: any) {
      if (notificationId) {
        toast.remove(notificationId);
      }
      console.error("⚡️ ~ file: useTransactor.ts ~ error", error);
      const message = getParsedError(error);

      if (transactionReceipt?.status === "reverted") {
        toast.error(<TxnNotification message={message} blockExplorerLink={blockExplorerTxURL} />);
        throw error;
      }

      toast.error(message);
      throw error;
    }

    return transactionHash;
  };

  return result;
};
