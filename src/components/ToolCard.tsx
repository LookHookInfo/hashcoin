import { useState } from "react";
import { Box, Flex, Text, Button, Group, TextInput, Image as MantineImage, Grid } from "@mantine/core";
import { useAccount } from "@/hooks/useAccount";
import { erc20Abi, formatUnits, maxUint256 } from "viem";

import { AppTransactionButton } from "./AppTransactionButton";
import { USDC_ADDRESS, ERC1155_ABI, type ContractRef } from "@/utils/contracts";
import { writeAndWait } from "@/lib/wagmi/tx";
import { getIpfsUrl } from "@/hooks/useTokenLogic";
import type { ShopToolEntry } from "@/hooks/useShopLogic";
import type { ToolPrice } from "@/hooks/useCoreAggregator";
import classes from './ToolCard.module.css';

const NATIVE_TOKEN_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" as const;

interface ToolCardProps {
    tool: ShopToolEntry;
    address: string;
    contractTools: ContractRef;
    contractStaking: ContractRef;
    state: { balance: bigint; staked: bigint; rewards: bigint } | undefined;
    user: { isApproved: boolean; usdcBalance: bigint; usdcAllowance: bigint };
    claimPrice?: ToolPrice;
    onRefresh: () => void;
    onBuyConfirmed?: (tokenId: string, qty: bigint) => void;
    onEquipConfirmed?: (tokenId: string, qty: bigint) => void;
    onUnequipConfirmed?: (tokenId: string, qty: bigint) => void;
    onClaimRewardsConfirmed?: (tokenId: string) => void;
}

export function ToolCard({
    tool, address: _address, contractTools, contractStaking, state, user, claimPrice, onRefresh,
    onBuyConfirmed, onEquipConfirmed, onUnequipConfirmed, onClaimRewardsConfirmed,
}: ToolCardProps) {
    const [quantity, setQuantity] = useState<number | string>(1);
    const account = useAccount();

    const price = claimPrice?.pricePerToken ?? 0n;
    const currency = (claimPrice?.currency ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
    const isUSDC = currency.toLowerCase() === USDC_ADDRESS.toLowerCase();
    const isNative = currency.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();

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
                            <img
                                src={`/assets/tools/${tool.id.toString()}.png`}
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = getIpfsUrl(tool.metadata.image as string); }}
                                loading="eager"
                                decoding="async"
                                style={{ width: '100%', height: '100%', borderRadius: '4px', objectFit: 'contain' }}
                                alt={tool.metadata.name as string | undefined}
                            />
                            <Box className={classes.titleCurtain}>
                                <Text fw={500} size="sm">{tool.metadata.name as string | undefined}</Text>
                            </Box>
                        </Box>
                        <Text size="sm" c="dimmed" mt="xs" ta="center">
                            Speed: {tool.hashPower}/hour
                        </Text>
                        {claimPrice && claimPrice.maxClaimableSupply > 0n && (
                             <Text size="xs" mt={2} c="dimmed">
                                 Claimed: {claimPrice.supplyClaimed.toString()} / {claimPrice.maxClaimableSupply.toString()}
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
                            onTransactionConfirmed={() => {
                                if (onBuyConfirmed) onBuyConfirmed(tool.id.toString(), quantityBigInt);
                                else onRefresh();
                            }}
                            transaction={async () => {
                                if (!account) throw new Error("Wallet not connected.");
                                if (isUSDC && !hasEnoughAllowance) {
                                    await writeAndWait({
                                        address: currency,
                                        abi: erc20Abi,
                                        functionName: "approve",
                                        args: [contractTools.address, totalPrice],
                                    });
                                }
                                return {
                                    address: contractTools.address,
                                    abi: contractTools.abi,
                                    functionName: "claim",
                                    args: [
                                        account.address,
                                        tool.id,
                                        quantityBigInt,
                                        currency,
                                        price,
                                        {
                                            proof: [] as `0x${string}`[],
                                            quantityLimitPerWallet: 0n,
                                            pricePerToken: maxUint256,
                                            currency: "0x0000000000000000000000000000000000000000" as `0x${string}`,
                                        },
                                        "0x" as `0x${string}`,
                                    ],
                                    value: isNative ? totalPrice : 0n,
                                };
                            }}
                            disabled={!account || hasInsufficientFunds}
                            style={{ width: '100%', paddingLeft: 8, paddingRight: 8 }}
                        >
                            <Flex align="center" justify="center" gap={4} wrap="nowrap" style={{ minWidth: 0 }}>
                                <span style={{ whiteSpace: 'nowrap' }}>
                                    Buy {isUSDC ? `${formatUnits(totalPrice, 6)} USDC` : `${formatUnits(totalPrice, 18)} ETH`}
                                </span>
                                {isUSDC && <MantineImage src="/assets/usdc.png" h={14} w={14} style={{ flexShrink: 0 }} />}
                            </Flex>
                        </AppTransactionButton>

                        <AppTransactionButton
                            onTransactionConfirmed={() => {
                                if (onEquipConfirmed) onEquipConfirmed(tool.id.toString(), quantityBigInt);
                                else onRefresh();
                            }}
                            transaction={async () => {
                                if (!account) throw new Error("Not connected");
                                if (!isApproved) {
                                    await writeAndWait({
                                        address: contractTools.address,
                                        abi: ERC1155_ABI,
                                        functionName: "setApprovalForAll",
                                        args: [contractStaking.address, true],
                                    });
                                }
                                return {
                                    address: contractStaking.address,
                                    abi: contractStaking.abi,
                                    functionName: "stake",
                                    args: [tool.id, BigInt(quantity)],
                                };
                            }}
                            disabled={ownAmount === 0n || quantityBigInt > ownAmount}
                            style={{ width: '100%' }}
                        >
                            {(isApproved ? "Equip" : "Approve & Equip")} ({ownAmount.toString()})
                        </AppTransactionButton>

                        <AppTransactionButton
                            onTransactionConfirmed={() => {
                                if (onUnequipConfirmed) onUnequipConfirmed(tool.id.toString(), quantityBigInt);
                                else onRefresh();
                            }}
                            transaction={() => ({
                                address: contractStaking.address,
                                abi: contractStaking.abi,
                                functionName: "withdraw",
                                args: [tool.id, BigInt(quantity)],
                            })}
                            disabled={stakedAmount === 0n || quantityBigInt > stakedAmount}
                            style={{ width: '100%' }}
                        >
                            Unequip ({stakedAmount.toString()})
                        </AppTransactionButton>

                        <AppTransactionButton
                            onTransactionConfirmed={() => {
                                if (onClaimRewardsConfirmed) onClaimRewardsConfirmed(tool.id.toString());
                                else onRefresh();
                            }}
                            transaction={() => ({
                                address: contractStaking.address,
                                abi: contractStaking.abi,
                                functionName: "claimRewards",
                                args: [tool.id],
                            })}
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


