import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Search, AlertTriangle } from 'lucide-react';
import { useReadContract } from 'wagmi';
import { UploadCard } from '@/components/UploadCard';
import { TRUSTVAULT_ADDRESS, TRUSTVAULT_ABI, SEPOLIA_CHAIN_ID } from '@/lib/contract';
import { truncateHash } from '@/utils/hash';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { generateSemanticVectorHash, checkSimilarity } from '@/utils/embeddings';
import { useVectorStorage } from '@/hooks/useVectorStorage';
import { useToast } from '@/hooks/use-toast';

export default function Verify() {
  const [hash, setHash] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [hasVerified, setHasVerified] = useState(false);
  const [similarContent, setSimilarContent] = useState<Array<{ hash: string; similarity: number; creator: string; method: string }>>([]);
  const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false);
  const { getVectors } = useVectorStorage();
  const { toast } = useToast();

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

  const handleHashComputed = async (computedHash: string, name: string, file: File) => {
    setHash(computedHash);
    setFileName(name);
    setHasVerified(false);
    setSimilarContent([]);
    
    // Check for plagiarism using AI fingerprinting
    setIsCheckingPlagiarism(true);
    try {
      const { embedding, text } = await generateSemanticVectorHash(file);
      const existingVectors = getVectors();
      
      if (existingVectors.length > 0) {
        const matches = checkSimilarity(text, embedding, existingVectors);
        
        if (matches.length > 0) {
          setSimilarContent(matches);
          toast({
            title: "⚠️ Plagiarism Detected",
            description: `Found ${matches.length} similar document(s) using ${matches[0].method} analysis`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "✓ No Plagiarism Detected",
            description: "This content appears to be unique",
          });
        }
      }
    } catch (error) {
      console.error('Error checking plagiarism:', error);
      toast({
        title: "Warning",
        description: "Could not perform plagiarism check. File verification will continue.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingPlagiarism(false);
    }
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

          <UploadCard onHashComputed={handleHashComputed} isProcessing={isLoading || isCheckingPlagiarism} />

          {similarContent.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <div className="glass p-6 rounded-xl border-destructive/30">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                  <div>
                    <h3 className="text-xl font-bold text-destructive">Plagiarism Alert</h3>
                    <p className="text-sm text-muted-foreground">Similar content detected</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {similarContent.map((match, idx) => (
                    <div key={idx} className="p-4 bg-background/50 rounded-lg border border-border">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium">Match #{idx + 1}</p>
                        <span className="text-sm font-bold text-destructive">
                          {(match.similarity * 100).toFixed(1)}% similar
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Detection: <span className="font-medium">{match.method}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Hash: <code className="text-xs">{truncateHash(match.hash)}</code>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Creator: <code className="text-xs">{truncateHash(match.creator)}</code>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {hash && !hasVerified && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <Button
                onClick={handleVerify}
                disabled={isLoading || isCheckingPlagiarism}
                className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
              >
                {isCheckingPlagiarism ? 'Checking Plagiarism...' : isLoading ? 'Verifying...' : 'Verify This Hash'}
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
