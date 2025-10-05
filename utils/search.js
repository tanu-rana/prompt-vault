/**
 * Search and filtering utilities for PromptVault
 * Implements fuzzy search, tag filtering, and smart ranking
 */

class SearchManager {
  constructor() {
    this.searchCache = new Map();
    this.debounceTimeout = null;
  }

  /**
   * Perform fuzzy search on prompts with debouncing
   */
  searchPrompts(prompts, query, options = {}) {
    const {
      tags = [],
      maxResults = 50,
      includeContent = true,
      sortBy = 'relevance' // 'relevance', 'recent', 'usage', 'alphabetical'
    } = options;

    // Clear previous debounce
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    return new Promise((resolve) => {
      this.debounceTimeout = setTimeout(() => {
        const results = this._performSearch(prompts, query, {
          tags,
          maxResults,
          includeContent,
          sortBy
        });
        resolve(results);
      }, 150); // 150ms debounce
    });
  }

  /**
   * Internal search implementation
   */
  _performSearch(prompts, query, options) {
    let filteredPrompts = [...prompts];

    // Filter by tags first
    if (options.tags.length > 0) {
      filteredPrompts = filteredPrompts.filter(prompt => 
        options.tags.some(tag => 
          prompt.tags.some(promptTag => 
            promptTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }

    // If no query, return filtered results
    if (!query || query.trim().length === 0) {
      return this._sortResults(filteredPrompts, options.sortBy).slice(0, options.maxResults);
    }

    // Perform fuzzy search
    const searchResults = filteredPrompts.map(prompt => {
      const titleScore = this._calculateFuzzyScore(query, prompt.title);
      const contentScore = options.includeContent ? 
        this._calculateFuzzyScore(query, prompt.content) * 0.7 : 0;
      const tagScore = this._calculateTagScore(query, prompt.tags) * 0.8;
      
      const totalScore = Math.max(titleScore, contentScore, tagScore);
      
      return {
        ...prompt,
        searchScore: totalScore,
        matchedIn: this._getMatchLocation(query, prompt, titleScore, contentScore, tagScore)
      };
    });

    // Filter out low-scoring results
    const relevantResults = searchResults.filter(result => result.searchScore > 0.3);

    // Sort and limit results
    return this._sortResults(relevantResults, options.sortBy).slice(0, options.maxResults);
  }

  /**
   * Calculate fuzzy search score using Levenshtein-like algorithm
   */
  _calculateFuzzyScore(query, text) {
    if (!query || !text) return 0;
    
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Exact match gets highest score
    if (textLower.includes(queryLower)) {
      const position = textLower.indexOf(queryLower);
      const lengthRatio = queryLower.length / textLower.length;
      const positionScore = 1 - (position / textLower.length);
      return 0.8 + (lengthRatio * 0.2) + (positionScore * 0.1);
    }
    
    // Fuzzy matching for partial matches
    let score = 0;
    let queryIndex = 0;
    
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        score += 1;
        queryIndex++;
      }
    }
    
    if (queryIndex === queryLower.length) {
      return (score / queryLower.length) * 0.6;
    }
    
    // Word boundary matching
    const words = textLower.split(/\s+/);
    const queryWords = queryLower.split(/\s+/);
    
    let wordMatches = 0;
    for (const queryWord of queryWords) {
      for (const word of words) {
        if (word.startsWith(queryWord) || word.includes(queryWord)) {
          wordMatches++;
          break;
        }
      }
    }
    
    return (wordMatches / queryWords.length) * 0.4;
  }

  /**
   * Calculate tag matching score
   */
  _calculateTagScore(query, tags) {
    if (!tags || tags.length === 0) return 0;
    
    const queryLower = query.toLowerCase();
    let bestScore = 0;
    
    for (const tag of tags) {
      const tagLower = tag.toLowerCase();
      if (tagLower === queryLower) {
        return 1.0;
      }
      if (tagLower.includes(queryLower) || queryLower.includes(tagLower)) {
        bestScore = Math.max(bestScore, 0.8);
      }
      if (tagLower.startsWith(queryLower)) {
        bestScore = Math.max(bestScore, 0.6);
      }
    }
    
    return bestScore;
  }

  /**
   * Determine where the match occurred
   */
  _getMatchLocation(query, prompt, titleScore, contentScore, tagScore) {
    if (titleScore >= contentScore && titleScore >= tagScore) {
      return 'title';
    }
    if (tagScore >= contentScore) {
      return 'tags';
    }
    return 'content';
  }

  /**
   * Sort results based on specified criteria
   */
  _sortResults(results, sortBy) {
    switch (sortBy) {
      case 'recent':
        return results.sort((a, b) => {
          const aDate = new Date(a.updatedAt || a.createdAt);
          const bDate = new Date(b.updatedAt || b.createdAt);
          return bDate - aDate;
        });
      
      case 'usage':
        return results.sort((a, b) => {
          const aUsage = a.usageCount || 0;
          const bUsage = b.usageCount || 0;
          if (aUsage !== bUsage) {
            return bUsage - aUsage;
          }
          // Secondary sort by recent usage
          const aLastUsed = a.lastUsed ? new Date(a.lastUsed) : new Date(0);
          const bLastUsed = b.lastUsed ? new Date(b.lastUsed) : new Date(0);
          return bLastUsed - aLastUsed;
        });
      
      case 'alphabetical':
        return results.sort((a, b) => a.title.localeCompare(b.title));
      
      case 'relevance':
      default:
        return results.sort((a, b) => {
          // Primary sort by search score if available
          if (a.searchScore !== undefined && b.searchScore !== undefined) {
            if (Math.abs(a.searchScore - b.searchScore) > 0.1) {
              return b.searchScore - a.searchScore;
            }
          }
          
          // Secondary sort by usage frequency
          const aUsage = a.usageCount || 0;
          const bUsage = b.usageCount || 0;
          if (aUsage !== bUsage) {
            return bUsage - aUsage;
          }
          
          // Tertiary sort by recency
          const aDate = new Date(a.lastUsed || a.updatedAt || a.createdAt);
          const bDate = new Date(b.lastUsed || b.updatedAt || b.createdAt);
          return bDate - aDate;
        });
    }
  }

  /**
   * Get suggested prompts based on context and usage
   */
  getSuggestions(prompts, options = {}) {
    const {
      maxSuggestions = 8,
      context = '',
      excludeIds = []
    } = options;

    let suggestions = prompts.filter(prompt => !excludeIds.includes(prompt.id));

    // If context is provided, search for relevant prompts
    if (context && context.trim().length > 0) {
      suggestions = this._performSearch(suggestions, context, {
        maxResults: maxSuggestions * 2,
        sortBy: 'relevance'
      });
    }

    // Boost frequently used prompts
    suggestions = suggestions.map(prompt => ({
      ...prompt,
      suggestionScore: this._calculateSuggestionScore(prompt, context)
    }));

    // Sort by suggestion score and limit
    return suggestions
      .sort((a, b) => b.suggestionScore - a.suggestionScore)
      .slice(0, maxSuggestions);
  }

  /**
   * Calculate suggestion score based on usage and recency
   */
  _calculateSuggestionScore(prompt, context) {
    let score = 0;
    
    // Usage frequency (0-0.4)
    const usageCount = prompt.usageCount || 0;
    score += Math.min(usageCount / 10, 0.4);
    
    // Recency (0-0.3)
    if (prompt.lastUsed) {
      const daysSinceUsed = (Date.now() - new Date(prompt.lastUsed)) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 0.3 - (daysSinceUsed / 30) * 0.3);
    }
    
    // Context relevance (0-0.3)
    if (context && prompt.searchScore !== undefined) {
      score += prompt.searchScore * 0.3;
    }
    
    return score;
  }

  /**
   * Extract unique tags from prompts
   */
  extractTags(prompts) {
    const tagSet = new Set();
    
    prompts.forEach(prompt => {
      if (prompt.tags) {
        prompt.tags.forEach(tag => tagSet.add(tag.toLowerCase()));
      }
    });
    
    return Array.from(tagSet).sort();
  }

  /**
   * Get tag suggestions based on partial input
   */
  getTagSuggestions(prompts, partialTag, maxSuggestions = 5) {
    const allTags = this.extractTags(prompts);
    const partialLower = partialTag.toLowerCase();
    
    return allTags
      .filter(tag => tag.includes(partialLower))
      .sort((a, b) => {
        // Prioritize tags that start with the partial input
        const aStarts = a.startsWith(partialLower);
        const bStarts = b.startsWith(partialLower);
        
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        return a.localeCompare(b);
      })
      .slice(0, maxSuggestions);
  }

  /**
   * Clear search cache
   */
  clearCache() {
    this.searchCache.clear();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchManager;
} else {
  window.SearchManager = SearchManager;
}