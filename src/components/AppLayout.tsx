import { AppShell, Group, Menu, Button, Image, Text, Skeleton, Anchor, Flex, Center, Loader } from '@mantine/core';
import { Outlet, Link } from 'react-router-dom';
import { Suspense } from 'react';
import { ConnectWalletButton } from './ConnectWalletButton';
import classes from './AppLayout.module.css';
import { useAccount } from '@/hooks/useAccount';
import { useDisconnect } from 'wagmi';
import { useDisplayName } from '@/hooks/useNameContract';
import { formatEther, formatUnits } from 'viem';
import { IconCopy, IconLogout } from '@tabler/icons-react';
import Logo from '@/assets/logo.png';
import Footer from './parts/Footer';
import { useShopFeed } from '@/hooks/useCoreAggregator';

export function AppLayout() {
   const account = useAccount();
   const { disconnect } = useDisconnect();

   return (
      <AppShell
         header={{ height: 60 }}
         footer={{ height: { base: 100, md: 80 } }}
         padding="md"
      >
         <AppShell.Header className={classes.header}>
            <div className={classes.headerInner}>
               <div className={classes.headerLeft}>
                  <AppLogo />
               </div>
               <div className={classes.headerCenter}>
                  <NavLinks />
               </div>
               <div className={classes.headerRight}>
                  {account ? (
                     <AccountMenu account={account} disconnect={() => disconnect()} />
                  ) : (
                     <ConnectWalletButton />
                  )}
               </div>
            </div>
         </AppShell.Header>

         <AppShell.Main>
            <Suspense fallback={<Center py={100}><Loader color="blue" variant="dots" size="xl" /></Center>}>
               <Outlet />
            </Suspense>
         </AppShell.Main>

         <AppShell.Footer>
            <Footer />
         </AppShell.Footer>
      </AppShell>
   );
}

function AppLogo() {
   return (
      <Anchor component={Link} to="/" style={{ textDecoration: 'none' }} className={classes.logoAnchor}>
         <Image mr={10} display='flex' w='48px' src={Logo} radius='100%' alt='Logo'
            style={{ border: '1px solid #666' }} />
         <Flex direction='column' pt={11} className={classes.logoText}>
            <Text size='sm' lh={0.5} c='gray.0'>Mining</Text>
            <Text size='xl' fw='bold' c='gray.0'>Hash</Text>
         </Flex>
      </Anchor>
   )
}

function NavLinks() {
   return (<Flex py={20} px={0} flex={1} align='center'
      justify={{ base: 'start', sm: 'center' }}>
      <Group justify="center" c='white'>
         <Link to="/gem" className={classes.navLink} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Image src="/assets/Gem.png" w={20} h={20} alt="Gem" />
            Gem
         </Link>
      </Group></Flex>)
}


type AccountMenuProps = {
   account: { address: `0x${string}` };
   disconnect: () => void;
};

function AccountMenu({ account, disconnect }: AccountMenuProps) {
   const { displayName: displayNameWithSuffix } = useDisplayName(account.address);
   const { data: feed, isLoading: isLoadingFeed } = useShopFeed(account.address);

   const balances = feed
      ? {
           hashBalance: feed.hashBalance,
           usdcBalance: feed.usdcBalance,
        }
      : undefined;

   const shortAddress = `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
   const displayName = displayNameWithSuffix || shortAddress;

   return (
      <Menu shadow="md" width={220}>
         <Menu.Target>
            <Button variant="light">
               {displayName}
            </Button>
         </Menu.Target>

         <Menu.Dropdown>
            <Menu.Label>My Balances</Menu.Label>
            <Menu.Item leftSection={<Image src='/assets/Hashcoin.png' w={18} h={18} />}>
               {isLoadingFeed ? <Skeleton height={16} width={80} radius="sm" /> : `${parseFloat(formatEther(balances?.hashBalance ?? 0n)).toFixed(2)} HASH`}
            </Menu.Item>
            <Menu.Item leftSection={<Image src='/assets/usdc.png' w={18} h={18} />}>
               {isLoadingFeed ? <Skeleton height={16} width={80} radius="sm" /> : `${parseFloat(formatUnits(balances?.usdcBalance ?? 0n, 6)).toFixed(2)} USDC`}
            </Menu.Item>
            <Menu.Divider />
            <Menu.Label>My Account</Menu.Label>
            <Menu.Item
               leftSection={<IconCopy size={14} />}
               onClick={() => navigator.clipboard.writeText(account.address)}
            >
               Copy Address
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
               color="red"
               leftSection={<IconLogout size={14} />}
               onClick={disconnect}
            >
               Disconnect
            </Menu.Item>
         </Menu.Dropdown>
      </Menu>
   )
}
