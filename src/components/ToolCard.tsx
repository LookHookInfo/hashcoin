import { useState } from "react";
import { Box, Flex, Loader, Text, Button, Group, TextInput, Image as MantineImage, Grid } from "@mantine/core";
import { MediaRenderer, useActiveAccount, useReadContract } from 'thirdweb/react';
import { useQuery } from "@tanstack/react-query";
import { balanceOf as balanceOfErc1155, isApprovedForAll, setApprovalForAll, claimTo, getClaimConditions } from "thirdweb/extensions/erc1155";
import { balanceOf as balanceOfErc20 } from "thirdweb/extensions/erc20";
import { prepareContractCall, sendAndConfirmTransaction, ThirdwebContract, NFT } from "thirdweb";
import { formatUnits } from "viem";
import { getContract } from "thirdweb";

import { client } from "@/lib/thirdweb/client";
import { chain } from "@/lib/thirdweb/chain";
import { AppTransactionButton } from "./AppTransactionButton";
import classes from './ToolCard.module.css';

interface ToolCardProps {
    tool: NFT;
    address: string;
    contractTools: ThirdwebContract;
    contractStaking: ThirdwebContract;
}

export function ToolCard({ tool, address, contractTools, contractStaking }: ToolCardProps) {
    const [quantity, setQuantity] = useState<number | string>(1);
    const account = useActiveAccount();

    const { data: balance, isLoading: isLoadingBalance } = useQuery({
        queryKey: ["balance", tool.id.toString(), address],
        queryFn: () => balanceOfErc1155({ contract: contractTools, owner: address, tokenId: tool.id })
    });

    const { data: stakeInfo, isLoading: isLoadingStakeInfo } = useReadContract({
        contract: contractStaking,
        method: "function getStakeInfoForToken(uint256 _tokenId, address _staker) external view returns (uint256, uint256)",
        params: [tool.id, address],
    });

    const { data: claimConditions, isLoading: isLoadingClaimConditions } = useReadContract(getClaimConditions, {
        contract: contractTools,
        tokenId: tool.id
    });

    const activeClaimCondition = claimConditions && claimConditions.length > 0 ? claimConditions[0] : undefined;

    const { data: isApproved, isLoading: isLoadingIsApproved } = useQuery({
        queryKey: ["isApproved", address, contractStaking.address],
        queryFn: async () => {
            if (!account) return false;
            return isApprovedForAll({ contract: contractTools, owner: account.address, operator: contractStaking.address });
        },
        enabled: !!account
    });

    const currencyAddress = activeClaimCondition?.currency;
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const currencyContract = currencyAddress ? getContract({ client, chain: chain, address: currencyAddress }) : getContract({ client, chain: chain, address: ZERO_ADDRESS });
    const price = activeClaimCondition?.pricePerToken || 0n;
    const quantityBigInt = typeof quantity === 'string' ? BigInt(quantity) : BigInt(Math.floor(Number(quantity) || 0));
    const totalPrice = price * quantityBigInt;

    const { data: currencyBalance, isLoading: isCurrencyBalanceLoading } = useReadContract(balanceOfErc20, {
        contract: currencyContract,
        address: address,
        queryOptions: { enabled: !!address && currencyAddress !== ZERO_ADDRESS }
    });

    const { data: allowance, isLoading: isLoadingAllowance } = useReadContract({
        contract: currencyContract,
        method: "function allowance(address, address) view returns (uint256)",
        params: address ? [address, contractTools.address] : [ZERO_ADDRESS, contractTools.address],
        queryOptions: { enabled: !!address && currencyAddress !== ZERO_ADDRESS }
    });

    const hasEnoughAllowance = allowance !== undefined && allowance >= totalPrice;

    const { data: currencySymbol, isLoading: isLoadingCurrencySymbol } = useReadContract({
        contract: currencyContract,
        method: "function symbol() view returns (string)",
        params: [],
        queryOptions: { enabled: currencyAddress !== ZERO_ADDRESS }
    });

    if (isLoadingBalance || isLoadingStakeInfo || isLoadingClaimConditions || isLoadingAllowance || isLoadingCurrencySymbol || isCurrencyBalanceLoading || isLoadingIsApproved) {
        return <Box style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '1rem', minHeight: '300px' }}><Loader /></Box>;
    }

    const [stakedAmount, claimableRewards] = stakeInfo || [0n, 0n];
    const ownAmount = balance || 0n;

    // handleEquip is now an inline function within the AppTransactionButton
    // Refetching approval will be handled by AppTransactionButton's global invalidation

    const hasInsufficientFunds = currencyBalance !== undefined && currencyBalance < totalPrice;

    return (
        <Box style={{ backgroundColor: 'var(--mantine-color-dark-7)', borderRadius: '8px', padding: '1rem' }}>
            <Grid>
                <Grid.Col span={{ base: 12, md: 7 }}>
                    <Flex direction="column" align="center">
                        <Box className={classes.imageContainer}>
                            <MediaRenderer client={client} src={tool.metadata.image} style={{ width: '100%', height: '100%', borderRadius: '4px' }} />
                            <Box className={classes.titleCurtain}>
                                <Text fw={500} size="sm">{tool.metadata.name}</Text>
                            </Box>
                        </Box>
                        <Text size="sm" c="dimmed" mt="sm" ta="center">
                            {tool.metadata.description}
                        </Text>

                        {activeClaimCondition && (
                            <Text size="sm" mt="xs" ta="center">
                                Claimed: {activeClaimCondition.supplyClaimed.toString()} / {activeClaimCondition.maxClaimableSupply.toString()}
                            </Text>
                        )}

                        <Group justify="center" align="center" mt="md">
                            <Button size="xs" variant="default" onClick={() => setQuantity(q => Math.max(1, Number(q) - 1))}>-</Button>
                            <TextInput
                                value={quantity}
                                onChange={(event) => {
                                    const val = event.currentTarget.value;
                                    if (val === '' || /^\d+$/.test(val)) {
                                        setQuantity(val === '' ? 1 : Number(val));
                                    }
                                }}
                                w={60}
                                type="number"
                                min={1}
                                styles={{ input: { textAlign: 'center' } }}
                            />
                            <Button size="xs" variant="default" onClick={() => setQuantity(q => Number(q) + 1)}>+</Button>
                        </Group>
                    </Flex>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 5 }}>
                    <Flex direction="column" mt={{ base: 'md', md: 0 }} gap="xs" justify="center" h="100%">
                        <AppTransactionButton
                            transaction={async () => {
                                if (!account) throw new Error("Wallet not connected.");
                                // Check for approval if currency is not native token
                                if (currencyAddress !== ZERO_ADDRESS && !hasEnoughAllowance) {
                                    const approveTx = prepareContractCall({
                                        contract: currencyContract,
                                        method: "function approve(address spender, uint256 amount)",
                                        params: [contractTools.address, totalPrice],
                                    });
                                    await sendAndConfirmTransaction({
                                        transaction: approveTx,
                                        account: account,
                                    });
                                }
                                // Return the claim transaction
                                return claimTo({
                                    contract: contractTools,
                                    to: address!,
                                    tokenId: tool.id,
                                    quantity: quantityBigInt,
                                });
                            }}
                            disabled={!account || !activeClaimCondition || hasInsufficientFunds}
                            style={{ width: '100%' }}
                        >
                            <Flex align="center" justify="center" gap="xs">
                                Buy {currencySymbol === 'USDC' ? `$${parseFloat(formatUnits(price, 6)).toFixed(2)} USDC` : `${formatUnits(price, 18)} ETH`}
                                {currencySymbol === 'USDC' && <MantineImage src="/assets/usdc.png" h={16} w={16} />}
                            </Flex>
                        </AppTransactionButton>

                        <AppTransactionButton
                            transaction={async () => { // Original handleEquip logic inlined here
                                if (!account) throw new Error("Not connected");
                                if (!isApproved) {
                                    const approvalTx = setApprovalForAll({ contract: contractTools, operator: contractStaking.address, approved: true });
                                    await sendAndConfirmTransaction({ transaction: approvalTx, account });
                                }
                                const stakeTx = prepareContractCall({ contract: contractStaking, method: "function stake(uint256 _tokenId, uint64 _amount)", params: [tool.id, BigInt(quantity)] });
                                return stakeTx;
                            }}
                            disabled={ownAmount === 0n || quantityBigInt > ownAmount}
                            style={{ width: '100%' }}
                        >
                            {(isApproved ? "Equip" : "Approve & Equip")} ({ownAmount.toString()})
                        </AppTransactionButton>

                        <AppTransactionButton
                            transaction={() => prepareContractCall({ contract: contractStaking, method: "function withdraw(uint256, uint64)", params: [tool.id, BigInt(quantity)] })}
                            disabled={stakedAmount === 0n || quantityBigInt > stakedAmount}
                            style={{ width: '100%' }}
                        >
                            Unequip ({stakedAmount.toString()})
                        </AppTransactionButton>

                        <AppTransactionButton
                            transaction={() => prepareContractCall({ contract: contractStaking, method: "function claimRewards(uint256)", params: [tool.id] })}
                            disabled={claimableRewards === 0n}
                            style={{ width: '100%' }}
                        >
                            Claim {claimableRewards ? `(${parseFloat(formatUnits(claimableRewards, 18)).toFixed(2)})` : ''}
                        </AppTransactionButton>
                    </Flex>
                </Grid.Col>
            </Grid>
        </Box>
    );
}