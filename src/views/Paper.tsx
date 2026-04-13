import React from 'react';
import { Title, Text, Stack, Button, Table, Group, List, SimpleGrid } from '@mantine/core';
import { Page } from '@/components/Page';
import { paperData, paperHeader, PaperSection } from '@/source/paper.ts';
import { CopyAddressButton } from '@/components/CopyButton';
import { IconDownload } from '@tabler/icons-react';
import { Helmet } from 'react-helmet-async';

const PaperPage: React.FC = () => {

  const renderContent = (contentItem: PaperSection['content'][0]) => {
    if (typeof contentItem === 'string') {
      if (contentItem.startsWith('•')) {
        return <List.Item>{contentItem.substring(1).trim()}</List.Item>;
      }
      if (contentItem.match(/^\d\./)) {
        return <Text c="dimmed" mt="xs">{contentItem}</Text>;
      }
      return <Text c="dimmed" mt="sm">{contentItem}</Text>;
    }

    if (contentItem.type === 'table') {
      const head = (
        <Table.Tr>
          {contentItem.headers.map((header, index) => (
            <Table.Th key={index}>{header}</Table.Th>
          ))}
        </Table.Tr>
      );

      const body = contentItem.rows.map((row, rowIndex) => (
        <Table.Tr key={rowIndex}>
          {row.map((cell, cellIndex) => (
            <Table.Td key={cellIndex}>
              {typeof cell === 'string' && (cell.includes('$') || cell.includes('%')) ? (
                <Text component="span" c="#A5D8FF">{cell}</Text>
              ) : (
                <Text component="span">{cell}</Text>
              )}
            </Table.Td>
          ))}
        </Table.Tr>
      ));

      return (
        <Table mt="md" striped withTableBorder withColumnBorders>
          <Table.Thead>{head}</Table.Thead>
          <Table.Tbody>{body}</Table.Tbody>
        </Table>
      );
    }

    return null;
  };

  return (
    <>
      <Helmet>
        <title>White Paper | Mining Hash</title>
        <meta name="description" content="Read the official White Paper for the Mining Hash project. Get a deep dive into our technology, tokenomics, business model, and long-term vision." />
      </Helmet>
      <Stack gap="xl">
              {/* Header Card */}
              <Page>
                <Title order={1} ta="center">{paperHeader.title}</Title>
                <Text size="lg" c="dimmed" ta="center" mt="sm">{paperHeader.subtitle}</Text>
              </Page>
        
              {/* Content Sections Grid */}
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                {paperData.map((section, index) => (
                  <Page key={index}>
                    <Title order={3}>
                      {section.icon && <Text span mr="sm">{section.icon}</Text>}
                      {section.title}
                    </Title>
                    <Stack mt="md" gap="xs">
                      {section.content.map((item, itemIndex) => {
                        // Special handling for lists starting with '•'
                        if (typeof item === 'string' && item.startsWith('•')) {
                          // Collect all list items together
                          const listItems = [];
                          for (let i = itemIndex; i < section.content.length; i++) {
                            const currentItem = section.content[i];
                            if (typeof currentItem === 'string' && currentItem.startsWith('•')) {
                              listItems.push(currentItem);
                            } else {
                              break;
                            }
                          }
                          // If we are at the first list item, render the whole list
                          if (itemIndex === section.content.findIndex(i => typeof i === 'string' && i.startsWith('•'))) {
                            return (
                              <List c="dimmed" spacing="xs" mt="sm">
                                {listItems.map((li, liIndex) => (
                                  <List.Item key={liIndex}>{li.substring(1).trim()}</List.Item>
                                ))}
                              </List>
                            );
                          }
                          return null; // Don't render subsequent list items individually
                        }
                        return <div key={itemIndex}>{renderContent(item)}</div>;
                      })}
                    </Stack>
                    {section.addresses && (
                      <Stack mt="md" gap="xs">
                        {section.addresses.map((addr, addrIndex) => (
                          <Group key={addrIndex}>
                            <Text fw={500}>{addr.title}:</Text>
                            <CopyAddressButton address={addr.val} />
                          </Group>
                        ))}
                      </Stack>
                    )}
                    {section.title === 'Conclusion' && (
                      <Group justify="center" mt="xl">
                        <Button
                          component="a"
                          href="/assets/Mining Hash.pdf"
                          download
                          size="lg"
                          leftSection={<IconDownload size={20} />}
                        >
                          Download White Paper
                        </Button>
                      </Group>
                    )}
                  </Page>
                ))}
              </SimpleGrid>
      </Stack>
    </>
  );
};

export default PaperPage;