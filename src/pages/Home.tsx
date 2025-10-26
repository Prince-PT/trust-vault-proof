import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle2, Lock, Zap, ArrowRight } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import { UploadCard } from '@/components/UploadCard';
import { TRUSTVAULT_ADDRESS, TRUSTVAULT_ABI, SEPOLIA_CHAIN_ID, generateMetadataURI } from '@/lib/contract';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { generateSemanticVectorHash, preloadModel, checkSimilarity } from '@/utils/embeddings';
import { useVectorStorage } from '@/hooks/useVectorStorage';

export default function Home() {
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [hash, setHash] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [similarContent, setSimilarContent] = useState<Array<{ hash: string; similarity: number; creator: string; method: string }>>([]);

  const { writeContractAsync, data: txHash, isPending, isError, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const { getVectors, addVector } = useVectorStorage();

  // Preload the AI model on mount
  useEffect(() => {
    preloadModel().catch(console.error);
  }, []);

  const handleHashComputed = (computedHash: string, name: string, file: File) => {
    setHash(computedHash);
    setFileName(name);
    setUploadedFile(file);
    toast.success('Hash computed successfully!');
  };

  const handleRegisterProof = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (chain?.id !== SEPOLIA_CHAIN_ID) {
      toast.error('Please switch to Sepolia network');
      switchChain?.({ chainId: SEPOLIA_CHAIN_ID });
      return;
    }

    if (!hash || !uploadedFile) {
      toast.error('Please upload a file first');
      return;
    }

    try {
      // Generate semantic vector hash (AI fingerprint)
      toast.loading('Generating AI fingerprint...', { id: 'ai-fingerprint' });
      const { hash: vectorHash, embedding, text } = await generateSemanticVectorHash(uploadedFile);
      toast.success('AI fingerprint generated!', { id: 'ai-fingerprint' });

      // Check for plagiarism
      toast.loading('Checking for similar content...', { id: 'plagiarism-check' });
      const existingVectors = getVectors();
      const similar = checkSimilarity(text, embedding, existingVectors);
      setSimilarContent(similar);

      if (similar.length > 0) {
        const topMatch = similar[0];
        toast.error(
          `⚠️ Similar content detected! ${similar.length} match(es) found with ${Math.round(topMatch.similarity * 100)}% similarity (${topMatch.method})`,
          { id: 'plagiarism-check', duration: 5000 }
        );
        return;
      }
      
      toast.success('No similar content found', { id: 'plagiarism-check' });

      await writeContractAsync({
        address: TRUSTVAULT_ADDRESS,
        abi: TRUSTVAULT_ABI,
        functionName: 'registerProof',
        args: [hash as `0x${string}`, vectorHash, generateMetadataURI()],
        gas: 1000000n,
      } as any);

      // Store vector locally for future comparisons (including text for short content)
      addVector({
        hash: vectorHash,
        embedding,
        creator: address || '',
        contentHash: hash,
        text: text.length < 100 ? text : undefined // Only store text for short content
      });

    } catch (err) {
      console.error(err);
      toast.error('Transaction failed. Check console for details.');
    }
  };

  if (isSuccess) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1e3a8a', '#7c3aed', '#10b981'],
    });
    toast.success('Proof registered on-chain! 🎉');
  }

  if (isError) {
    toast.error(error?.message || 'Transaction failed');
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-16 max-w-6xl"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-block mb-6"
          >
            <Shield className="w-24 h-24 text-primary mx-auto" />
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Prove Your{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Originality
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Timestamp your digital creations on Ethereum without exposing the content. 
            TrustVault provides immutable proof-of-originality for your code, docs, and designs.
          </p>

          {!isConnected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-primary font-medium mb-4">👆 Connect your wallet to get started</p>
            </motion.div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: Lock, title: 'Privacy First', desc: 'Only hashes touch the blockchain - your files stay local' },
            { icon: CheckCircle2, title: 'Immutable Proof', desc: 'Ethereum guarantees your timestamp can never be altered' },
            { icon: Zap, title: 'Instant Verification', desc: 'Anyone can verify originality in seconds' },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="glass p-6 rounded-xl hover-scale"
            >
              <feature.icon className="w-12 h-12 text-secondary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Upload Section */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-center mb-8">
              Register Your Proof
            </h2>
            
            <UploadCard onHashComputed={handleHashComputed} isProcessing={isPending} />

            {hash && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 glass p-6 rounded-xl"
              >
                <p className="text-sm text-muted-foreground mb-2">Computed Hash:</p>
                <p className="font-mono text-sm break-all mb-4 text-primary">{hash}</p>
                <p className="text-sm text-muted-foreground mb-4">File: {fileName}</p>
                
                {similarContent.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg"
                  >
                    <h3 className="text-sm font-semibold text-destructive mb-2">⚠️ Plagiarism Alert</h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      Found {similarContent.length} similar document(s):
                    </p>
                    {similarContent.map((match, idx) => (
                      <div key={idx} className="text-xs mb-2 p-2 bg-background/50 rounded">
                        <div className="font-mono">
                          <span className="text-destructive font-semibold">{Math.round(match.similarity * 100)}% similar</span>
                          <span className="text-muted-foreground ml-2">({match.method})</span>
                        </div>
                        <div className="text-muted-foreground mt-1">{match.hash.slice(0, 20)}...</div>
                      </div>
                    ))}
                  </motion.div>
                )}

                <Button
                  onClick={handleRegisterProof}
                  disabled={isPending || similarContent.length > 0}
                  className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                >
                  {isPending ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Confirming Transaction...
                    </>
                  ) : (
                    <>
                      Prove My Work
                      <ArrowRight className="ml-2" />
                    </>
                  )}
                </Button>

                {isSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-4 bg-success/10 border border-success/30 rounded-lg"
                  >
                    <p className="text-success font-medium mb-2">✅ Proof registered successfully!</p>
                    <Link to="/dashboard">
                      <Button variant="outline" className="w-full">
                        View in Dashboard →
                      </Button>
                    </Link>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-center text-muted-foreground hover:text-foreground mt-2"
                    >
                      View on Etherscan ↗
                    </a>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>Built for ETHGlobal 2025 – Privacy First, Always</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Link to="/verify" className="hover:text-foreground transition-colors">
              Verify Proof
            </Link>
            <span>•</span>
            <a
              href={`https://sepolia.etherscan.io/address/${TRUSTVAULT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Contract ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
