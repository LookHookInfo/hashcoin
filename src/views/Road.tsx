import React from 'react';
import { Title, Text, Stack, List, ThemeIcon, SimpleGrid, Timeline, Tooltip, Group } from '@mantine/core';
import { Page } from '@/components/Page';
import { roadmapData, roadmapHeader, roadmapFooter, RoadmapItem } from '@/source/road.ts';
import { IconCheck, IconLoader, IconPoint } from '@tabler/icons-react';
import { CopyAddressButton } from '@/components/CopyButton';
import { Helmet } from 'react-helmet-async';

// Re-implement getStatusIcon to return the original ThemeIcon bullets
const getStatusIcon = (status: RoadmapItem['status']) => {
  let label = '';
  let color = 'gray';
  let icon = <IconPoint size={14} />;

  switch (status) {
    case 'completed':
      label = 'Completed';
      color = 'teal';
      icon = <IconCheck size={14} />;
      break;
    case 'partial':
      label = 'Partially completed';
      color = 'blue';
      icon = <IconLoader size={14} />;
      break;
    case 'planned':
      label = 'Planned';
      color = 'gray';
      icon = <IconPoint size={14} />;
      break;
  }

  return (
    <Tooltip label={label} withArrow position="right">
      <ThemeIcon size={22} radius="xl" color={color}>
        {icon}
      </ThemeIcon>
    </Tooltip>
  );
};

const Road: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Roadmap | Mining Hash</title>
        <meta name="description" content="Explore the Mining Hash project roadmap. See our completed milestones and our future plans for development, partnerships, and community growth." />
      </Helmet>
      <Stack gap="xl">
        {/* Header Card */}
        <Page>
          <Title order={1} ta="center">{roadmapHeader.title}</Title>
          <Text size="lg" c="dimmed" ta="center" mt="sm">{roadmapHeader.subtitle}</Text>
        </Page>

        {/* Phases Cards Grid */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          {roadmapData.map((phase, index) => (
            <Page key={index}>
              <Title order={3} style={{ display: 'flex', alignItems: 'center' }}>
                <ThemeIcon color="#A5D8FF" radius="xl" mr="sm">
                  {index + 1}
                </ThemeIcon>
                {phase.title}
              </Title>
              <Timeline lineWidth={2} bulletSize={22} mt="lg">
                {phase.items.map((item, itemIndex) => (
                  <Timeline.Item
                    key={itemIndex}
                    bullet={getStatusIcon(item.status)}
                    title={
                      <Group gap="xs">
                        <Text component="span">{item.text}</Text>
                        {item.address && <CopyAddressButton address={item.address} />}
                      </Group>
                    }
                  >
                    {item.subItems && (
                      <List
                        spacing="xs"
                        size="sm"
                        mt="xs"
                        c="dimmed"
                      >
                        {item.subItems.map((subItem, subIndex) => (
                          <List.Item key={subIndex}>{subItem.startsWith('•') ? subItem.substring(1).trim() : subItem}</List.Item>
                        ))}
                      </List>
                    )}
                  </Timeline.Item>
                ))}
              </Timeline>
            </Page>
          ))}
        </SimpleGrid>

        {/* Footer Card */}
        <Page>
          <Title order={3}>
            <Text span mr="sm">{roadmapFooter.icon}</Text>
            {roadmapFooter.title}
          </Title>
          <Text mt="sm" c="dimmed">{roadmapFooter.text}</Text>
        </Page>
      </Stack>
    </>
  );
};

export default Road;
