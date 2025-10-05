/**
 * Unit tests for SearchManager
 * Tests search functionality, fuzzy matching, and filtering
 */

const SearchManager = require('../utils/search.js');

describe('SearchManager', () => {
  let search;
  let samplePrompts;

  beforeEach(() => {
    search = new SearchManager();
    samplePrompts = [
      {
        id: '1',
        title: 'JavaScript Code Review',
        content: 'Please review this JavaScript code for best practices and potential issues.',
        tags: ['javascript', 'code-review', 'development'],
        usageCount: 5,
        lastUsed: '2024-01-15T10:00:00Z',
        createdAt: '2024-01-01T10:00:00Z'
      },
      {
        id: '2',
        title: 'Python Data Analysis',
        content: 'Analyze this Python data science code and suggest improvements.',
        tags: ['python', 'data-science', 'analysis'],
        usageCount: 3,
        lastUsed: '2024-01-10T10:00:00Z',
        createdAt: '2024-01-02T10:00:00Z'
      },
      {
        id: '3',
        title: 'Creative Writing Prompt',
        content: 'Write a creative story about a time traveler who gets stuck in the past.',
        tags: ['creative', 'writing', 'fiction'],
        usageCount: 8,
        lastUsed: '2024-01-20T10:00:00Z',
        createdAt: '2024-01-03T10:00:00Z'
      },
      {
        id: '4',
        title: 'Meeting Summary Template',
        content: 'Create a professional meeting summary with action items and decisions.',
        tags: ['business', 'meetings', 'productivity'],
        usageCount: 12,
        lastUsed: '2024-01-25T10:00:00Z',
        createdAt: '2024-01-04T10:00:00Z'
      },
      {
        id: '5',
        title: 'Email Marketing Campaign',
        content: 'Design an email marketing campaign for a new product launch.',
        tags: ['marketing', 'email', 'campaigns'],
        usageCount: 2,
        lastUsed: '2024-01-05T10:00:00Z',
        createdAt: '2024-01-05T10:00:00Z'
      }
    ];
  });

  describe('Search Functionality', () => {
    test('should return all prompts when query is empty', async () => {
      const results = await search.searchPrompts(samplePrompts, '');
      expect(results).toHaveLength(5);
    });

    test('should find prompts by title', async () => {
      const results = await search.searchPrompts(samplePrompts, 'JavaScript');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('JavaScript Code Review');
    });

    test('should find prompts by content', async () => {
      const results = await search.searchPrompts(samplePrompts, 'time traveler');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Creative Writing Prompt');
    });

    test('should find prompts by tags', async () => {
      const results = await search.searchPrompts(samplePrompts, 'python');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Python Data Analysis');
    });

    test('should perform case-insensitive search', async () => {
      const results = await search.searchPrompts(samplePrompts, 'JAVASCRIPT');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('JavaScript Code Review');
    });

    test('should handle partial matches', async () => {
      const results = await search.searchPrompts(samplePrompts, 'Java');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('JavaScript Code Review');
    });

    test('should return multiple matches', async () => {
      const results = await search.searchPrompts(samplePrompts, 'code');
      expect(results.length).toBeGreaterThan(1);
      expect(results.some(r => r.title.includes('JavaScript'))).toBe(true);
      expect(results.some(r => r.title.includes('Python'))).toBe(true);
    });
  });

  describe('Fuzzy Search Scoring', () => {
    test('should calculate fuzzy scores correctly', () => {
      const exactMatch = search._calculateFuzzyScore('JavaScript', 'JavaScript Code Review');
      const partialMatch = search._calculateFuzzyScore('Java', 'JavaScript Code Review');
      const noMatch = search._calculateFuzzyScore('Python', 'JavaScript Code Review');

      expect(exactMatch).toBeGreaterThan(partialMatch);
      expect(partialMatch).toBeGreaterThan(noMatch);
      expect(exactMatch).toBeGreaterThan(0.8);
      expect(noMatch).toBe(0);
    });

    test('should prioritize exact matches', () => {
      const exactScore = search._calculateFuzzyScore('review', 'Code Review Template');
      const partialScore = search._calculateFuzzyScore('rev', 'Code Review Template');

      expect(exactScore).toBeGreaterThan(partialScore);
    });

    test('should handle empty or null inputs', () => {
      expect(search._calculateFuzzyScore('', 'test')).toBe(0);
      expect(search._calculateFuzzyScore('test', '')).toBe(0);
      expect(search._calculateFuzzyScore(null, 'test')).toBe(0);
      expect(search._calculateFuzzyScore('test', null)).toBe(0);
    });
  });

  describe('Tag Filtering', () => {
    test('should filter by single tag', async () => {
      const results = await search.searchPrompts(samplePrompts, '', {
        tags: ['javascript']
      });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('JavaScript Code Review');
    });

    test('should filter by multiple tags', async () => {
      const results = await search.searchPrompts(samplePrompts, '', {
        tags: ['development', 'creative']
      });

      expect(results).toHaveLength(2);
      expect(results.some(r => r.tags.includes('development'))).toBe(true);
      expect(results.some(r => r.tags.includes('creative'))).toBe(true);
    });

    test('should combine search query with tag filtering', async () => {
      const results = await search.searchPrompts(samplePrompts, 'code', {
        tags: ['javascript']
      });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('JavaScript Code Review');
    });
  });

  describe('Sorting', () => {
    test('should sort by relevance (default)', async () => {
      const results = await search.searchPrompts(samplePrompts, 'code', {
        sortBy: 'relevance'
      });

      // Results should be ordered by search relevance
      expect(results.length).toBeGreaterThan(1);
      // First result should have higher search score
      expect(results[0].searchScore).toBeGreaterThanOrEqual(results[1].searchScore);
    });

    test('should sort by usage count', async () => {
      const results = await search.searchPrompts(samplePrompts, '', {
        sortBy: 'usage'
      });

      expect(results[0].usageCount).toBeGreaterThanOrEqual(results[1].usageCount);
      expect(results[0].title).toBe('Meeting Summary Template'); // Highest usage count
    });

    test('should sort by recent activity', async () => {
      const results = await search.searchPrompts(samplePrompts, '', {
        sortBy: 'recent'
      });

      const firstDate = new Date(results[0].updatedAt || results[0].createdAt);
      const secondDate = new Date(results[1].updatedAt || results[1].createdAt);
      expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
    });

    test('should sort alphabetically', async () => {
      const results = await search.searchPrompts(samplePrompts, '', {
        sortBy: 'alphabetical'
      });

      expect(results[0].title.localeCompare(results[1].title)).toBeLessThanOrEqual(0);
    });
  });

  describe('Suggestions', () => {
    test('should get suggestions based on usage', () => {
      const suggestions = search.getSuggestions(samplePrompts, {
        maxSuggestions: 3
      });

      expect(suggestions).toHaveLength(3);
      // Should prioritize frequently used prompts
      expect(suggestions[0].usageCount).toBeGreaterThanOrEqual(suggestions[1].usageCount);
    });

    test('should get context-aware suggestions', () => {
      const suggestions = search.getSuggestions(samplePrompts, {
        context: 'javascript development',
        maxSuggestions: 5
      });

      expect(suggestions.length).toBeGreaterThan(0);
      // Should include JavaScript-related prompt
      expect(suggestions.some(s => s.title.includes('JavaScript'))).toBe(true);
    });

    test('should exclude specified prompts from suggestions', () => {
      const suggestions = search.getSuggestions(samplePrompts, {
        excludeIds: ['1', '2'],
        maxSuggestions: 5
      });

      expect(suggestions.every(s => !['1', '2'].includes(s.id))).toBe(true);
    });
  });

  describe('Tag Management', () => {
    test('should extract unique tags from prompts', () => {
      const tags = search.extractTags(samplePrompts);

      expect(tags).toContain('javascript');
      expect(tags).toContain('python');
      expect(tags).toContain('creative');
      expect(tags).toContain('development');
      
      // Should be sorted and unique
      const sortedTags = [...new Set(tags)].sort();
      expect(tags).toEqual(sortedTags);
    });

    test('should get tag suggestions', () => {
      const suggestions = search.getTagSuggestions(samplePrompts, 'dev');

      expect(suggestions).toContain('development');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    test('should prioritize tags that start with input', () => {
      const suggestions = search.getTagSuggestions(samplePrompts, 'c');

      // Should prioritize tags starting with 'c'
      const startsWithC = suggestions.filter(tag => tag.startsWith('c'));
      const containsC = suggestions.filter(tag => tag.includes('c') && !tag.startsWith('c'));

      if (startsWithC.length > 0 && containsC.length > 0) {
        expect(suggestions.indexOf(startsWithC[0])).toBeLessThan(suggestions.indexOf(containsC[0]));
      }
    });

    test('should limit tag suggestions', () => {
      const suggestions = search.getTagSuggestions(samplePrompts, '', 3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle empty prompts array', async () => {
      const results = await search.searchPrompts([], 'test');
      expect(results).toHaveLength(0);
    });

    test('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(1000);
      const results = await search.searchPrompts(samplePrompts, longQuery);
      expect(Array.isArray(results)).toBe(true);
    });

    test('should respect maxResults parameter', async () => {
      const results = await search.searchPrompts(samplePrompts, '', {
        maxResults: 2
      });
      expect(results).toHaveLength(2);
    });

    test('should clear search cache', () => {
      search.searchCache.set('test', 'value');
      expect(search.searchCache.has('test')).toBe(true);
      
      search.clearCache();
      expect(search.searchCache.has('test')).toBe(false);
    });
  });

  describe('Search Score Calculation', () => {
    test('should calculate tag scores correctly', () => {
      const exactTagScore = search._calculateTagScore('javascript', ['javascript', 'code']);
      const partialTagScore = search._calculateTagScore('java', ['javascript', 'code']);
      const noTagScore = search._calculateTagScore('python', ['javascript', 'code']);

      expect(exactTagScore).toBe(1.0);
      expect(partialTagScore).toBeGreaterThan(0);
      expect(partialTagScore).toBeLessThan(1.0);
      expect(noTagScore).toBe(0);
    });

    test('should handle empty tags array', () => {
      const score = search._calculateTagScore('test', []);
      expect(score).toBe(0);
    });

    test('should calculate suggestion scores', () => {
      const highUsagePrompt = {
        usageCount: 10,
        lastUsed: new Date().toISOString(),
        searchScore: 0.8
      };

      const lowUsagePrompt = {
        usageCount: 1,
        lastUsed: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        searchScore: 0.3
      };

      const highScore = search._calculateSuggestionScore(highUsagePrompt, 'test context');
      const lowScore = search._calculateSuggestionScore(lowUsagePrompt, 'test context');

      expect(highScore).toBeGreaterThan(lowScore);
    });
  });
});

// Export for Node.js testing environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SearchManager };
}