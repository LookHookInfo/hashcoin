import { Container, Flex, Loader, SimpleGrid, Title } from "@mantine/core";
import { useActiveAccount } from 'thirdweb/react';
import { useQuery } from "@tanstack/react-query";
import { getNFTs } from "thirdweb/extensions/erc1155";
import { NFT } from "thirdweb";

import { contractTools, contractStaking } from "@/utils/contracts";
import { ToolCard } from "@/components/ToolCard";

export default function Shop() {
    const account = useActiveAccount();

    if (!account) {
        return (
            <Flex justify="center" align="center" h="80vh">
                <Title order={3}>Please connect your wallet to start mining.</Title>
            </Flex>
        );
    }

    return <ShopContent address={account.address} />;
}

function ShopContent({ address }: { address: string }) {

    const { data: allTools, isLoading: isLoadingTools } = useQuery({
        queryKey: ["allTools"],
        queryFn: () => getNFTs({ contract: contractTools }),
    });

    if (isLoadingTools) {
        return <Flex justify="center" align="center" h="80vh"><Loader /></Flex>;
    }

    return (
        <Container fluid>
            <Flex direction="column" gap="xl">
                <div>
                    <Title order={3} mb="xs">inventory</Title>
                </div>



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
