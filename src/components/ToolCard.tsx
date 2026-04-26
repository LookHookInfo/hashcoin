import { useState } from "react";
import { Box, Flex, Text, Button, Group, TextInput, Image as MantineImage, Grid } from "@mantine/core";
import { MediaRenderer, useActiveAccount, useReadContract } from 'thirdweb/react';
import { setApprovalForAll, claimTo, getClaimConditions } from "thirdweb/extensions/erc1155";
import { prepareContractCall, sendAndConfirmTransaction, ThirdwebContract, NFT, getContract } from "thirdweb";
import { formatUnits } from "viem";

import { client } from "@/lib/thirdweb/client";
import { AppTransactionButton } from "./AppTransactionButton";
import { USDC_ADDRESS } from "@/utils/contracts";
import classes from './ToolCard.module.css';

interface ToolCardProps {
    tool: NFT;
    address: string;
    contractTools: ThirdwebContract;
    contractStaking: ThirdwebContract;
    state: any;
    user: any;
    onRefresh: () => void;
}

export function ToolCard({ tool, address, contractTools, contractStaking, state, user, onRefresh }: ToolCardProps) {
    const [quantity, setQuantity] = useState<number | string>(1);
    const account = useActiveAccount();

    // 1. Возвращаем надежное получение цены через SDK
    const { data: claimConditions } = useReadContract(getClaimConditions, {
        contract: contractTools,
        tokenId: tool.id
    });
    const activeCondition = claimConditions?.[0];
    const price = activeCondition?.pricePerToken || 0n;
    const currency = activeCondition?.currency || "0x0000000000000000000000000000000000000000";
    const isUSDC = currency.toLowerCase() === USDC_ADDRESS.toLowerCase();

    const ownAmount = state?.balance || 0n;
    const stakedAmount = state?.staked || 0n;
    const claimableRewards = state?.rewards || 0n;
    const isApproved = user?.isApproved || false;

    const quantityBigInt = typeof quantity === 'string' ? BigInt(quantity) : BigInt(Math.floor(Number(quantity) || 0));
    const totalPrice = price * quantityBigInt;

    const hasInsufficientFunds = isUSDC ? (user?.usdcBalance < totalPrice) : false;
    const hasEnoughAllowance = isUSDC ? (user?.usdcAllowance >= totalPrice) : true;

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
                        <Text size="sm" c="dimmed" mt="sm" ta="center" h={40} style={{ overflow: 'hidden' }}>
                            {tool.metadata.description}
                        </Text>
                        
                        {activeCondition && (
                             <Text size="xs" mt="xs" c="dimmed">
                                 Claimed: {activeCondition.supplyClaimed.toString()} / {activeCondition.maxClaimableSupply.toString()}
                             </Text>
                        )}

                        <Group justify="center" align="center" mt="md">
                            <Button size="xs" variant="default" onClick={() => setQuantity(q => Math.max(1, Number(q) - 1))}>-</Button>
                            <TextInput
                                value={quantity}
                                onChange={(event) => {
                                    const val = event.currentTarget.value;
                                    if (val === '' || /^\d+$/.test(val)) setQuantity(val === '' ? 1 : Number(val));
                                }}
                                w={60} type="number" min={1} styles={{ input: { textAlign: 'center' } }}
                            />
                            <Button size="xs" variant="default" onClick={() => setQuantity(q => Number(q) + 1)}>+</Button>
                        </Group>
                    </Flex>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 5 }}>
                    <Flex direction="column" mt={{ base: 'md', md: 0 }} gap="xs" justify="center" h="100%">
                        <AppTransactionButton
                            onTransactionConfirmed={onRefresh}
                            transaction={async () => {
                                if (!account) throw new Error("Wallet not connected.");
                                if (isUSDC && !hasEnoughAllowance) {
                                    const approveTx = prepareContractCall({
                                        contract: getContract({ client, chain: contractTools.chain, address: currency }),
                                        method: "function approve(address spender, uint256 amount)",
                                        params: [contractTools.address, totalPrice], // Запрашиваем ровно ту сумму, которую тратит юзер
                                    });
                                    await sendAndConfirmTransaction({ transaction: approveTx, account });
                                }
                                return claimTo({ contract: contractTools, to: address!, tokenId: tool.id, quantity: quantityBigInt });
                            }}
                            disabled={!account || !activeCondition || hasInsufficientFunds}
                            style={{ width: '100%' }}
                        >
                            <Flex align="center" justify="center" gap="4px">
                                Buy {isUSDC ? `${formatUnits(totalPrice, 6)} USDC` : `${formatUnits(totalPrice, 18)} ETH`}
                                {isUSDC && <MantineImage src="/assets/usdc.png" h={14} w={14} />}
                            </Flex>
                        </AppTransactionButton>

                        <AppTransactionButton
                            onTransactionConfirmed={onRefresh}
                            transaction={async () => {
                                if (!account) throw new Error("Not connected");
                                if (!isApproved) {
                                    const approvalTx = setApprovalForAll({ contract: contractTools, operator: contractStaking.address, approved: true });
                                    await sendAndConfirmTransaction({ transaction: approvalTx, account });
                                }
                                return prepareContractCall({ contract: contractStaking, method: "function stake(uint256 _tokenId, uint64 _amount)", params: [tool.id, BigInt(quantity)] });
                            }}
                            disabled={ownAmount === 0n || quantityBigInt > ownAmount}
                            style={{ width: '100%' }}
                        >
                            {(isApproved ? "Equip" : "Approve & Equip")} ({ownAmount.toString()})
                        </AppTransactionButton>

                        <AppTransactionButton
                            onTransactionConfirmed={onRefresh}
                            transaction={() => prepareContractCall({ contract: contractStaking, method: "function withdraw(uint256, uint64)", params: [tool.id, BigInt(quantity)] })}
                            disabled={stakedAmount === 0n || quantityBigInt > stakedAmount}
                            style={{ width: '100%' }}
                        >
                            Unequip ({stakedAmount.toString()})
                        </AppTransactionButton>

                        <AppTransactionButton
                            onTransactionConfirmed={onRefresh}
                            transaction={() => prepareContractCall({ contract: contractStaking, method: "function claimRewards(uint256)", params: [tool.id] })}
                            disabled={claimableRewards === 0n}
                            style={{ width: '100%' }}
                        >
                            Claim {claimableRewards > 0n ? `(${parseFloat(formatUnits(claimableRewards, 18)).toFixed(2)})` : ''}
                        </AppTransactionButton>
                    </Flex>
                </Grid.Col>
            </Grid>
        </Box>
    );
}
