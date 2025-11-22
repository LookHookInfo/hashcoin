import { useState, useEffect, useCallback } from "react";
import { readContract, prepareContractCall, waitForReceipt } from "thirdweb";
import { client } from "../lib/thirdweb/client";
import { chain } from "../lib/thirdweb/chain";
import { nameContract, hashcoinContract } from "../utils/contracts";
import { useSendTransaction, useActiveAccount } from "thirdweb/react";
import { useQueryClient } from "@tanstack/react-query";

type NameContractStatus = "error" | "taken" | "success" | "idle";

export function useNameContract(setStatus: (status: NameContractStatus) => void) {
  const account = useActiveAccount();
  const queryClient = useQueryClient();
  const [price, setPrice] = useState<bigint | null>(null);
  const [displayPrice, setDisplayPrice] = useState<bigint | null>(null);
  const [confirmedHash, setConfirmedHash] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [registeredName, setRegisteredName] = useState<string | null>(null);
  const [maxNameLength, setMaxNameLength] = useState<number | null>(null);
  const [maxNamesPerAddress, setMaxNamesPerAddress] = useState<number | null>(null);
  const [registeredNamesCount, setRegisteredNamesCount] = useState<number | null>(null);
  const { mutateAsync: sendTx, isPending } = useSendTransaction();

  useEffect(() => {
    setMaxNameLength(15);
    setMaxNamesPerAddress(20);
  }, []);

  useEffect(() => {
    if (account?.address) {
      (async () => {
        try {
          const balance = await readContract({
            contract: nameContract,
            method: "function balanceOf(address owner) view returns (uint256)",
            params: [account.address],
          });
          setRegisteredNamesCount(Number(balance));
        } catch (e) {
          console.error("Failed to fetch registered names count:", e);
          setRegisteredNamesCount(null);
        }
      })();
    }
    else {
      setRegisteredNamesCount(null);
    }
  }, [account?.address, confirmedHash]);

  useEffect(() => {
    (async () => {
      let priceBigInt: bigint;
      try {
        const basePrice = await readContract({
          contract: nameContract,
          method: "function PRICE() view returns (uint256)",
          params: [],
        });
        priceBigInt = BigInt(basePrice.toString());
        setPrice(priceBigInt);
      } catch (e) {
        console.error("Failed to get price:", e);
        return;
      }

      if (account?.address) {
        try {
          const userHasDiscount = await readContract({
            contract: nameContract,
            method: "function hasDiscount(address user) view returns (bool)",
            params: [account.address],
          });

          if (userHasDiscount) {
            setDisplayPrice(priceBigInt / BigInt(2));
          } else {
            setDisplayPrice(priceBigInt);
          }
        } catch (e) {
          console.error("Failed to get discount info:", e);
          setDisplayPrice(priceBigInt);
          setStatus("error");
        }
      }
      else {
        setDisplayPrice(priceBigInt);
      }
    })();
  }, [account?.address, setStatus]);

  useEffect(() => {
    if (account?.address) {
      const fetchName = async () => {
        try {
          const name = await readContract({
            contract: nameContract,
            method: "function getPrimaryName(address user) view returns (string)",
            params: [account.address],
          });
          setRegisteredName(name);
        } catch (e) {
          console.error("Failed to fetch registered name:", e);
          setRegisteredName(null);
        }
      };
      fetchName();
    }
    else {
      setRegisteredName(null);
    }
  }, [account?.address, confirmedHash]);

  const approve = useCallback(async () => {
    if (!displayPrice) {
      return false;
    }
    try {
      const call = await prepareContractCall({
        contract: hashcoinContract,
        method: "function approve(address spender, uint256 value)",
        params: [nameContract.address, displayPrice],
      });
      const tx = await sendTx(call);
      if (!tx?.transactionHash) {
        return false;
      }
      await waitForReceipt({ client, chain, transactionHash: tx.transactionHash });
      return true;
    } catch (err: unknown) {
      console.error("Approve error: ", err);
      return false;
    }
  }, [displayPrice, sendTx]);

  const register = useCallback(async (name: string) => {
    setConfirmedHash(null);
    if (!name) {
      return false;
    }
    try {
      const call = await prepareContractCall({
        contract: nameContract,
        method: "function register(string name_)",
        params: [name],
      });
      const tx = await sendTx(call);
      if (!tx?.transactionHash) {
        return false;
      }
      setIsConfirming(true);
      const receipt = await waitForReceipt({ client, chain, transactionHash: tx.transactionHash });
      setConfirmedHash(receipt.transactionHash);
      queryClient.invalidateQueries({ queryKey: ['thirdweb'] });
      setStatus("taken");
      return true;
    } catch (err: unknown) {
      console.error("Registration error: ", err);
      return false;
    } finally {
      setIsConfirming(false);
    }
  }, [sendTx, setStatus, queryClient]);

  const unifiedClaim = useCallback(async (name: string) => {
    setIsConfirming(true);
    try {
      const approved = await approve();
      if (!approved) {
        setIsConfirming(false);
        return;
      }
      const registered = await register(name);
      if (!registered) {
        setIsConfirming(false);
        return;
      }
    } catch (err: unknown) {
      console.error("Unified claim error: ", err);
    } finally {
      setIsConfirming(false);
    }
  }, [approve, register]);

  const isNameTaken = useCallback(async (name: string): Promise<boolean> => {
    const taken = await readContract({
      contract: nameContract,
      method: "function isNameTaken(string nameToCheck) view returns (bool)",
      params: [name],
    });
    return taken;
  }, []);

  return {
    price,
    displayPrice,
    confirmedHash,
    isConfirming,
    isPending,
    registeredName,
    unifiedClaim,
    isNameTaken,
    maxNameLength,
    maxNamesPerAddress,
    registeredNamesCount,
  };
}
