import { Anchor, Button, Center, Container, Flex, Loader, Pagination, SimpleGrid, Title, Tooltip, Text } from "@mantine/core";
import { useActiveAccount } from 'thirdweb/react';
import { NFT } from "thirdweb";
import { Helmet } from "react-helmet-async";
import { formatEther } from "viem";
import { useEffect, useState } from "react";

import { contractTools, contractStaking } from "@/utils/contracts";
import { ToolCard } from "@/components/ToolCard";
import styles from "./Shop.module.css";
import { useGalxeRewardClaim } from "@/hooks/useGalxeRewardClaim";
import { useRoleClaim } from "@/hooks/useRoleClaim";
import { useShopLogic } from "@/hooks/useShopLogic";

const TOKENS_PER_PAGE = 30;

export default function Shop() {
    const account = useActiveAccount();

    return (
        <>
            <Helmet>
                <title>Mining & Tools | Mining Hash</title>
                <meta name="description" content="Start mining $HASH tokens by acquiring your tools." />
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
    const { tools, user, states, isLoading, refresh } = useShopLogic();
    const [currentPage, setCurrentPage] = useState(1);

    const { canClaim, hasClaimed, isChecking: isCheckingReward, isClaiming: isClaimingReward, claimReward, availableRewardTokens, userRewardAmount } = useGalxeRewardClaim();
    const { canMint, hasMinted, isChecking: isCheckingRole, isMinting, claimRole } = useRoleClaim();

    const totalPages = Math.max(1, Math.ceil((tools?.length || 0) / TOKENS_PER_PAGE));
    const pageTools = tools.slice((currentPage - 1) * TOKENS_PER_PAGE, currentPage * TOKENS_PER_PAGE);

    if (isLoading) {
        return <Flex justify="center" align="center" h="80vh"><Loader color="blue" variant="dots" size="xl" /></Flex>;
    }

    const rewardTooltipLabel = () => {
        if (!availableRewardTokens || !userRewardAmount) return <Text>Loading rewards...</Text>;
        return (
            <Flex direction="column">
                <Text>Total Rewards: {parseFloat(formatEther(availableRewardTokens)).toFixed(0)} HASH</Text>
                <Text>Earn {parseFloat(formatEther(userRewardAmount)).toFixed(0)} HASH on Galxe</Text>
            </Flex>
        );
    }

    return (
        <Container fluid>
            <Flex direction="column" gap="xl">
                <Flex justify="space-between" align="center">
                    <Title order={5} mb="xs">inventory</Title>
                    <Flex gap="md" align="center">
                        <Anchor href="https://app.galxe.com/quest/bAFdwDecXS6NRWsbYqVAgh/GCbZStYWKo" target="_blank" rel="noopener noreferrer" className={styles.galxeLink}>
                            Galxe
                        </Anchor>
                        <Button
                            size="sm" variant="default"
                            className={`${styles.customConnectButton} ${canMint && !hasMinted ? styles.pulsatingGlow : ''}`}
                            onClick={claimRole} disabled={isCheckingRole || isMinting || !canMint || hasMinted}
                        >
                            <Flex align="center" justify="center" gap="xs">
                                {isMinting && <Loader size="xs" />}
                                <span>{hasMinted ? "Minted" : "Badge"}</span>
                            </Flex>
                        </Button>
                        <Tooltip label={rewardTooltipLabel()}>
                            <Button
                                size="sm" variant="default"
                                className={`${styles.customConnectButton} ${canClaim ? styles.pulsatingGlow : ''}`}
                                onClick={claimReward} disabled={isCheckingReward || isClaimingReward || !canClaim}
                            >
                                <Flex align="center" justify="center" gap="xs">
                                    {isClaimingReward && <Loader size="xs" />}
                                    <span>{hasClaimed ? "Claimed" : "Reward"}</span>
                                </Flex>
                            </Button>
                        </Tooltip>
                    </Flex>
                </Flex>

                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                    {pageTools.map((tool: NFT) => (
                        <ToolCard
                            key={tool.id.toString()}
                            tool={tool}
                            address={address}
                            contractTools={contractTools}
                            contractStaking={contractStaking}
                            state={states[tool.id.toString()]}
                            user={user}
                            onRefresh={refresh}
                        />
                    ))}
                </SimpleGrid>

                {totalPages > 1 && (
                    <Center mt="xl">
                        <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} color="blue" radius="xl" />
                    </Center>
                )}
            </Flex>
        </Container>
    );
}
