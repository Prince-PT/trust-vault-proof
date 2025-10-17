import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = 'f5c4e5a5e5e5e5e5e5e5e5e5e5e5e5e5'; // Demo project ID for hackathon

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected({ target: 'metaMask' }),
    walletConnect({ projectId, showQrModal: true }),
  ],
  transports: {
    [sepolia.id]: http(),
  },
});
