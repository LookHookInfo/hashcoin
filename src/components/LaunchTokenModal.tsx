import { Modal, Stack, TextInput, FileInput, Box, Group, Text, Divider, Slider, Button, Loader } from '@mantine/core';
import { IconRocket, IconLoader2 } from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { writeAndWait } from '@/lib/wagmi/tx';
import { erc20Abi, formatEther, parseEther } from 'viem';
import { upload } from '@/utils/ipfs';
import { contractGemFun, hashcoinContract } from '@/utils/contracts';
import { formatAmount } from '@/hooks/useTokenLogic';
import { useDebouncedValue } from '@mantine/hooks';
import { AppTransactionButton } from './AppTransactionButton';
import { useContractRead } from '@/hooks/useContractRead';
import { memeClient } from '@/hooks/useAggregatorClient';
import { CONTRACT_ADDRESSES } from '@/utils/constants';

const CURVE_SUPPLY_WEI = 300_000_000n * 10n ** 18n;
const PERCENT_TENTHS_BASE = 1000n;

const calculateReserveFor = (sold: bigint) => {
  return sold / 1000n + (sold * sold) / (45_000_000_000n * 10n ** 18n);
};

const toPercentTenths = (value: number) => BigInt(Math.round(value * 10));

interface Props {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LaunchTokenModal({ opened, onClose, onSuccess }: Props) {
  const account = useAccount();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [ipfsResult, setIpfsResult] = useState<{ uri: string, bytes32: string } | null>(null);
  const [newToken, setNewToken] = useState({ name: '', symbol: '', description: '' });
  const [preBuyPct, setPreBuyPct] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [debouncedPreBuyPct] = useDebouncedValue(preBuyPct, 300);

  const preBuyAmountWei = useMemo(() => {
    return (CURVE_SUPPLY_WEI * toPercentTenths(debouncedPreBuyPct)) / PERCENT_TENTHS_BASE;
  }, [debouncedPreBuyPct]);

  const preBuyAmount = useMemo(() => Number(formatEther(preBuyAmountWei)), [preBuyAmountWei]);

  const preBuyCost = useMemo(() => {
    if (preBuyAmountWei <= 0n) return 0n;
    return calculateReserveFor(preBuyAmountWei);
  }, [preBuyAmountWei]);

  const { data: launchData, refetch: refetchAllowance } = useLaunchAllowance(account?.address);
  const hashAllowance = launchData?.hashAllowance ?? 0n;
  const userHashBalance = launchData?.hashBalance ?? 0n;

  const hasEnoughBalance = useMemo(() => {
    if (preBuyCost === 0n) return true;
    return userHashBalance >= preBuyCost;
  }, [userHashBalance, preBuyCost]);

  const onFileChange = async (f: File | null) => {
    setFile(f);
    if (!f) {
        setIpfsResult(null);
        return;
    }
    if (f.size > 2 * 1024 * 1024) {
        setFileError("File too large (max 2MB)");
        return;
    }

    const isEnglish = /^[a-zA-Z0-9._ -]+$/.test(f.name);
    if (!isEnglish) {
        setFileError("Filename must be English only");
        return;
    }

    setFileError(null);
    setIsUploading(true);
    try {
        const result = await upload(f);
        setIpfsResult(result);
    } catch (err: any) {
        setFileError("IPFS Upload failed");
    } finally {
        setIsUploading(false);
    }
  };

  const handleLaunch = async () => {
    if (!account || !ipfsResult) return;
    setIsProcessing(true);

    try {
        const currentAllowance = hashAllowance;
        if (preBuyCost > 0n && currentAllowance < preBuyCost) {
            await writeAndWait({
                address: hashcoinContract.address,
                abi: erc20Abi,
                functionName: "approve",
                args: [contractGemFun.address, 100_000_000n * 10n ** 18n],
            });
            await refetchAllowance();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const packedDescription = `${ipfsResult.uri}|${newToken.description}`;
        await writeAndWait({
            address: contractGemFun.address,
            abi: contractGemFun.abi,
            functionName: "deployToken",
            args: [newToken.name, newToken.symbol, ipfsResult.bytes32 as `0x${string}`, packedDescription, preBuyAmountWei],
            value: parseEther("0.0001"),
        });

        onSuccess();
        handleModalClose();
    } catch (err: any) {
        console.error("Launch failed:", err);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleModalClose = () => {
    onClose();
    setFile(null);
    setFileError(null);
    setPreBuyPct(0);
    setNewToken({ name: '', symbol: '', description: '' });
    setIpfsResult(null);
  };

  const isReady = !!newToken.name && !!newToken.symbol && !!ipfsResult && hasEnoughBalance && !isUploading;

  return (
    <Modal opened={opened} onClose={handleModalClose} title="Launch a new Token" centered size="lg" styles={{ content: { backgroundColor: '#1a1b1e', color: 'white' }, header: { backgroundColor: '#1a1b1e', color: 'white' } }}>
        <Stack>
          <TextInput label="Token Name" placeholder="e.g. Gemcoin" required value={newToken.name} onChange={(e) => setNewToken({...newToken, name: e.target.value})} />
          <TextInput label="Token Symbol" placeholder="e.g. GEM" required value={newToken.symbol} onChange={(e) => setNewToken({...newToken, symbol: e.target.value})} />
          <FileInput
            label="Logo Image"
            description="English filename only, max 2MB"
            placeholder={isUploading ? "Uploading to IPFS..." : "Select image file"}
            accept="image/*"
            required
            value={file}
            onChange={onFileChange}
            error={fileError}
            leftSection={isUploading ? <Loader size="xs" /> : null}
          />
          <TextInput
            label="Description"
            placeholder="What is this token about?"
            required
            value={newToken.description}
            onChange={(e) => setNewToken({...newToken, description: e.target.value})}
          />

          <Divider my="xs" label="Tokenomics" labelPosition="center" />

          <Box p="md" style={{ borderRadius: '8px', border: '1px solid #333', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <Group justify="space-between" mb="xs">
                <Text size="sm" fw={700}>Pre-buy tokens: <Text span c="blue" inherit>{preBuyPct}%</Text></Text>
                <Text size="xs" c="dimmed">{formatAmount(preBuyAmount)} {newToken.symbol || 'GEM'}</Text>
            </Group>
            <Slider value={preBuyPct} onChange={setPreBuyPct} min={0} max={5} step={0.1} precision={1} color="blue" />

            {preBuyPct > 0 && (
                <Group justify="space-between" mt="md" p="xs" style={{ backgroundColor: 'rgba(34, 139, 230, 0.05)', borderRadius: '4px' }}>
                    <Stack gap={0}>
                        <Text size="xs" c="dimmed">Cost to buy:</Text>
                        {!hasEnoughBalance && <Text size="10px" c="red">Insufficient HASH balance</Text>}
                    </Stack>
                    <Text size="sm" fw={700} c={hasEnoughBalance ? "blue" : "red"}>{formatAmount(formatEther(preBuyCost))} HASH</Text>
                </Group>
            )}
          </Box>

          <Stack gap={4}>
            <Group justify="space-between">
                <Text size="sm" c="dimmed">Deployment Fee:</Text>
                <Text size="sm" fw={700} c="green">0.0001 ETH</Text>
            </Group>
          </Stack>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleModalClose} disabled={isProcessing}>Cancel</Button>
            <AppTransactionButton
                size="md"
                disabled={!isReady || isProcessing}
                transaction={handleLaunch as never}
                onTransactionConfirmed={() => {
                    onSuccess();
                    handleModalClose();
                }}
                onError={(err) => console.error("Launch failed:", err)}
                leftSection={isProcessing ? <IconLoader2 className="spinning" size={18} /> : <IconRocket size={18} />}
                style={{
                    background: 'linear-gradient(45deg, #007bff, #00d2ff)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    minWidth: 150,
                    opacity: (!isReady || isProcessing) ? 0.5 : 1
                }}
            >
                {isProcessing ? "Processing..." : "Launch Token"}
            </AppTransactionButton>
          </Group>
        </Stack>
    </Modal>
  );
}

function useLaunchAllowance(user?: string) {
    return useContractRead<{ hashAllowance: bigint; hashBalance: bigint }>({
        fetchFn: async () => {
            if (!user) return { hashAllowance: 0n, hashBalance: 0n };
            const results = await memeClient.multicall({
                contracts: [
                    {
                        address: CONTRACT_ADDRESSES.HASH_COIN as `0x${string}`,
                        abi: erc20Abi,
                        functionName: "allowance",
                        args: [user as `0x${string}`, CONTRACT_ADDRESSES.GEM_FUN as `0x${string}`],
                    },
                    {
                        address: CONTRACT_ADDRESSES.HASH_COIN as `0x${string}`,
                        abi: erc20Abi,
                        functionName: "balanceOf",
                        args: [user as `0x${string}`],
                    },
                ],
            });
            return {
                hashAllowance: BigInt(results[0]?.result ?? 0),
                hashBalance: BigInt(results[1]?.result ?? 0),
            };
        },
        deps: [user],
        enabled: !!user,
        intervalMs: 10_000,
    });
}
