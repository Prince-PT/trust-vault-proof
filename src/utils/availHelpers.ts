/**
 * Utility functions for working with Avail commitments in metadata URIs
 */

/**
 * Extract Avail commitment from metadata URI
 * @param metadataURI URI with embedded commitment (e.g., "ipfs://...?avail=0x123...")
 * @returns Avail commitment or null if not found
 */
export function extractAvailCommitment(metadataURI: string): string | null {
  try {
    const url = new URL(metadataURI.replace('ipfs://', 'https://'));
    return url.searchParams.get('avail');
  } catch {
    return null;
  }
}

/**
 * Check if a metadata URI contains an Avail commitment
 */
export function hasAvailCommitment(metadataURI: string): boolean {
  return extractAvailCommitment(metadataURI) !== null;
}

/**
 * Format commitment for display (truncate if needed)
 */
export function formatCommitment(commitment: string, chars: number = 8): string {
  if (commitment.length <= chars * 2 + 2) return commitment;
  return `${commitment.slice(0, chars + 2)}...${commitment.slice(-chars)}`;
}
