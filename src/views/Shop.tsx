import { Anchor, Button, Container, Flex, Loader, SimpleGrid, Title, Tooltip, Text } from "@mantine/core";
import { useActiveAccount } from 'thirdweb/react';
import { useQuery } from "@tanstack/react-query";
import { getNFTs } from "thirdweb/extensions/erc1155";
import { NFT } from "thirdweb";
import { Helmet } from "react-helmet-async";
import { formatEther } from "viem";

import { contractTools, contractStaking } from "@/utils/contracts";
import { ToolCard } from "@/components/ToolCard";
import styles from "./Shop.module.css";
import { useGalxeRewardClaim } from "@/hooks/useGalxeRewardClaim";
import { useRoleClaim } from "@/hooks/useRoleClaim";

export default function Shop() {
    const account = useActiveAccount();

    return (
        <>
            <Helmet>
                <title>Mining & Tools | Mining Hash</title>
                <meta name="description" content="Start mining $HASH tokens by acquiring your tools. Explore the available NFT tools and manage your inventory to maximize your earnings on the Mining Hash platform." />
            </Helmet>
            {!account ? (
                <Flex justify="center" align="center" h="80vh">
                    <Title order={3}>Please connect your wallet to start mining.</Title>
                </Flex>
            ) : (
                <ShopContent address={account.address} />
            )}
        </>
    );
}

function ShopContent({ address }: { address: string }) {
    const { data: allTools, isLoading: isLoadingTools } = useQuery({
        queryKey: ["allTools"],
        queryFn: () => getNFTs({ contract: contractTools }),
    });

    const { canClaim, hasClaimed, isChecking: isCheckingReward, isClaiming: isClaimingReward, claimReward, availableRewardTokens, userRewardAmount } = useGalxeRewardClaim();
    const { canMint, hasMinted, isChecking: isCheckingRole, isMinting, claimRole } = useRoleClaim();

    if (isLoadingTools) {
        return <Flex justify="center" align="center" h="80vh"><Loader /></Flex>;
    }

    const rewardTooltipLabel = () => {
        if (!availableRewardTokens || !userRewardAmount) {
            return <Text>Loading rewards...</Text>;
        }
        const totalRewards = parseFloat(formatEther(availableRewardTokens)).toFixed(0);
        const perUserReward = parseFloat(formatEther(userRewardAmount)).toFixed(0);
        return (
            <Flex direction="column">
                <Text>Total Rewards: {totalRewards} HASH</Text>
                <Text>Earn {perUserReward} HASH on Galxe</Text>
            </Flex>
        );
    }

    return (
        <Container fluid>
            <Flex direction="column" gap="xl">
                <Flex justify="space-between" align="center">
                    <Title order={5} mb="xs">inventory</Title>
                    <Flex gap="md" align="center"> {/* Align items to center vertically */}
                        <Anchor href="https://app.galxe.com/quest/bAFdwDecXS6NRWsbYqVAgh/GCbZStYWKo" target="_blank" rel="noopener noreferrer" className={styles.galxeLink}>
                            Galxe
                        </Anchor>
                        <Button
                            size="sm"
                            className={`${styles.customConnectButton} ${canMint && !hasMinted ? styles.pulsatingGlow : ''}`}
                            onClick={claimRole}
                            disabled={isCheckingRole || isMinting || !canMint || hasMinted}
                            variant="default"
                        >
                            <Flex align="center" justify="center" gap="xs">
                                {isMinting && <Loader size="xs" />}
                                <span>{hasMinted ? "Minted" : "Badge"}</span>
                            </Flex>
                        </Button>
                        <Tooltip label={rewardTooltipLabel()}>
                            <Button
                                size="sm"
                                className={`${styles.customConnectButton} ${canClaim ? styles.pulsatingGlow : ''}`}
                                onClick={claimReward}
                                disabled={isCheckingReward || isClaimingReward || !canClaim}
                                variant="default"
                            >
                                <Flex align="center" justify="center" gap="xs">
                                    {isClaimingReward && <Loader size="xs" />}
                                    <span>{hasClaimed ? "Claimed" : "Reward"}</span>
                                </Flex>
                            </Button>
                        </Tooltip>
                    </Flex>
                </Flex>

                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                    {allTools?.map((tool: NFT) => (
                        <ToolCard
                            key={tool.id.toString()}
                            tool={tool}
                            address={address}
                            contractTools={contractTools}
                            contractStaking={contractStaking}
                        />
                    ))}
                </SimpleGrid>
            </Flex>
        </Container>
    );
}
