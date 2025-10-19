import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

let embedder: any = null;

/**
 * Initialize the embedding model (lazy load)
 */
async function getEmbedder() {
  if (!embedder) {
    console.log('Loading MiniLM embedding model...');
    try {
      // Try WebGPU first, fall back to WASM if not available
      embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        { device: 'webgpu' }
      );
      console.log('Model loaded successfully with WebGPU');
    } catch (error) {
      console.log('WebGPU not available, falling back to WASM');
      embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      console.log('Model loaded successfully with WASM');
    }
  }
  return embedder;
}

/**
 * Extract text content from a file
 */
async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // Take first 5000 chars to avoid token limits
      resolve(text.slice(0, 5000));
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Generate semantic embedding for text
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const model = await getEmbedder();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Hash an embedding vector to create a 32-byte hex string
 */
async function hashEmbedding(embedding: number[]): Promise<string> {
  // Convert embedding to a stable string representation
  const embeddingStr = embedding.map(n => n.toFixed(8)).join(',');
  const encoder = new TextEncoder();
  const data = encoder.encode(embeddingStr);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Generate a semantic vector hash for a file
 * This creates an "AI fingerprint" based on the content's meaning
 * Returns both the hash and the raw embedding vector
 */
export async function generateSemanticVectorHash(file: File): Promise<{
  hash: `0x${string}`;
  embedding: number[];
}> {
  try {
    // Extract text from file
    const text = await extractTextFromFile(file);
    
    if (!text.trim()) {
      throw new Error('No text content found in file');
    }

    // Generate semantic embedding
    const embedding = await generateEmbedding(text);
    
    // Hash the embedding to create a deterministic fingerprint
    const hash = await hashEmbedding(embedding);
    
    return {
      hash: `0x${hash}`,
      embedding
    };
  } catch (error) {
    console.error('Error generating semantic vector hash:', error);
    throw error;
  }
}

/**
 * Check similarity between a new embedding and existing embeddings
 * Returns matches above the similarity threshold
 */
export function checkSimilarity(
  newEmbedding: number[],
  existingEmbeddings: Array<{ hash: string; embedding: number[]; creator: string }>,
  threshold: number = 0.85
): Array<{ hash: string; similarity: number; creator: string }> {
  const matches = existingEmbeddings
    .map(existing => ({
      hash: existing.hash,
      creator: existing.creator,
      similarity: cosineSimilarity(newEmbedding, existing.embedding)
    }))
    .filter(result => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
  
  return matches;
}

/**
 * Preload the model (call this early to improve UX)
 */
export async function preloadModel(): Promise<void> {
  try {
    await getEmbedder();
  } catch (error) {
    console.error('Failed to preload model:', error);
  }
}
