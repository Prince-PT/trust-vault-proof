export const TRUSTVAULT_ADDRESS = '0x81854C8C0b87B2e14f61ba7c87AaDFEF235d3E56' as const;

export const TRUSTVAULT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "proofId", "type": "uint256" },
      { "indexed": true, "internalType": "bytes32", "name": "contentHash", "type": "bytes32" },
      { "indexed": false, "internalType": "bytes32", "name": "vectorHash", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "creator", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "metadataURI", "type": "string" }
    ],
    "name": "ProofRegistered",
    "type": "event"
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
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "idToHash",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "proofCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "name": "proofs",
    "outputs": [
      { "internalType": "bytes32", "name": "contentHash", "type": "bytes32" },
      { "internalType": "bytes32", "name": "vectorHash", "type": "bytes32" },
      { "internalType": "address", "name": "creator", "type": "address" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "internalType": "string", "name": "metadataURI", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
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
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }],
    "name": "transferOwnership",
    "outputs": [],
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
  }
] as const;

export const SEPOLIA_CHAIN_ID = 11155111;

export const generateMetadataURI = () => `ipfs://trustvault/${Date.now()}`;
