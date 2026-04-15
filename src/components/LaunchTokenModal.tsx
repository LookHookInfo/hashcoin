import { Modal, Stack, TextInput, FileInput, Box, Group, Text, Divider, Slider, Button, Loader } from '@mantine/core';
import { IconAlertCircle, IconRocket, IconLoader2 } from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { prepareContractCall, sendAndConfirmTransaction } from 'thirdweb';
import { formatEther, parseEther } from 'viem';
import { allowance as getAllowance, balanceOf } from "thirdweb/extensions/erc20";
import { upload } from '@/utils/ipfs';
import { contractGemFun, hashcoinContract } from '@/utils/contracts';
import { formatAmount } from '@/hooks/useTokenLogic';
import { useDebouncedValue } from '@mantine/hooks';

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
  const account = useActiveAccount();
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

  const { data: hashAllowance, refetch: refetchAllowance } = useReadContract(getAllowance, {
    contract: hashcoinContract,
    owner: account?.address || "",
    spender: contractGemFun.address,
    queryOptions: { enabled: !!account?.address }
  });

  const { data: userHashBalance } = useReadContract(balanceOf, {
    contract: hashcoinContract,
    address: account?.address || "",
    queryOptions: { enabled: !!account?.address }
  });

  const hasEnoughBalance = useMemo(() => {
    if (preBuyCost === 0n) return true;
    return BigInt(userHashBalance?.toString() || "0") >= preBuyCost;
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
        // 1. Check Approval
        const currentAllowance = BigInt(hashAllowance?.toString() || "0");
        if (preBuyCost > 0n && currentAllowance < preBuyCost) {
            const approveTx = prepareContractCall({
                contract: hashcoinContract,
                method: "function approve(address spender, uint256 amount)",
                params: [contractGemFun.address, 10000000n * 10n ** 18n] // 10 Million HASH
            });
            await sendAndConfirmTransaction({ transaction: approveTx, account });
            await refetchAllowance();
            // Small pause to allow RPC node to sync the new allowance
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 2. Launch Token
        const packedDescription = `${ipfsResult.uri}|${newToken.description}`;
        const deployTx = prepareContractCall({
            contract: contractGemFun,
            method: "function deployToken(string name, string symbol, bytes32 logoHash, string desc, uint256 creatorMemeBuy) payable returns (address)",
            params: [newToken.name, newToken.symbol, ipfsResult.bytes32 as `0x${string}`, packedDescription, preBuyAmountWei],
            value: parseEther("0.0001")
        });
        
        await sendAndConfirmTransaction({ transaction: deployTx, account });
        
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
            <Button
                size="md"
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
                disabled={!isReady || isProcessing}
                onClick={handleLaunch}
                leftSection={isProcessing ? <IconLoader2 className="spinning" size={18} /> : <IconRocket size={18} />}
                style={{ fontWeight: 700, minWidth: 150 }}
            >
                {isProcessing ? "Processing..." : "Launch Token"}
            </Button>
          </Group>
        </Stack>
    </Modal>
  );
}
