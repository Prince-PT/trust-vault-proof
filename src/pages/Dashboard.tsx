import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileCheck, ExternalLink, Clock } from 'lucide-react';
import { useAccount, useReadContract } from 'wagmi';
import { publicClient } from '@/lib/publicClient';
import { TRUSTVAULT_ADDRESS, TRUSTVAULT_ABI, SEPOLIA_CHAIN_ID } from '@/lib/contract';
import { truncateHash } from '@/utils/hash';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface Proof {
  id: number;
  contentHash: string;
  timestamp: number;
  creator: string;
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [proofs, setProofs] = useState<Proof[]>([]);

  const { data: proofCount } = useReadContract({
    address: TRUSTVAULT_ADDRESS,
    abi: TRUSTVAULT_ABI,
    functionName: 'proofCount',
    chainId: SEPOLIA_CHAIN_ID,
  });

  // Fetch user's proofs from the blockchain
  useEffect(() => {
    if (!proofCount || !address) return;

    const fetchProofs = async () => {
      const userProofs: Proof[] = [];
      const count = Number(proofCount);
      
      // Fetch all proofs and filter by creator
      for (let i = 1; i <= count; i++) {
        try {
          // @ts-ignore - viem type compatibility issue
          const proofData = await publicClient.readContract({
            address: TRUSTVAULT_ADDRESS,
            abi: TRUSTVAULT_ABI,
            functionName: 'getProofById',
            args: [BigInt(i)],
          }) as any;

          // Only add proofs from the connected wallet that aren't revoked
          if (proofData.creator.toLowerCase() === address.toLowerCase() && !proofData.revoked) {
            userProofs.push({
              id: i,
              contentHash: proofData.contentHash,
              timestamp: Number(proofData.timestamp) * 1000, // Convert to milliseconds
              creator: proofData.creator,
            });
          }
        } catch (error) {
          // Skip invalid proof IDs (gaps in sequence)
          continue;
        }
      }

      setProofs(userProofs.reverse());
    };

    fetchProofs();
  }, [proofCount, address]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center glass p-8 rounded-2xl max-w-md"
        >
          <p className="text-xl mb-4">Please connect your wallet to view your proofs</p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Your Proofs</h1>
          <p className="text-muted-foreground text-lg mb-8">
            All your registered proof-of-originality timestamps
          </p>

          {proofs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass p-12 rounded-2xl text-center"
            >
              <FileCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl mb-4">No proofs yet</p>
              <p className="text-muted-foreground mb-6">
                Register your first proof to get started
              </p>
              <Link to="/">
                <Button>Register a Proof</Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid gap-4">
              {proofs.map((proof, index) => (
                <motion.div
                  key={proof.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass p-6 rounded-xl hover-scale"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileCheck className="w-5 h-5 text-success" />
                        <span className="font-semibold">Proof #{proof.id}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Hash:</span>
                          <code className="font-mono text-primary">
                            {truncateHash(proof.contentHash, 8)}
                          </code>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatDistanceToNow(new Date(proof.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`https://sepolia.etherscan.io/address/${TRUSTVAULT_ADDRESS}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Etherscan
                        </Button>
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
