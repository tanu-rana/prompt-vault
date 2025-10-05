/**
 * Storage utility functions for PromptVault
 * Handles all Chrome storage operations with validation and error handling
 */

class StorageManager {
  constructor() {
    this.STORAGE_KEYS = {
      PROMPTS: 'promptvault_prompts',
      SETTINGS: 'promptvault_settings',
      USAGE_STATS: 'promptvault_usage_stats'
    };
    
    this.DEFAULT_SETTINGS = {
      theme: 'dark',
      showPreviewTooltips: true,
      maxSuggestions: 8,
      enableKeyboardShortcuts: true,
      tagColors: {
        'work': '#FF6B6B',
        'personal': '#4ECDC4',
        'creative': '#45B7D1',
        'technical': '#96CEB4',
        'marketing': '#FFEAA7',
        'research': '#DDA0DD',
        'default': '#74B9FF'
      }
    };
  }

  /**
   * Get all prompts from storage
   */
  async getPrompts() {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEYS.PROMPTS);
      return result[this.STORAGE_KEYS.PROMPTS] || [];
    } catch (error) {
      console.error('Error getting prompts:', error);
      return [];
    }
  }

  /**
   * Save prompts to storage
   */
  async savePrompts(prompts) {
    try {
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.PROMPTS]: prompts
      });
      return true;
    } catch (error) {
      console.error('Error saving prompts:', error);
      return false;
    }
  }

  /**
   * Add a new prompt
   */
  async addPrompt(prompt) {
    const prompts = await this.getPrompts();
    
    // Validate prompt
    if (!this.validatePrompt(prompt)) {
      throw new Error('Invalid prompt data');
    }
    
    // Check for duplicates
    const duplicate = prompts.find(p => p.title === prompt.title);
    if (duplicate) {
      throw new Error('Prompt with this title already exists');
    }
    
    const newPrompt = {
      id: this.generateId(),
      title: prompt.title,
      content: prompt.content,
      tags: prompt.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      lastUsed: null
    };
    
    prompts.push(newPrompt);
    await this.savePrompts(prompts);
    return newPrompt;
  }

  /**
   * Update an existing prompt
   */
  async updatePrompt(id, updates) {
    const prompts = await this.getPrompts();
    const index = prompts.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error('Prompt not found');
    }
    
    prompts[index] = {
      ...prompts[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await this.savePrompts(prompts);
    return prompts[index];
  }

  /**
   * Delete a prompt
   */
  async deletePrompt(id) {
    const prompts = await this.getPrompts();
    const filteredPrompts = prompts.filter(p => p.id !== id);
    
    if (filteredPrompts.length === prompts.length) {
      throw new Error('Prompt not found');
    }
    
    await this.savePrompts(filteredPrompts);
    return true;
  }

  /**
   * Record prompt usage
   */
  async recordUsage(id) {
    const prompts = await this.getPrompts();
    const prompt = prompts.find(p => p.id === id);
    
    if (prompt) {
      prompt.usageCount = (prompt.usageCount || 0) + 1;
      prompt.lastUsed = new Date().toISOString();
      await this.savePrompts(prompts);
    }
  }

  /**
   * Get settings
   */
  async getSettings() {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEYS.SETTINGS);
      return { ...this.DEFAULT_SETTINGS, ...result[this.STORAGE_KEYS.SETTINGS] };
    } catch (error) {
      console.error('Error getting settings:', error);
      return this.DEFAULT_SETTINGS;
    }
  }

  /**
   * Save settings
   */
  async saveSettings(settings) {
    try {
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.SETTINGS]: settings
      });
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  /**
   * Export all data as JSON
   */
  async exportData() {
    const prompts = await this.getPrompts();
    const settings = await this.getSettings();
    
    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      prompts,
      settings
    };
  }

  /**
   * Import data from JSON
   */
  async importData(data, options = { merge: false }) {
    try {
      // Validate import data
      if (!data.prompts || !Array.isArray(data.prompts)) {
        throw new Error('Invalid import data: prompts array required');
      }
      
      // Validate each prompt
      for (const prompt of data.prompts) {
        if (!this.validatePrompt(prompt)) {
          throw new Error(`Invalid prompt data: ${prompt.title || 'Unknown'}`);
        }
      }
      
      if (options.merge) {
        const existingPrompts = await this.getPrompts();
        const mergedPrompts = [...existingPrompts];
        
        for (const importPrompt of data.prompts) {
          const existing = mergedPrompts.find(p => p.title === importPrompt.title);
          if (!existing) {
            mergedPrompts.push({
              ...importPrompt,
              id: this.generateId(),
              createdAt: importPrompt.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }
        
        await this.savePrompts(mergedPrompts);
      } else {
        // Replace all prompts
        const processedPrompts = data.prompts.map(prompt => ({
          ...prompt,
          id: prompt.id || this.generateId(),
          createdAt: prompt.createdAt || new Date().toISOString(),
          updatedAt: prompt.updatedAt || new Date().toISOString(),
          usageCount: prompt.usageCount || 0,
          lastUsed: prompt.lastUsed || null
        }));
        
        await this.savePrompts(processedPrompts);
      }
      
      // Import settings if provided
      if (data.settings) {
        const currentSettings = await this.getSettings();
        await this.saveSettings({ ...currentSettings, ...data.settings });
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  /**
   * Validate prompt data
   */
  validatePrompt(prompt) {
    return prompt && 
           typeof prompt.title === 'string' && 
           prompt.title.trim().length > 0 &&
           typeof prompt.content === 'string' && 
           prompt.content.trim().length > 0 &&
           Array.isArray(prompt.tags || []);
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clearAll() {
    try {
      await chrome.storage.local.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
} else {
  window.StorageManager = StorageManager;
}