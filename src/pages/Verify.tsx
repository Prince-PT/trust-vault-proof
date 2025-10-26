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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              <div className="glass p-8 rounded-2xl border-2 border-destructive/40 bg-gradient-to-br from-destructive/5 to-transparent">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-destructive mb-1">Plagiarism Detected</h3>
                    <p className="text-muted-foreground">
                      Found {similarContent.length} similar {similarContent.length === 1 ? 'document' : 'documents'} in the registry
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {similarContent.map((match, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group p-5 bg-background/80 backdrop-blur-sm rounded-xl border border-border hover:border-destructive/30 transition-all duration-300"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                          <span className="text-sm font-semibold text-foreground">Match #{idx + 1}</span>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20">
                          <span className="text-base font-bold text-destructive">
                            {(match.similarity * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Method:</span>
                          <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                            {match.method}
                          </span>
                        </div>
                        
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Content Hash</p>
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">
                            {truncateHash(match.hash)}
                          </code>
                        </div>
                        
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Original Creator</p>
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {truncateHash(match.creator)}
                          </code>
                        </div>
                      </div>
                    </motion.div>
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
