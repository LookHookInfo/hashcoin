import { AppShell, Group, Menu, Button, Image, Text, Skeleton, Anchor, Flex } from '@mantine/core';
import { Outlet, Link } from 'react-router-dom';
import { ConnectWalletButton } from './ConnectWalletButton';
import classes from './AppLayout.module.css';
import { useActiveAccount, useActiveWallet, useDisconnect, useReadContract } from 'thirdweb/react';
import { useNameContract } from '@/hooks/useNameContract';
import { formatEther, formatUnits } from 'viem';
import { hashcoinContract, usdcContract } from '@/utils/contracts';
import { IconCopy, IconLogout, IconExternalLink } from '@tabler/icons-react';
import Logo from '@/assets/logo.png';
import Footer from './parts/Footer';

export function AppLayout() {
   const account = useActiveAccount();
   const wallet = useActiveWallet();
   const { disconnect } = useDisconnect();

   return (
      <AppShell
         header={{ height: 60 }}
         footer={{ height: { base: 130, md: 70 } }}
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
                  {account && wallet ? (
                     <AccountMenu account={account} wallet={wallet} disconnect={disconnect} />
                  ) : (
                     <ConnectWalletButton />
                  )}
               </div>
            </div>
         </AppShell.Header>

         <AppShell.Main>
            <Outlet />
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
         <Anchor href="https://guild.xyz/hashcoin" target="_blank" className={classes.navLink}>Guild
            <IconExternalLink size={16} /> </Anchor>
      </Group></Flex>)
}


type AccountMenuProps = {
   account: NonNullable<ReturnType<typeof useActiveAccount>>;
   wallet: NonNullable<ReturnType<typeof useActiveWallet>>;
   disconnect: (wallet: NonNullable<ReturnType<typeof useActiveWallet>>) => void;
};

function AccountMenu({ account, wallet, disconnect }: AccountMenuProps) {
   const { registeredName } = useNameContract(() => { });

   const { data: hashBalance, isLoading: isLoadingHashBalance } = useReadContract({
      contract: hashcoinContract,
      method: "function balanceOf(address) view returns (uint256)",
      params: [account.address],
   });

   const { data: usdcBalance, isLoading: isLoadingUsdcBalance } = useReadContract({
      contract: usdcContract,
      method: "function balanceOf(address) view returns (uint256)",
      params: [account.address],
   });

   const shortAddress = `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
   const displayName = registeredName ? `${registeredName}.hash` : shortAddress;

   return (
      <Menu shadow="md" width={220}>
         <Menu.Target>
            <Button variant="light">
               {displayName}
            </Button>
         </Menu.Target>

         <Menu.Dropdown>
            <Menu.Label>My Balances</Menu.Label>
            <Menu.Item leftSection={<Image src='/assets/Hash coin 200.png' w={18} h={18} />}>
               {isLoadingHashBalance ? <Skeleton height={16} width={80} radius="sm" /> : `${parseFloat(formatEther(hashBalance ?? 0n)).toFixed(2)} HASH`}
            </Menu.Item>
            <Menu.Item leftSection={<Image src='/assets/usdc.png' w={18} h={18} />}>
               {isLoadingUsdcBalance ? <Skeleton height={16} width={80} radius="sm" /> : `${parseFloat(formatUnits(usdcBalance ?? 0n, 6)).toFixed(2)} USDC`}
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
               onClick={() => disconnect(wallet)}
            >
               Disconnect
            </Menu.Item>
         </Menu.Dropdown>
      </Menu>
   )
}
