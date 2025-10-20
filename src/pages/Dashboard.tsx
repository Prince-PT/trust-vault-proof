import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileCheck, ExternalLink, Clock } from 'lucide-react';
import { useAccount, useReadContract } from 'wagmi';
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
  const [userProofs, setUserProofs] = useState<Proof[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: proofCount } = useReadContract({
    address: TRUSTVAULT_ADDRESS,
    abi: TRUSTVAULT_ABI,
    functionName: 'proofCount',
    chainId: SEPOLIA_CHAIN_ID,
  });

  useEffect(() => {
    const fetchProofs = async () => {
      if (!proofCount || !address) return;
      
      setIsLoading(true);
      try {
        const count = Number(proofCount);
        const { readContract } = await import('@wagmi/core');
        const { config } = await import('@/lib/wagmi');
        
        const filtered: Proof[] = [];
        
        // Fetch each proof individually
        for (let i = 1; i <= count; i++) {
          try {
            const proofData = await readContract(config, {
              address: TRUSTVAULT_ADDRESS,
              abi: TRUSTVAULT_ABI,
              functionName: 'getProofById',
              args: [BigInt(i)],
            } as any) as any;
            
            // Skip revoked proofs and only include proofs created by the connected wallet
            if (!proofData.revoked && 
                proofData.creator.toLowerCase() === address.toLowerCase()) {
              filtered.push({
                id: i,
                contentHash: proofData.contentHash,
                timestamp: Number(proofData.timestamp) * 1000,
                creator: proofData.creator,
              });
            }
          } catch (error) {
            // Silently skip invalid proof IDs (gaps in the sequence)
            continue;
          }
        }
        
        setUserProofs(filtered.reverse());
      } catch (error) {
        console.error('Error fetching proofs:', error);
      } finally {
        setIsLoading(false);
      }
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

          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass p-12 rounded-2xl text-center"
            >
              <p className="text-xl">Loading your proofs...</p>
            </motion.div>
          ) : userProofs.length === 0 ? (
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
              {userProofs.map((proof, index) => (
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
