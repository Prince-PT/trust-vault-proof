/**
 * Local storage hook for storing and retrieving vector embeddings
 * This allows us to check for plagiarism by comparing semantic similarity
 */

const STORAGE_KEY = 'trustvault_vectors';

interface StoredVector {
  hash: string;
  embedding: number[];
  creator: string;
  timestamp: number;
  contentHash: string;
  text?: string; // Store original text for better short-text comparison
}

export function useVectorStorage() {
  const getVectors = (): StoredVector[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading vectors from storage:', error);
      return [];
    }
  };

  const addVector = (vector: Omit<StoredVector, 'timestamp'>) => {
    try {
      const vectors = getVectors();
      vectors.push({
        ...vector,
        timestamp: Date.now()
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vectors));
    } catch (error) {
      console.error('Error saving vector to storage:', error);
    }
  };

  const clearVectors = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing vectors:', error);
    }
  };

  return {
    getVectors,
    addVector,
    clearVectors
  };
}
