# TrustVault - Blockchain-Powered Proof of Originality

TrustVault is a decentralized application that provides immutable proof-of-originality for digital content using Ethereum blockchain and Avail DA network. It combines cryptographic hashing, semantic AI analysis, and blockchain timestamping to protect intellectual property.

## 🚀 Features

- 🔐 **Privacy-First**: Only hashes are stored on-chain, your content stays local
- ⏱️ **Immutable Timestamps**: Ethereum blockchain guarantees proof cannot be altered
- 🤖 **AI Plagiarism Detection**: Semantic analysis detects similar content
- 🌐 **Avail DA Integration**: Optional data availability layer for enhanced verification
- ⚡ **Instant Verification**: Verify originality in seconds

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Blockchain**: Ethereum (Sepolia Testnet) via Wagmi + Viem
- **AI**: Hugging Face Transformers.js (all-MiniLM-L6-v2)
- **Data Availability**: Avail Network (optional)

## 📦 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- MetaMask or compatible Web3 wallet
- Sepolia ETH for testing ([Sepolia Faucet](https://sepoliafaucet.com))

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables (Optional)

For Avail DA integration, create a `.env` file in project root:

```env
VITE_NEXUS_RPC_URL=https://rpc.nexus.avail.so
VITE_NEXUS_API_KEY=your_api_key_here
```

**Note**: Avail integration is optional. The app works perfectly without it.

## 💡 How It Works

### 1. File Upload & Hashing
- User uploads a file (stays local, never sent to server)
- SHA-256 hash computed in browser
- Semantic AI fingerprint generated using transformers.js

### 2. Plagiarism Check
- AI compares semantic similarity with existing proofs
- Uses cosine similarity for long texts
- Uses Levenshtein distance for short texts
- Alerts if similarity > 75%

### 3. Avail DA Upload (Optional)
- If configured, content + vector uploaded to Avail
- Returns commitment (bytes32 hash)
- Commitment embedded in metadata URI

### 4. On-Chain Registration
- Content hash, vector hash, and metadata stored on Ethereum
- Smart contract emits ProofRegistered event
- Timestamp locked forever on blockchain

### 5. Verification
- Anyone can verify a file's originality
- Computes hash and checks blockchain
- Can retrieve original data from Avail (if available)
- Cross-chain verification possible via Nexus SDK

## 📜 Smart Contract

**Deployed on Sepolia**: `0xbAFC4A76712ad5d799fE51f516d4C2bEEc4c1A79`

### Key Functions

- `registerProof(contentHash, vectorHash, availCommitment, metadataURI)` - Register new proof with Avail commitment
- `verifyHash(hash)` - Verify if hash exists and get details including Avail commitment
- `getProofById(id)` - Retrieve proof by ID

[View on Etherscan](https://sepolia.etherscan.io/address/0xbAFC4A76712ad5d799fE51f516d4C2bEEc4c1A79)

## 🌐 Avail Integration

TrustVault supports optional Avail DA integration for enhanced data availability and cross-chain verification.

### Setup Avail

1. **SDK Installation** (already included):
```bash
npm install @avail-project/nexus-core
```

2. **Configure Environment Variables**:
```env
VITE_NEXUS_RPC_URL=https://rpc.nexus.avail.so
VITE_NEXUS_API_KEY=your_nexus_api_key
```

3. **Get Nexus API Key**:
   - Visit [Avail Nexus Dashboard](https://nexus.avail.so)
   - Create account and generate API key
   - Add key to your `.env` file

### How Avail Integration Works

1. **Upload**: Content + vector embedding uploaded to Avail network
2. **Commitment**: Avail returns bytes32 commitment (transaction hash)
3. **Store**: Commitment embedded in on-chain metadata URI
4. **Verify**: Anyone can retrieve original data from Avail using commitment
5. **Cross-Chain**: Use Nexus SDK to anchor proofs on multiple chains

### API Reference

```typescript
import { uploadToAvail, retrieveFromAvail } from '@/lib/availClient';

// Upload data to Avail
const commitment = await uploadToAvail({
  content: "file content",
  vector: [0.1, 0.2, 0.3, ...],
  metadataURI: "ipfs://..."
});
// Returns: "0xabc123..." (bytes32 commitment)

// Retrieve data from Avail
const data = await retrieveFromAvail(commitment);
// Returns: { content, vector, metadataURI, timestamp }
```

### Cross-Chain Demo

Use Nexus SDK elements to register proofs across multiple chains:

```typescript
// Example: Register on Polygon + Base simultaneously
import { NexusClient } from '@avail-project/nexus-core';

const nexus = new NexusClient({ apiKey: process.env.VITE_NEXUS_API_KEY });

// Create cross-chain intent
await nexus.createIntent({
  chains: ['polygon', 'base'],
  action: 'registerProof',
  params: { contentHash, vectorHash, availCommitment }
});
```


## 📁 Project Structure

```
src/
├── components/
│   ├── Navbar.tsx           # Navigation with wallet connect
│   ├── UploadCard.tsx       # File upload with drag & drop
│   └── ui/                  # shadcn/ui components
├── pages/
│   ├── Home.tsx             # Main registration page
│   ├── Dashboard.tsx        # View user's proofs
│   └── Verify.tsx           # Verify file originality
├── lib/
│   ├── contract.ts          # Smart contract ABI & config
│   ├── wagmi.ts             # Wagmi configuration
│   ├── availClient.ts       # Avail DA client
│   └── publicClient.ts      # Viem public client
├── utils/
│   ├── hash.ts              # SHA-256 hashing utilities
│   ├── embeddings.ts        # AI semantic analysis
│   └── availHelpers.ts      # Avail commitment helpers
└── hooks/
    └── useVectorStorage.ts  # Local vector storage
```

## 🐛 Troubleshooting

### Wallet Connection Issues
- Ensure MetaMask is installed and enabled
- Switch to Sepolia testnet in MetaMask
- Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com)

### Avail Integration Not Working
- Verify `VITE_NEXUS_API_KEY` is set correctly
- Check Avail RPC URL is reachable
- **Important**: App works fine without Avail (it's optional)

### AI Model Loading Slow
- First load downloads ~30MB transformer model
- Subsequent loads use browser cache
- WebGPU accelerates inference if available
- Fallback to WASM if WebGPU unavailable

### Transaction Failing
- Check you have enough Sepolia ETH
- Ensure gas limit is sufficient (default: 1,000,000)
- Verify you're on Sepolia network (Chain ID: 11155111)

## 🚢 Deployment

### Deploy Frontend

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Deploy the `dist/` folder to:
- **Lovable**: Click Share → Publish in Lovable editor
- **Vercel**: `vercel deploy`
- **Netlify**: Drag & drop `dist/` folder
- **GitHub Pages**: Push to gh-pages branch

### Deploy Smart Contract

Contract is already deployed on Sepolia. To deploy to other networks:

1. Update contract address in `src/lib/contract.ts`
2. Ensure ABI matches your deployment
3. Update `SEPOLIA_CHAIN_ID` to target chain

## 🔮 Future Enhancements

- [ ] Multi-chain deployment (Polygon, Base, Arbitrum)
- [ ] IPFS integration for decentralized metadata storage
- [ ] Batch proof registration for efficiency
- [ ] NFT minting for ownership certificates
- [ ] Advanced analytics dashboard
- [ ] REST API for programmatic access
- [ ] Mobile app (React Native)

## 📄 License

MIT

## 🏆 Built For

ETHGlobal 2025 Hackathon - Avail Track

## 🔗 Links

- **Smart Contract**: [View on Etherscan](https://sepolia.etherscan.io/address/0xbAFC4A76712ad5d799fE51f516d4C2bEEc4c1A79)
- **Avail Docs**: [docs.availproject.org](https://docs.availproject.org)
- **Lovable Project**: https://lovable.dev/projects/eee28a2e-daf1-4d56-9dfc-cc1e1afe1941

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Open issues for bugs or feature requests
- Submit pull requests
- Improve documentation
- Share feedback

---

**Made with ❤️ using Lovable.dev**
