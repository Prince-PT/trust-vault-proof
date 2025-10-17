import { Link } from 'react-router-dom';
import { Shield, Wallet } from 'lucide-react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { truncateHash } from '@/utils/hash';
import { motion } from 'framer-motion';

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-6xl">
        <Link to="/" className="flex items-center gap-2 hover-scale">
          <Shield className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            TrustVault
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {isConnected && (
            <Link to="/dashboard">
              <Button variant="ghost" className="hidden sm:flex">
                Dashboard
              </Button>
            </Link>
          )}
          
          {isConnected ? (
            <Button
              onClick={() => disconnect()}
              variant="outline"
              className="gap-2"
            >
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">{truncateHash(address || '')}</span>
              <span className="sm:hidden">Disconnect</span>
            </Button>
          ) : (
            <Button
              onClick={() => connect({ connector: connectors[0] })}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
