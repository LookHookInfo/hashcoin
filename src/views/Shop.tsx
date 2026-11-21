import { Button, Center, Container, Flex, Image, Loader, Pagination, SimpleGrid, Title } from "@mantine/core";
import { useAccount } from '@/hooks/useAccount';
import { Helmet } from "react-helmet-async";
import { useState } from "react";

import { contractTools, contractStaking } from "@/utils/contracts";
import { ToolCard } from "@/components/ToolCard";
import styles from "./Shop.module.css";
import { useRoleClaim } from "@/hooks/useRoleClaim";
import { useShopLogic } from "@/hooks/useShopLogic";
import type { ShopToolEntry } from "@/hooks/useShopLogic";

const TOKENS_PER_PAGE = 30;

export default function Shop() {
    const account = useAccount();

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
    const {
        tools, user, states, prices, isLoading, refresh,
        onBuyConfirmed, onEquipConfirmed, onUnequipConfirmed, onClaimRewardsConfirmed,
    } = useShopLogic();
    const [currentPage, setCurrentPage] = useState(1);

    const { canMint, hasMinted, isChecking: isCheckingRole, isMinting, claimRole } = useRoleClaim();

    const totalPages = Math.max(1, Math.ceil((tools?.length || 0) / TOKENS_PER_PAGE));
    const pageTools = tools.slice((currentPage - 1) * TOKENS_PER_PAGE, currentPage * TOKENS_PER_PAGE);

    if (isLoading) {
        return <Flex justify="center" align="center" h="80vh"><Loader color="blue" variant="dots" size="xl" /></Flex>;
    }

    return (
        <Container fluid>
            <Flex direction="column" gap="xl">
                <Flex justify="space-between" align="center">
                    <Title order={5} mb="xs">inventory</Title>
                    <Flex gap="md" align="center">
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
                        <Button
                            component="a"
                            href="https://app.uniswap.org/explore/pools/base/0x67d0fc5f92cb8481cfca8900f20ef21627fbe77f24fdb7210640b8ef08eeab72"
                            target="_blank"
                            rel="noopener noreferrer"
                            size="sm" variant="default"
                            className={styles.customConnectButton}
                        >
                            <Flex align="center" justify="center" gap="xs">
                                <Image src="/assets/uni.png" w={16} h={16} alt="Uniswap" />
                                <span>Buy HASH</span>
                            </Flex>
                        </Button>
                    </Flex>
                </Flex>

                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                    {pageTools.map((tool: ShopToolEntry) => (
                        <ToolCard
                            key={tool.id.toString()}
                            tool={tool}
                            address={address}
                            contractTools={contractTools}
                            contractStaking={contractStaking}
                            state={states[tool.id.toString()]}
                            user={user}
                            claimPrice={prices[tool.id.toString()]}
                            onRefresh={refresh}
                            onBuyConfirmed={onBuyConfirmed}
                            onEquipConfirmed={onEquipConfirmed}
                            onUnequipConfirmed={onUnequipConfirmed}
                            onClaimRewardsConfirmed={onClaimRewardsConfirmed}
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
