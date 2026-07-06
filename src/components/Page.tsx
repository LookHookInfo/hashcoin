import { Card, Box, Text, Title, CopyButton, ActionIcon, Tooltip, Flex } from '@mantine/core'
import React from 'react'
import { shortenAddress } from '@/utils/addressUtils';
import { IconCopy, IconCheck } from '@tabler/icons-react';

interface PageProps {
   children: React.ReactNode;
   span?: number; // Add span prop
}

export function Page({ children }: PageProps): React.ReactNode {
   return <Card mb={20} py={{ base: 20, sm: 40 }}
      px={{ base: 10, sm: 20 }} radius='md' style={{ backgroundColor: 'var(--mantine-color-dark-7)' }}>{children}</Card>
}

export function CardTitle({ v, ta = "left" }: { v: string, ta?: React.CSSProperties['textAlign'] }): React.ReactNode {
   return <Title order={4} mb={16} ta={ta}>{v}</Title>
}

export function Subtitle({ v, ta }: { v: string, ta?: React.CSSProperties['textAlign'] }): React.ReactNode {
   return <Title order={5} mb={4} ta={ta}>{v}</Title>
}

export function ContractBox({ title, val }: { title: string, val: string }): React.ReactNode {
   const isEvmAddress = /^0x[a-fA-F0-9]{40}$/.test(val);

   return (
      <Box ta='center' py={10}>
         <Text fw='bold' size='sm' mb={3}>{title}</Text>
         <Flex align="center" justify="center" gap={5}>
            <Text className='break' size='sm'>
               {isEvmAddress ? shortenAddress(val) : val}
            </Text>
            {isEvmAddress && (
               <CopyButton value={val} timeout={2000}>
                  {({ copied, copy }) => (
                     <Tooltip label={copied ? 'Copied' : 'Copy address'} withArrow position="right">
                        <ActionIcon variant="subtle" color={copied ? 'teal' : '#A5D8FF'} onClick={copy} size="sm">
                           {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                        </ActionIcon>
                     </Tooltip>
                  )}
               </CopyButton>
            )}
         </Flex>
      </Box>
   );
}
