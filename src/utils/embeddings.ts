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
 * Extract text content from a file and normalize it
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
 * Normalize text for better comparison (used for short texts)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate text similarity using Levenshtein distance
 */
function textSimilarity(text1: string, text2: string): number {
  const normalized1 = normalizeText(text1);
  const normalized2 = normalizeText(text2);
  
  const maxLen = Math.max(normalized1.length, normalized2.length);
  if (maxLen === 0) return 1.0;
  
  const distance = levenshteinDistance(normalized1, normalized2);
  return 1 - (distance / maxLen);
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
 * Returns both the hash, embedding vector, and raw text
 */
export async function generateSemanticVectorHash(file: File): Promise<{
  hash: `0x${string}`;
  embedding: number[];
  text: string;
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
      embedding,
      text
    };
  } catch (error) {
    console.error('Error generating semantic vector hash:', error);
    throw error;
  }
}

/**
 * Check similarity between a new document and existing documents
 * Uses both semantic embeddings and text-based similarity for short texts
 * Returns matches above the similarity threshold
 */
export function checkSimilarity(
  newText: string,
  newEmbedding: number[],
  existingDocuments: Array<{ hash: string; embedding: number[]; creator: string; text?: string }>,
  threshold: number = 0.75 // Lowered threshold for better detection
): Array<{ hash: string; similarity: number; creator: string; method: string }> {
  const SHORT_TEXT_THRESHOLD = 100; // Characters
  const isShortText = newText.length < SHORT_TEXT_THRESHOLD;
  
  const matches = existingDocuments
    .map(existing => {
      // For short texts, use text-based similarity (more reliable)
      if (isShortText && existing.text && existing.text.length < SHORT_TEXT_THRESHOLD) {
        const textSim = textSimilarity(newText, existing.text);
        return {
          hash: existing.hash,
          creator: existing.creator,
          similarity: textSim,
          method: 'text-based'
        };
      }
      
      // For longer texts, use semantic embeddings
      const embeddingSim = cosineSimilarity(newEmbedding, existing.embedding);
      return {
        hash: existing.hash,
        creator: existing.creator,
        similarity: embeddingSim,
        method: 'semantic'
      };
    })
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
