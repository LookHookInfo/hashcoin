import { Container, Group, Anchor, Text } from "@mantine/core";
import { IconBrandTelegram, IconBrandDiscord, IconBrandX, IconBrandGithub, IconExternalLink } from '@tabler/icons-react';
import { Link } from "react-router-dom";
import classes from '../AppLayout.module.css';

export default function Footer() {
   return (
      <footer className={classes.footer}>
         <Container className={classes.inner} py={0}>
            {/* Navigation Links */}
            <Group className={classes.links} gap="lg" justify="center">
               <Link to="/coin" className={classes.navLink}>Coin</Link>
               <Link to="/road" className={classes.navLink}>Road</Link>
               <Link to="/paper" className={classes.navLink}>Paper</Link>
               <Anchor href="https://guild.xyz/hashcoin" target="_blank" className={classes.navLink}>
                  Guild <IconExternalLink size={16} style={{ verticalAlign: 'middle' }} />
               </Anchor>
            </Group>

            {/* Social Links + Ecosystem */}
            <Group gap="xs" justify="center" wrap="wrap">
               <Anchor href="https://twitter.com/HashCoinFarm" target="_blank" c="dimmed"><IconBrandX size={20} /></Anchor>
               <Anchor href="https://discord.com/invite/D55sWhNgcb" target="_blank" c="dimmed"><IconBrandDiscord size={20} /></Anchor>
               <Anchor href="https://t.me/ChainInside/524" target="_blank" c="dimmed"><IconBrandTelegram size={20} /></Anchor>
               <Anchor href="https://github.com/LookHookInfo/hashcoin" target="_blank" c="dimmed"><IconBrandGithub size={20} /></Anchor>
               <Text size="sm" c="dimmed" mx={4}>|</Text>
               <Anchor
                  href="https://road.lookhook.info"
                  target="_blank"
                  underline="hover"
                  c="dimmed"
                  size="sm"
               >
                  LookHook - Ecosystem
               </Anchor>
            </Group>
         </Container>
      </footer>
   );
}
