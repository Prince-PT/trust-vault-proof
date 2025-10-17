export const TRUSTVAULT_ADDRESS = '0x46D24b31E86bb4c0C2D270b83737cA9Ba45E49a8' as const;

export const TRUSTVAULT_ABI = [
  {
    "inputs": [
      { "internalType": "bytes32", "name": "_contentHash", "type": "bytes32" },
      { "internalType": "bytes32", "name": "_vectorHash", "type": "bytes32" },
      { "internalType": "string", "name": "_metadataURI", "type": "string" }
    ],
    "name": "registerProof",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "_hash", "type": "bytes32" }],
    "name": "verifyHash",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" },
      { "internalType": "address", "name": "", "type": "address" },
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_proofId", "type": "uint256" }],
    "name": "getProofById",
    "outputs": [
      {
        "components": [
          { "internalType": "bytes32", "name": "contentHash", "type": "bytes32" },
          { "internalType": "bytes32", "name": "vectorHash", "type": "bytes32" },
          { "internalType": "address", "name": "creator", "type": "address" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "string", "name": "metadataURI", "type": "string" },
          { "internalType": "bool", "name": "revoked", "type": "bool" }
        ],
        "internalType": "struct TrustVaultRegistry.Proof",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "proofCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const SEPOLIA_CHAIN_ID = 11155111;

// Placeholder for AI vector hash (future feature)
export const PLACEHOLDER_VECTOR_HASH = '0x' + '00'.repeat(32);

export const generateMetadataURI = () => `ipfs://trustvault/${Date.now()}`;
