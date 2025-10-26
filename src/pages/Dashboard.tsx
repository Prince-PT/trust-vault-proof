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
    if (!proofCount || !address) {
      console.log('Missing data:', { proofCount, address });
      return;
    }

    const fetchProofs = async () => {
      const userProofs: Proof[] = [];
      const count = Number(proofCount);
      console.log('Fetching proofs. Total count:', count, 'Connected address:', address);
      
      // Fetch all proofs and filter by creator
      for (let i = 1; i <= count; i++) {
        try {
          // First, get the content hash by id
          // @ts-ignore - viem type compatibility issue (authorizationList)
          const contentHash = await publicClient.readContract({
            address: TRUSTVAULT_ADDRESS,
            abi: TRUSTVAULT_ABI,
            functionName: 'idToHash',
            args: [BigInt(i)],
          }) as `0x${string}`;

          // Skip if no hash stored for this id
          if (!contentHash || contentHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
            continue;
          }

          // Then read the proof details from the mapping by content hash
          // @ts-ignore - viem type compatibility issue (authorizationList)
          const proofTuple = await publicClient.readContract({
            address: TRUSTVAULT_ADDRESS,
            abi: TRUSTVAULT_ABI,
            functionName: 'proofs',
            args: [contentHash],
          }) as any;

          // proofTuple returns: contentHash, vectorHash, creator, timestamp, metadataURI
          const creator: string = (proofTuple as any).creator ?? (proofTuple as any)[2];
          const timestampRaw = (proofTuple as any).timestamp ?? (proofTuple as any)[3];
          const timestampMs = Number(timestampRaw) * 1000;

          // Only add proofs from the connected wallet
          if (creator && creator.toLowerCase() === address.toLowerCase()) {
            userProofs.push({
              id: i,
              contentHash,
              timestamp: timestampMs,
              creator,
            });
          }
        } catch (error) {
          console.error(`Error fetching proof #${i}:`, error);
          continue;
        }
      }

      console.log('User proofs found:', userProofs.length, userProofs);
      setProofs(userProofs.sort((a, b) => b.timestamp - a.timestamp));
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
