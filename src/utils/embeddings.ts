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
    embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      { device: 'webgpu' }
    );
    console.log('Model loaded successfully');
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
 * Generate a semantic vector hash for a file
 * This creates an "AI fingerprint" based on the content's meaning
 */
export async function generateSemanticVectorHash(file: File): Promise<`0x${string}`> {
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
    
    return `0x${hash}`;
  } catch (error) {
    console.error('Error generating semantic vector hash:', error);
    throw error;
  }
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
