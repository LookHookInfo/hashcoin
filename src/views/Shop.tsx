import { Container, Flex, Loader, SimpleGrid, Title, Button, Image } from "@mantine/core";
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { useQuery } from "@tanstack/react-query";
import { getNFTs } from "thirdweb/extensions/erc1155";
import { NFT, prepareContractCall } from "thirdweb";
import { Helmet } from "react-helmet-async";
import { AppTransactionButton } from "@/components/AppTransactionButton";

import { contractTools, contractStaking, contractFarmRole } from "@/utils/contracts";
import { ToolCard } from "@/components/ToolCard";

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

    const { data: canMintRole, isLoading: isLoadingCanMint } = useReadContract({
        contract: contractFarmRole,
        method: "function canMint(address user) view returns (bool)",
        params: [address],
    });

    const { data: roleBalance, isLoading: isLoadingRoleBalance } = useReadContract({
        contract: contractFarmRole,
        method: "function balanceOf(address owner) view returns (uint256)",
        params: [address],
    });

    const hasMintedRole = roleBalance && roleBalance > 0n;

    if (isLoadingTools) {
        return <Flex justify="center" align="center" h="80vh"><Loader /></Flex>;
    }

    return (
        <Container fluid>
            <Flex direction="column" gap="xl">
                <Flex justify="space-between" align="center">
                    <Title order={3} mb="xs">inventory</Title>
                    <AppTransactionButton
                        transaction={() => prepareContractCall({
                            contract: contractFarmRole,
                            method: "function mint()",
                            params: []
                        })}
                        disabled={isLoadingCanMint || isLoadingRoleBalance || hasMintedRole || !canMintRole}
                        style={
                            (canMintRole && !hasMintedRole)
                                ? { animation: 'pulsatingGlow 2s infinite alternate' }
                                : undefined
                        }
                    >
                        <Flex align="center" justify="center" gap="xs">
                            {hasMintedRole ? "Minted" : "Claim Role"}
                            <Image src="/assets/Farm.png" h={20} w={20} />
                        </Flex>
                    </AppTransactionButton>
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
