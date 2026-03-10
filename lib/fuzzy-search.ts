// lib/fuzzy-search.ts

export function fuzzyScore(query: string, target: string): number {
  if (!query || !target) return 0;
  
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  
  // 🔹 Exact match = perfect score
  if (t === q) return 1.0;
  
  // 🔹 Substring match = high score
  if (t.includes(q)) {
    // Score based on position (earlier = better) and length ratio
    const position = t.indexOf(q);
    const lengthRatio = q.length / t.length;
    return 0.9 - (position * 0.01) + (lengthRatio * 0.1);
  }
  
  // 🔹 Fuzzy match: characters in order (not necessarily consecutive)
  let queryIndex = 0;
  let consecutiveMatches = 0;
  let lastMatchIndex = -1;
  
  for (let i = 0; i < t.length && queryIndex < q.length; i++) {
    if (t[i] === q[queryIndex]) {
      // Bonus for consecutive matches
      if (i === lastMatchIndex + 1) {
        consecutiveMatches++;
      } else {
        consecutiveMatches = 1;
      }
      lastMatchIndex = i;
      queryIndex++;
    }
  }
  
  // If all query characters found in order
  if (queryIndex === q.length) {
    const baseScore = 0.7;
    const consecutiveBonus = Math.min(consecutiveMatches * 0.05, 0.2);
    const lengthPenalty = q.length >= t.length * 0.5 ? 0 : -0.1;
    return Math.min(baseScore + consecutiveBonus + lengthPenalty, 0.95);
  }
  
  // 🔹 Partial fuzzy: score based on how many chars matched
  const partialRatio = queryIndex / q.length;
  return partialRatio * 0.5;
}

/**
 * Check if query fuzzy-matches target above threshold
 */
export function fuzzyMatch(query: string, target: string, threshold: number = 0.4): boolean {
  return fuzzyScore(query, target) >= threshold;
}

/**
 * Normalize string for comparison
 */
export function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ''); // Remove special chars for fuzzy matching
}