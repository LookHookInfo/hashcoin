import { Container, Group, Anchor } from "@mantine/core";
import { IconBrandTelegram, IconBrandDiscord, IconBrandX, IconBrandGithub, IconExternalLink } from '@tabler/icons-react';
import { Link } from "react-router-dom";
import classes from './Footer.module.css';

export default function Footer() {
   return (
      <footer className={classes.footer}>
         <Container className={classes.inner}>
            {/* Navigation Links */}
            <Group className={classes.links} gap="lg" justify="center">
               <Link to="/coin" className={classes.link}>Coin</Link>
               <Link to="/road" className={classes.link}>Road</Link>
               <Link to="/paper" className={classes.link}>Paper</Link>
               <Anchor href="https://lookhook.info/" target="_blank" className={classes.link}>
                  Dev <IconExternalLink size={16} style={{ verticalAlign: 'middle' }} />
               </Anchor>
            </Group>

            {/* Social Links */}
            <Group gap="xs" justify="center" wrap="nowrap">
               <Anchor href="https://twitter.com/HashCoinFarm" target="_blank" c="dimmed"><IconBrandX size={20} /></Anchor>
               <Anchor href="https://discord.com/invite/D55sWhNgcb" target="_blank" c="dimmed"><IconBrandDiscord size={20} /></Anchor>
               <Anchor href="https://t.me/ChainInside/524" target="_blank" c="dimmed"><IconBrandTelegram size={20} /></Anchor>
               <Anchor href="https://github.com/LookHookInfo/hashcoin" target="_blank" c="dimmed"><IconBrandGithub size={20} /></Anchor>
            </Group>
         </Container>
      </footer>
   );
}
