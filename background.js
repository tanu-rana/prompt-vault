/**
 * Background Service Worker for PromptVault
 * Handles storage operations, messaging, context menus, and keyboard shortcuts
 */

// Import utilities
importScripts('utils/storage.js');

class BackgroundService {
  constructor() {
    this.storage = new StorageManager();
    this.init();
  }

  init() {
    // Set up event listeners
    chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    chrome.commands.onCommand.addListener(this.handleCommand.bind(this));
    chrome.contextMenus.onClicked.addListener(this.handleContextMenu.bind(this));
    
    // Initialize context menus
    this.setupContextMenus();
  }

  /**
   * Handle extension installation
   */
  async handleInstall(details) {
    if (details.reason === 'install') {
      // Initialize with sample data
      await this.initializeSampleData();
      
      // Open options page
      chrome.tabs.create({ url: 'options.html' });
    }
  }

  /**
   * Handle messages from content scripts and popup
   */
  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'getPrompts':
          const prompts = await this.storage.getPrompts();
          sendResponse({ success: true, data: prompts });
          break;

        case 'addPrompt':
          const newPrompt = await this.storage.addPrompt(request.prompt);
          sendResponse({ success: true, data: newPrompt });
          break;

        case 'updatePrompt':
          const updatedPrompt = await this.storage.updatePrompt(request.id, request.updates);
          sendResponse({ success: true, data: updatedPrompt });
          break;

        case 'deletePrompt':
          await this.storage.deletePrompt(request.id);
          sendResponse({ success: true });
          break;

        case 'recordUsage':
          await this.storage.recordUsage(request.id);
          sendResponse({ success: true });
          break;

        case 'getSettings':
          const settings = await this.storage.getSettings();
          sendResponse({ success: true, data: settings });
          break;

        case 'saveSettings':
          await this.storage.saveSettings(request.settings);
          sendResponse({ success: true });
          break;

        case 'exportData':
          const exportData = await this.storage.exportData();
          sendResponse({ success: true, data: exportData });
          break;

        case 'importData':
          await this.storage.importData(request.data, request.options);
          sendResponse({ success: true });
          break;

        case 'saveFromSelection':
          await this.handleSaveFromSelection(request.text, sender.tab);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: error.message });
    }

    // Return true to indicate async response
    return true;
  }

  /**
   * Handle keyboard commands
   */
  async handleCommand(command) {
    switch (command) {
      case 'open-popup':
        // Open popup programmatically
        chrome.action.openPopup();
        break;
    }
  }

  /**
   * Handle context menu clicks
   */
  async handleContextMenu(info, tab) {
    if (info.menuItemId === 'save-as-prompt') {
      const selectedText = info.selectionText;
      if (selectedText && selectedText.trim().length > 0) {
        await this.handleSaveFromSelection(selectedText, tab);
        
        // Show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'PromptVault',
          message: 'Text saved as prompt! Open PromptVault to edit.'
        });
      }
    }
  }

  /**
   * Set up context menus
   */
  setupContextMenus() {
    chrome.contextMenus.create({
      id: 'save-as-prompt',
      title: 'Save as Prompt',
      contexts: ['selection'],
      documentUrlPatterns: [
        'https://chat.openai.com/*',
        'https://gemini.google.com/*',
        'https://www.perplexity.ai/*',
        'https://claude.ai/*',
        'https://poe.com/*',
        'https://bard.google.com/*',
        'https://copilot.microsoft.com/*'
      ]
    });
  }

  /**
   * Handle saving text from selection
   */
  async handleSaveFromSelection(text, tab) {
    try {
      // Generate a title from the first line or first 50 characters
      let title = text.split('\n')[0].trim();
      if (title.length > 50) {
        title = title.substring(0, 47) + '...';
      }
      
      // Determine tags based on the website
      const tags = this.getTagsFromUrl(tab.url);
      
      const prompt = {
        title: title,
        content: text.trim(),
        tags: tags
      };
      
      await this.storage.addPrompt(prompt);
    } catch (error) {
      console.error('Error saving selection as prompt:', error);
      // If title already exists, add timestamp
      try {
        const timestamp = new Date().toLocaleTimeString();
        const prompt = {
          title: `${title} (${timestamp})`,
          content: text.trim(),
          tags: this.getTagsFromUrl(tab.url)
        };
        await this.storage.addPrompt(prompt);
      } catch (retryError) {
        console.error('Retry failed:', retryError);
      }
    }
  }

  /**
   * Get suggested tags based on URL
   */
  getTagsFromUrl(url) {
    const tags = [];
    
    if (url.includes('chat.openai.com')) {
      tags.push('chatgpt');
    } else if (url.includes('gemini.google.com')) {
      tags.push('gemini');
    } else if (url.includes('perplexity.ai')) {
      tags.push('perplexity');
    } else if (url.includes('claude.ai')) {
      tags.push('claude');
    } else if (url.includes('poe.com')) {
      tags.push('poe');
    } else if (url.includes('copilot.microsoft.com')) {
      tags.push('copilot');
    }
    
    tags.push('saved-from-web');
    return tags;
  }

  /**
   * Initialize sample data for new installations
   */
  async initializeSampleData() {
    const samplePrompts = [
      {
        title: "Code Review Assistant",
        content: "Please review the following code for:\n1. Best practices and coding standards\n2. Potential bugs or security issues\n3. Performance optimizations\n4. Readability and maintainability\n\nProvide specific suggestions for improvement:\n\n[PASTE CODE HERE]",
        tags: ["development", "code-review", "technical"]
      },
      {
        title: "Creative Writing Brainstorm",
        content: "Help me brainstorm ideas for a creative writing project. I'm looking for:\n\n- Unique character concepts\n- Interesting plot twists\n- Compelling settings\n- Thematic elements\n\nGenre: [SPECIFY GENRE]\nTarget audience: [SPECIFY AUDIENCE]\nLength: [SHORT STORY/NOVEL/SCRIPT]",
        tags: ["creative", "writing", "brainstorm"]
      },
      {
        title: "Meeting Summary Template",
        content: "Please create a professional meeting summary with the following structure:\n\n**Meeting Details:**\n- Date: [DATE]\n- Attendees: [LIST]\n- Duration: [TIME]\n\n**Key Discussion Points:**\n[MAIN TOPICS]\n\n**Decisions Made:**\n[DECISIONS]\n\n**Action Items:**\n[TASKS WITH OWNERS AND DEADLINES]\n\n**Next Steps:**\n[FOLLOW-UP ACTIONS]",
        tags: ["work", "meetings", "productivity"]
      },
      {
        title: "Email Marketing Campaign",
        content: "Create an engaging email marketing campaign with:\n\n**Subject Line Options:**\n- [3-5 compelling subject lines]\n\n**Email Content:**\n- Personalized greeting\n- Clear value proposition\n- Compelling call-to-action\n- Professional closing\n\n**Target Audience:** [DESCRIBE]\n**Campaign Goal:** [OBJECTIVE]\n**Key Message:** [MAIN POINT]",
        tags: ["marketing", "email", "campaigns"]
      },
      {
        title: "Research Analysis Framework",
        content: "Analyze the following research topic using this framework:\n\n**1. Problem Statement**\n- What is the core issue?\n- Why is it important?\n\n**2. Current State Analysis**\n- What do we know?\n- What are the gaps?\n\n**3. Methodology**\n- How should we investigate?\n- What sources are most reliable?\n\n**4. Key Findings**\n- What are the main insights?\n- What patterns emerge?\n\n**5. Recommendations**\n- What actions should be taken?\n- What are the next steps?\n\nTopic: [RESEARCH TOPIC]",
        tags: ["research", "analysis", "academic"]
      }
    ];

    // Add sample prompts
    for (const promptData of samplePrompts) {
      try {
        await this.storage.addPrompt(promptData);
      } catch (error) {
        console.log('Sample prompt already exists:', promptData.title);
      }
    }
  }
}

// Initialize the background service
const backgroundService = new BackgroundService();