import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Search } from 'lucide-react';
import { useReadContract } from 'wagmi';
import { UploadCard } from '@/components/UploadCard';
import { TRUSTVAULT_ADDRESS, TRUSTVAULT_ABI, SEPOLIA_CHAIN_ID } from '@/lib/contract';
import { truncateHash } from '@/utils/hash';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function Verify() {
  const [hash, setHash] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [hasVerified, setHasVerified] = useState(false);

  const { data: verificationData, refetch, isLoading } = useReadContract({
    address: TRUSTVAULT_ADDRESS,
    abi: TRUSTVAULT_ABI,
    functionName: 'verifyHash',
    args: hash ? [hash as `0x${string}`] : undefined,
    chainId: SEPOLIA_CHAIN_ID,
    query: {
      enabled: false, // Manual trigger
    },
  });

  const handleHashComputed = (computedHash: string, name: string) => {
    setHash(computedHash);
    setFileName(name);
    setHasVerified(false);
  };

  const handleVerify = async () => {
    if (!hash) return;
    setHasVerified(true);
    refetch();
  };

  const isVerified = verificationData?.[0] as boolean;
  const owner = verificationData?.[1] as string;
  const timestamp = verificationData?.[2] as bigint;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-12">
            <Search className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Verify Proof</h1>
            <p className="text-muted-foreground text-lg">
              Upload a file to check if it has been registered on TrustVault
            </p>
          </div>

          <UploadCard onHashComputed={handleHashComputed} isProcessing={isLoading} />

          {hash && !hasVerified && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <Button
                onClick={handleVerify}
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
              >
                {isLoading ? 'Verifying...' : 'Verify This Hash'}
              </Button>
            </motion.div>
          )}

          {hasVerified && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8"
            >
              {isVerified ? (
                <div className="glass p-8 rounded-2xl border-success/30">
                  <div className="flex items-center gap-3 mb-6">
                    <CheckCircle2 className="w-12 h-12 text-success" />
                    <div>
                      <h2 className="text-2xl font-bold text-success">Verified!</h2>
                      <p className="text-muted-foreground">This file has a registered proof</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">File Name</p>
                      <p className="font-medium">{fileName}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Content Hash</p>
                      <code className="font-mono text-sm text-primary break-all">{hash}</code>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Original Creator</p>
                      <code className="font-mono text-sm">{truncateHash(owner || '')}</code>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Registered</p>
                      <p className="font-medium">
                        {timestamp
                          ? formatDistanceToNow(new Date(Number(timestamp) * 1000), { addSuffix: true })
                          : 'Unknown'}
                      </p>
                    </div>

                    <a
                      href={`https://sepolia.etherscan.io/address/${TRUSTVAULT_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" className="w-full">
                        View on Etherscan ↗
                      </Button>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="glass p-8 rounded-2xl border-destructive/30">
                  <div className="flex items-center gap-3 mb-4">
                    <XCircle className="w-12 h-12 text-destructive" />
                    <div>
                      <h2 className="text-2xl font-bold text-destructive">Not Found</h2>
                      <p className="text-muted-foreground">No proof registered for this file</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    This file has not been registered on TrustVault yet. 
                    You can be the first to prove its originality!
                  </p>

                  <Button variant="outline" className="w-full" onClick={() => window.location.href = '/'}>
                    Register This File
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
