/**
 * Unit tests for StorageManager
 * Tests core storage functionality, validation, and data integrity
 */

// Mock Chrome APIs for testing
global.chrome = {
  storage: {
    local: {
      data: {},
      get: function(keys) {
        return Promise.resolve(
          typeof keys === 'string' 
            ? { [keys]: this.data[keys] }
            : keys.reduce((result, key) => {
                result[key] = this.data[key];
                return result;
              }, {})
        );
      },
      set: function(items) {
        Object.assign(this.data, items);
        return Promise.resolve();
      },
      clear: function() {
        this.data = {};
        return Promise.resolve();
      }
    }
  }
};

// Import the StorageManager
const StorageManager = require('../utils/storage.js');

describe('StorageManager', () => {
  let storage;

  beforeEach(() => {
    storage = new StorageManager();
    chrome.storage.local.data = {}; // Clear storage before each test
  });

  describe('Prompt Management', () => {
    test('should add a new prompt', async () => {
      const promptData = {
        title: 'Test Prompt',
        content: 'This is a test prompt content',
        tags: ['test', 'example']
      };

      const result = await storage.addPrompt(promptData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(promptData.title);
      expect(result.content).toBe(promptData.content);
      expect(result.tags).toEqual(promptData.tags);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.usageCount).toBe(0);
    });

    test('should retrieve all prompts', async () => {
      const promptData = {
        title: 'Test Prompt',
        content: 'Test content',
        tags: ['test']
      };

      await storage.addPrompt(promptData);
      const prompts = await storage.getPrompts();

      expect(prompts).toHaveLength(1);
      expect(prompts[0].title).toBe(promptData.title);
    });

    test('should update an existing prompt', async () => {
      const promptData = {
        title: 'Original Title',
        content: 'Original content',
        tags: ['original']
      };

      const prompt = await storage.addPrompt(promptData);
      const updates = {
        title: 'Updated Title',
        content: 'Updated content'
      };

      const updatedPrompt = await storage.updatePrompt(prompt.id, updates);

      expect(updatedPrompt.title).toBe(updates.title);
      expect(updatedPrompt.content).toBe(updates.content);
      expect(updatedPrompt.tags).toEqual(promptData.tags); // Should preserve original tags
      expect(updatedPrompt.updatedAt).not.toBe(prompt.updatedAt);
    });

    test('should delete a prompt', async () => {
      const promptData = {
        title: 'To Delete',
        content: 'This will be deleted',
        tags: []
      };

      const prompt = await storage.addPrompt(promptData);
      await storage.deletePrompt(prompt.id);

      const prompts = await storage.getPrompts();
      expect(prompts).toHaveLength(0);
    });

    test('should record usage statistics', async () => {
      const promptData = {
        title: 'Usage Test',
        content: 'Test usage tracking',
        tags: []
      };

      const prompt = await storage.addPrompt(promptData);
      await storage.recordUsage(prompt.id);

      const prompts = await storage.getPrompts();
      const updatedPrompt = prompts.find(p => p.id === prompt.id);

      expect(updatedPrompt.usageCount).toBe(1);
      expect(updatedPrompt.lastUsed).toBeDefined();
    });
  });

  describe('Validation', () => {
    test('should validate prompt data correctly', () => {
      const validPrompt = {
        title: 'Valid Title',
        content: 'Valid content',
        tags: ['tag1', 'tag2']
      };

      const invalidPrompts = [
        { title: '', content: 'content', tags: [] }, // Empty title
        { title: 'title', content: '', tags: [] }, // Empty content
        { title: 'title', content: 'content', tags: 'not-array' }, // Invalid tags
        null, // Null prompt
        undefined // Undefined prompt
      ];

      expect(storage.validatePrompt(validPrompt)).toBe(true);
      
      invalidPrompts.forEach(prompt => {
        expect(storage.validatePrompt(prompt)).toBe(false);
      });
    });

    test('should prevent duplicate titles', async () => {
      const promptData = {
        title: 'Duplicate Title',
        content: 'First content',
        tags: []
      };

      await storage.addPrompt(promptData);

      const duplicatePrompt = {
        title: 'Duplicate Title',
        content: 'Second content',
        tags: []
      };

      await expect(storage.addPrompt(duplicatePrompt)).rejects.toThrow('Prompt with this title already exists');
    });
  });

  describe('Settings Management', () => {
    test('should return default settings when none exist', async () => {
      const settings = await storage.getSettings();

      expect(settings).toBeDefined();
      expect(settings.theme).toBe('dark');
      expect(settings.showPreviewTooltips).toBe(true);
      expect(settings.maxSuggestions).toBe(8);
      expect(settings.tagColors).toBeDefined();
    });

    test('should save and retrieve custom settings', async () => {
      const customSettings = {
        theme: 'light',
        maxSuggestions: 10,
        showPreviewTooltips: false
      };

      await storage.saveSettings(customSettings);
      const retrievedSettings = await storage.getSettings();

      expect(retrievedSettings.theme).toBe('light');
      expect(retrievedSettings.maxSuggestions).toBe(10);
      expect(retrievedSettings.showPreviewTooltips).toBe(false);
      // Should still have default values for unspecified settings
      expect(retrievedSettings.enableKeyboardShortcuts).toBe(true);
    });
  });

  describe('Import/Export', () => {
    test('should export data correctly', async () => {
      const promptData = {
        title: 'Export Test',
        content: 'Test export functionality',
        tags: ['export', 'test']
      };

      await storage.addPrompt(promptData);
      const exportData = await storage.exportData();

      expect(exportData).toBeDefined();
      expect(exportData.version).toBe('1.0.0');
      expect(exportData.exportDate).toBeDefined();
      expect(exportData.prompts).toHaveLength(1);
      expect(exportData.prompts[0].title).toBe(promptData.title);
      expect(exportData.settings).toBeDefined();
    });

    test('should import data correctly (replace mode)', async () => {
      // Add initial prompt
      await storage.addPrompt({
        title: 'Original',
        content: 'Original content',
        tags: []
      });

      const importData = {
        version: '1.0.0',
        prompts: [
          {
            title: 'Imported Prompt',
            content: 'Imported content',
            tags: ['imported']
          }
        ],
        settings: {
          theme: 'light'
        }
      };

      await storage.importData(importData, { merge: false });

      const prompts = await storage.getPrompts();
      const settings = await storage.getSettings();

      expect(prompts).toHaveLength(1);
      expect(prompts[0].title).toBe('Imported Prompt');
      expect(settings.theme).toBe('light');
    });

    test('should import data correctly (merge mode)', async () => {
      // Add initial prompt
      await storage.addPrompt({
        title: 'Original',
        content: 'Original content',
        tags: []
      });

      const importData = {
        version: '1.0.0',
        prompts: [
          {
            title: 'Imported Prompt',
            content: 'Imported content',
            tags: ['imported']
          }
        ]
      };

      await storage.importData(importData, { merge: true });

      const prompts = await storage.getPrompts();

      expect(prompts).toHaveLength(2);
      expect(prompts.some(p => p.title === 'Original')).toBe(true);
      expect(prompts.some(p => p.title === 'Imported Prompt')).toBe(true);
    });

    test('should handle invalid import data', async () => {
      const invalidData = {
        version: '1.0.0',
        prompts: 'not-an-array'
      };

      await expect(storage.importData(invalidData)).rejects.toThrow('Invalid import data: prompts array required');
    });
  });

  describe('Utility Functions', () => {
    test('should generate unique IDs', () => {
      const id1 = storage.generateId();
      const id2 = storage.generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    test('should clear all data', async () => {
      // Add some data
      await storage.addPrompt({
        title: 'Test',
        content: 'Test content',
        tags: []
      });

      await storage.saveSettings({ theme: 'light' });

      // Clear all data
      await storage.clearAll();

      // Verify data is cleared
      const prompts = await storage.getPrompts();
      const settings = await storage.getSettings();

      expect(prompts).toHaveLength(0);
      expect(settings.theme).toBe('dark'); // Should return to defaults
    });
  });
});

// Export for Node.js testing environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StorageManager };
}