import { Modal, Stack, TextInput, FileInput, Box, Group, Text, Divider, Slider, Button, Loader } from '@mantine/core';
import { IconAlertCircle, IconPlus } from '@tabler/icons-react';
import { useState, useMemo, useEffect } from 'react';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { prepareContractCall } from 'thirdweb';
import { formatEther, parseEther } from 'viem';
import { allowance as getAllowance, approve as prepareApprove } from "thirdweb/extensions/erc20";
import { upload } from '@/utils/ipfs';
import { AppTransactionButton } from '@/components/AppTransactionButton';
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
  const [ipfsResult, setIpfsResult] = useState<{ uri: string, bytes32: string } | null>(null);
  const [newToken, setNewToken] = useState({ name: '', symbol: '', description: '' });
  const [preBuyPct, setPreBuyPct] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Debounce preBuyPct to avoid rapid RPC calls for allowance/cost
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
    queryOptions: { 
        enabled: !!account?.address && preBuyAmountWei > 0n,
        staleTime: 10_000 // Cache for 10 seconds
    }
  });

  const onFileChange = async (f: File | null) => {
    if (f && f.size > 2 * 1024 * 1024) {
        setFileError("File is too large! Maximum allowed size is 2MB.");
        setFile(null);
        setIpfsResult(null);
    } else if (f) {
        setFileError(null);
        setFile(f);
        setIpfsResult(null);
        setIsUploading(true);
        try {
            const result = await upload(f);
            setIpfsResult(result);
        } catch (err: any) {
            console.error("IPFS Upload failed:", err);
            setFileError(`IPFS Upload failed: ${err.message || "Please try again."}`);
        } finally {
            setIsUploading(false);
        }
    } else {
        setFile(null);
        setIpfsResult(null);
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

  return (
    <Modal opened={opened} onClose={handleModalClose} title="Launch a new Token" centered size="lg" styles={{ content: { backgroundColor: '#1a1b1e', color: 'white' }, header: { backgroundColor: '#1a1b1e', color: 'white' } }}>
        <Stack>
          <TextInput label="Token Name" placeholder="e.g. Gemcoin" required value={newToken.name} onChange={(e) => setNewToken({...newToken, name: e.target.value})} />
          <TextInput label="Token Symbol" placeholder="e.g. GEM" required value={newToken.symbol} onChange={(e) => setNewToken({...newToken, symbol: e.target.value})} />
          <FileInput 
            label="Logo Image" 
            description="Max size: 2MB. Recommended: 200x200px"
            placeholder={isUploading ? "Uploading..." : "Select image file"} 
            accept="image/*" 
            required 
            value={file} 
            onChange={onFileChange} 
            error={fileError}
            leftSection={isUploading ? <Loader size="xs" /> : (fileError ? <IconAlertCircle size={16} color="red" /> : null)}
          />
          <TextInput 
            label="Description" 
            description={<Text span c={newToken.description.length >= 400 ? "red" : "dimmed"} size="xs">{newToken.description.length}/400 characters</Text>}
            placeholder="What is this token about?" 
            required 
            maxLength={400}
            value={newToken.description} 
            onChange={(e) => setNewToken({...newToken, description: e.target.value})} 
          />
          
          <Divider my="xs" label="Creator special offer" labelPosition="center" />
          
          <Box p="md" style={{ borderRadius: '8px', border: '1px solid #333', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <Group justify="space-between" mb="xs">
                <Text size="sm" fw={700}>Pre-buy tokens: <Text span c="blue" inherit>{preBuyPct}%</Text></Text>
                <Text size="xs" c="dimmed">{formatAmount(preBuyAmount)} {newToken.symbol || 'GEM'}</Text>
            </Group>
            <Box px="xs" py="md">
                <Slider value={preBuyPct} onChange={setPreBuyPct} min={0} max={5} step={0.1} precision={1} color="blue" marks={[{ value: 0, label: '0%' }, { value: 5, label: '5%' }]} styles={{ markLabel: { color: '#666', fontSize: '10px' }, track: { backgroundColor: '#333' } }} />
            </Box>
            {preBuyPct > 0 && (
                <Group justify="space-between" mt="md" p="xs" style={{ backgroundColor: 'rgba(34, 139, 230, 0.05)', borderRadius: '4px' }}>
                    <Text size="xs" c="dimmed">Cost to buy:</Text>
                    <Text size="sm" fw={700} c="blue">{formatAmount(formatEther(preBuyCost))} HASH</Text>
                </Group>
            )}
          </Box>

          <Stack gap={4} mt="md">
            <Group justify="space-between">
                <Text size="sm" c="dimmed">Deployment Fee:</Text>
                <Text size="sm" fw={700} c="green">0.0001 ETH</Text>
            </Group>
            <Text size="10px" c="dimmed">Fee is used for contract maintenance and LP initialization.</Text>
          </Stack>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleModalClose}>Cancel</Button>
            {(!ipfsResult || BigInt(hashAllowance?.toString() || "0") < preBuyCost) ? (
                <AppTransactionButton
                    style={{ 
                        background: 'linear-gradient(45deg, #228be6 0%, #15aabf 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        opacity: (!newToken.name || !newToken.symbol || !file || !!fileError || isUploading) ? 0.5 : 1
                    }}
                    disabled={!newToken.name || !newToken.symbol || !file || !!fileError || isUploading}
                    transaction={async () => {
                        if (!account) throw new Error("Wallet not connected");
                        if (preBuyAmountWei > 0n && BigInt(hashAllowance?.toString() || "0") < preBuyCost) {
                            return prepareApprove({
                                contract: hashcoinContract,
                                spender: contractGemFun.address,
                                amount: (preBuyCost * 10n).toString()
                            });
                        }
                        throw new Error("Preparing...");
                    }}
                    onTransactionConfirmed={() => refetchAllowance()}
                >
                    {isUploading ? "Uploading..." : (BigInt(hashAllowance?.toString() || "0") < preBuyCost ? "Approve HASH" : "Ready to Launch")}
                </AppTransactionButton>
            ) : (
                <AppTransactionButton
                    style={{ 
                        background: 'linear-gradient(45deg, #228be6 0%, #15aabf 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700
                    }}
                    transaction={() => {
                        const packedDescription = `${ipfsResult.uri}|${newToken.description}`;
                        return prepareContractCall({
                            contract: contractGemFun,
                            method: "function deployToken(string name, string symbol, bytes32 logoHash, string desc, uint256 creatorMemeBuy) payable returns (address)",
                            params: [newToken.name, newToken.symbol, ipfsResult.bytes32 as `0x${string}`, packedDescription, preBuyAmountWei],
                            value: parseEther("0.0001")
                        });
                    }}
                    onTransactionConfirmed={() => {
                        onSuccess();
                        handleModalClose();
                    }}
                >
                    Launch Gem
                </AppTransactionButton>
            )}
          </Group>
        </Stack>
    </Modal>
  );
}
