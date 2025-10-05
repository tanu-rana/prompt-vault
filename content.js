/**
 * Content Script for PromptVault
 * Handles slash command detection, autocomplete dropdown, and prompt insertion
 */

class PromptVaultContent {
  constructor() {
    this.prompts = [];
    this.isActive = false;
    this.currentInput = null;
    this.dropdown = null;
    this.selectedIndex = -1;
    this.searchQuery = '';
    this.cursorPosition = 0;
    
    this.init();
  }

  async init() {
    // Load prompts from storage
    await this.loadPrompts();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Create dropdown element
    this.createDropdown();
    
    console.log('PromptVault content script initialized');
  }

  /**
   * Load prompts from background script
   */
  async loadPrompts() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getPrompts' });
      if (response.success) {
        this.prompts = response.data;
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  }

  /**
   * Set up event listeners for input detection
   */
  setupEventListeners() {
    // Listen for input events on text areas and input fields
    document.addEventListener('input', this.handleInput.bind(this), true);
    document.addEventListener('keydown', this.handleKeydown.bind(this), true);
    document.addEventListener('click', this.handleClick.bind(this), true);
    
    // Listen for dynamic content changes
    const observer = new MutationObserver(this.handleMutations.bind(this));
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Handle input events
   */
  handleInput(event) {
    const target = event.target;
    
    // Check if target is a text input element
    if (!this.isTextInput(target)) {
      return;
    }

    const value = target.value || target.textContent || '';
    const cursorPos = this.getCursorPosition(target);
    
    // Check for slash command
    const slashMatch = this.detectSlashCommand(value, cursorPos);
    
    if (slashMatch) {
      this.currentInput = target;
      this.cursorPosition = cursorPos;
      this.searchQuery = slashMatch.query;
      this.showDropdown(slashMatch.query, target);
    } else {
      this.hideDropdown();
    }
  }

  /**
   * Handle keydown events for navigation
   */
  handleKeydown(event) {
    if (!this.isActive || !this.dropdown) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.navigateDropdown(1);
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        this.navigateDropdown(-1);
        break;
      
      case 'Enter':
        event.preventDefault();
        this.selectCurrentItem();
        break;
      
      case 'Escape':
        event.preventDefault();
        this.hideDropdown();
        break;
      
      case 'Tab':
        if (this.selectedIndex >= 0) {
          event.preventDefault();
          this.selectCurrentItem();
        }
        break;
    }
  }

  /**
   * Handle click events to hide dropdown
   */
  handleClick(event) {
    if (this.isActive && !this.dropdown.contains(event.target)) {
      this.hideDropdown();
    }
  }

  /**
   * Handle DOM mutations for dynamic content
   */
  handleMutations(mutations) {
    // Refresh prompts when page content changes significantly
    let shouldRefresh = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && 
              (node.tagName === 'TEXTAREA' || node.tagName === 'INPUT' || 
               node.contentEditable === 'true')) {
            shouldRefresh = true;
            break;
          }
        }
      }
    });
    
    if (shouldRefresh) {
      this.loadPrompts();
    }
  }

  /**
   * Check if element is a text input
   */
  isTextInput(element) {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    
    // Standard input elements
    if (tagName === 'textarea') return true;
    if (tagName === 'input' && ['text', 'search', 'url', 'email'].includes(element.type)) return true;
    
    // Contenteditable elements
    if (element.contentEditable === 'true') return true;
    
    // Common chat input selectors
    const chatSelectors = [
      '[data-testid="textbox"]', // ChatGPT
      '[contenteditable="true"]', // Various platforms
      '.ProseMirror', // Many rich text editors
      '[role="textbox"]', // Accessibility role
      '.chat-input', // Generic chat input
      '.message-input' // Generic message input
    ];
    
    return chatSelectors.some(selector => element.matches(selector));
  }

  /**
   * Get cursor position in text input
   */
  getCursorPosition(element) {
    if (element.selectionStart !== undefined) {
      return element.selectionStart;
    }
    
    // For contenteditable elements
    if (element.contentEditable === 'true') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        return preCaretRange.toString().length;
      }
    }
    
    return 0;
  }

  /**
   * Detect slash command in text
   */
  detectSlashCommand(text, cursorPos) {
    // Look for slash command pattern: /query
    const beforeCursor = text.substring(0, cursorPos);
    const match = beforeCursor.match(/\/([^\/\s]*)$/);
    
    if (match) {
      return {
        query: match[1],
        startPos: match.index,
        endPos: cursorPos
      };
    }
    
    return null;
  }

  /**
   * Show autocomplete dropdown
   */
  async showDropdown(query, targetElement) {
    // Filter prompts based on query
    const filteredPrompts = await this.filterPrompts(query);
    
    if (filteredPrompts.length === 0) {
      this.hideDropdown();
      return;
    }

    // Position dropdown
    this.positionDropdown(targetElement);
    
    // Populate dropdown
    this.populateDropdown(filteredPrompts);
    
    // Show dropdown
    this.dropdown.style.display = 'block';
    this.isActive = true;
    this.selectedIndex = 0;
    this.updateSelection();
  }

  /**
   * Hide autocomplete dropdown
   */
  hideDropdown() {
    if (this.dropdown) {
      this.dropdown.style.display = 'none';
    }
    this.isActive = false;
    this.selectedIndex = -1;
    this.currentInput = null;
  }

  /**
   * Filter prompts based on search query
   */
  async filterPrompts(query) {
    if (!query) {
      // Return recent/popular prompts
      return this.prompts
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, 8);
    }

    // Simple fuzzy search
    const queryLower = query.toLowerCase();
    const matches = this.prompts.filter(prompt => {
      const titleMatch = prompt.title.toLowerCase().includes(queryLower);
      const tagMatch = prompt.tags.some(tag => tag.toLowerCase().includes(queryLower));
      const contentMatch = prompt.content.toLowerCase().includes(queryLower);
      
      return titleMatch || tagMatch || contentMatch;
    });

    // Sort by relevance
    return matches
      .sort((a, b) => {
        const aTitle = a.title.toLowerCase().includes(queryLower) ? 2 : 0;
        const bTitle = b.title.toLowerCase().includes(queryLower) ? 2 : 0;
        const aTag = a.tags.some(tag => tag.toLowerCase().includes(queryLower)) ? 1 : 0;
        const bTag = b.tags.some(tag => tag.toLowerCase().includes(queryLower)) ? 1 : 0;
        
        return (bTitle + bTag) - (aTitle + aTag);
      })
      .slice(0, 8);
  }

  /**
   * Create dropdown element
   */
  createDropdown() {
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'promptvault-dropdown';
    this.dropdown.style.cssText = `
      position: fixed;
      z-index: 10000;
      background: rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      max-height: 300px;
      overflow-y: auto;
      display: none;
      font-family: 'Sora', -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    
    document.body.appendChild(this.dropdown);
  }

  /**
   * Position dropdown relative to target element
   */
  positionDropdown(targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const dropdownHeight = 300; // max height
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    let top, left;
    
    if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
      // Position below
      top = rect.bottom + window.scrollY + 8;
    } else {
      // Position above
      top = rect.top + window.scrollY - dropdownHeight - 8;
    }
    
    left = rect.left + window.scrollX;
    
    // Ensure dropdown stays within viewport
    if (left + 400 > window.innerWidth) {
      left = window.innerWidth - 400 - 20;
    }
    if (left < 20) {
      left = 20;
    }
    
    this.dropdown.style.top = `${top}px`;
    this.dropdown.style.left = `${left}px`;
  }

  /**
   * Populate dropdown with filtered prompts
   */
  populateDropdown(prompts) {
    this.dropdown.innerHTML = '';
    
    prompts.forEach((prompt, index) => {
      const item = document.createElement('div');
      item.className = 'promptvault-dropdown-item';
      item.dataset.index = index;
      
      // Create preview content
      const preview = prompt.content.length > 100 ? 
        prompt.content.substring(0, 100) + '...' : 
        prompt.content;
      
      item.innerHTML = `
        <div class="prompt-title">${this.escapeHtml(prompt.title)}</div>
        <div class="prompt-tags">
          ${prompt.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
        </div>
        <div class="prompt-preview">${this.escapeHtml(preview)}</div>
      `;
      
      item.style.cssText = `
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        cursor: pointer;
        transition: background-color 0.15s ease;
      `;
      
      // Add click handler
      item.addEventListener('click', () => {
        this.selectedIndex = index;
        this.selectCurrentItem();
      });
      
      this.dropdown.appendChild(item);
    });
    
    // Add styles for dropdown items
    this.addDropdownStyles();
  }

  /**
   * Add CSS styles for dropdown
   */
  addDropdownStyles() {
    if (document.getElementById('promptvault-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'promptvault-styles';
    style.textContent = `
      .promptvault-dropdown-item.selected {
        background: rgba(116, 185, 255, 0.1) !important;
      }
      
      .promptvault-dropdown-item:hover {
        background: rgba(255, 255, 255, 0.05) !important;
      }
      
      .promptvault-dropdown .prompt-title {
        font-weight: 500;
        color: #F5F5F5;
        font-size: 14px;
        margin-bottom: 4px;
      }
      
      .promptvault-dropdown .prompt-tags {
        margin-bottom: 6px;
      }
      
      .promptvault-dropdown .tag {
        display: inline-block;
        background: #74B9FF;
        color: white;
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 4px;
        margin-right: 4px;
      }
      
      .promptvault-dropdown .prompt-preview {
        color: #B0B0B0;
        font-size: 12px;
        line-height: 1.3;
      }
      
      .promptvault-dropdown::-webkit-scrollbar {
        width: 6px;
      }
      
      .promptvault-dropdown::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
      }
      
      .promptvault-dropdown::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Navigate dropdown selection
   */
  navigateDropdown(direction) {
    const items = this.dropdown.querySelectorAll('.promptvault-dropdown-item');
    if (items.length === 0) return;
    
    this.selectedIndex += direction;
    
    if (this.selectedIndex < 0) {
      this.selectedIndex = items.length - 1;
    } else if (this.selectedIndex >= items.length) {
      this.selectedIndex = 0;
    }
    
    this.updateSelection();
  }

  /**
   * Update visual selection in dropdown
   */
  updateSelection() {
    const items = this.dropdown.querySelectorAll('.promptvault-dropdown-item');
    
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  /**
   * Select current item and insert prompt
   */
  async selectCurrentItem() {
    if (this.selectedIndex < 0 || !this.currentInput) return;
    
    const filteredPrompts = await this.filterPrompts(this.searchQuery);
    const selectedPrompt = filteredPrompts[this.selectedIndex];
    
    if (selectedPrompt) {
      await this.insertPrompt(selectedPrompt);
      
      // Record usage
      chrome.runtime.sendMessage({
        action: 'recordUsage',
        id: selectedPrompt.id
      });
    }
    
    this.hideDropdown();
  }

  /**
   * Insert prompt into input field
   */
  async insertPrompt(prompt) {
    const input = this.currentInput;
    const content = prompt.content;
    
    if (input.tagName.toLowerCase() === 'textarea' || input.tagName.toLowerCase() === 'input') {
      // Handle standard input elements
      const value = input.value;
      const beforeSlash = value.substring(0, this.cursorPosition - this.searchQuery.length - 1);
      const afterCursor = value.substring(this.cursorPosition);
      
      const newValue = beforeSlash + content + afterCursor;
      input.value = newValue;
      
      // Set cursor position after inserted content
      const newCursorPos = beforeSlash.length + content.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
      
      // Trigger input event
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
    } else if (input.contentEditable === 'true') {
      // Handle contenteditable elements
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      
      // Find the slash command text to replace
      const textNode = range.startContainer;
      const text = textNode.textContent;
      const slashIndex = text.lastIndexOf('/', range.startOffset);
      
      if (slashIndex !== -1) {
        // Create new range to select slash command
        const replaceRange = document.createRange();
        replaceRange.setStart(textNode, slashIndex);
        replaceRange.setEnd(textNode, range.startOffset);
        
        // Replace with prompt content
        replaceRange.deleteContents();
        replaceRange.insertNode(document.createTextNode(content));
        
        // Position cursor after inserted content
        const newRange = document.createRange();
        newRange.setStartAfter(replaceRange.endContainer);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        // Trigger input event
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    
    // Focus the input
    input.focus();
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PromptVaultContent();
  });
} else {
  new PromptVaultContent();
}