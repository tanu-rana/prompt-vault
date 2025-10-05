/**
 * Popup JavaScript for PromptVault
 * Handles UI interactions, search, and prompt management
 */

class PromptVaultPopup {
  constructor() {
    this.storage = new StorageManager();
    this.search = new SearchManager();
    this.prompts = [];
    this.filteredPrompts = [];
    this.currentFilter = 'all';
    this.editingPrompt = null;
    this.currentTags = [];
    
    this.init();
  }

  async init() {
    // Load initial data
    await this.loadPrompts();
    await this.loadSettings();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Render initial UI
    this.renderPrompts();
    this.updateStats();
    
    console.log('PromptVault popup initialized');
  }

  /**
   * Load prompts from storage
   */
  async loadPrompts() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getPrompts' });
      if (response.success) {
        this.prompts = response.data;
        this.filteredPrompts = [...this.prompts];
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
      this.showNotification('Error loading prompts', 'error');
    }
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      if (response.success) {
        this.settings = response.data;
        this.applyTheme(this.settings.theme);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', this.handleSearch.bind(this));
    
    // Clear search
    document.getElementById('clearSearch').addEventListener('click', this.clearSearch.bind(this));
    
    // Quick filters
    document.getElementById('quickFilters').addEventListener('click', this.handleFilterClick.bind(this));
    
    // Add prompt button
    document.getElementById('addPromptBtn').addEventListener('click', this.showAddPromptModal.bind(this));
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', this.toggleTheme.bind(this));
    
    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', this.openSettings.bind(this));
    
    // Export/Import buttons
    document.getElementById('exportBtn').addEventListener('click', this.exportLibrary.bind(this));
    document.getElementById('importBtn').addEventListener('click', this.importLibrary.bind(this));
    
    // Modal events
    document.getElementById('modalClose').addEventListener('click', this.hideModal.bind(this));
    document.getElementById('cancelBtn').addEventListener('click', this.hideModal.bind(this));
    document.getElementById('promptForm').addEventListener('submit', this.handleFormSubmit.bind(this));
    
    // Tags input
    document.getElementById('promptTags').addEventListener('keydown', this.handleTagInput.bind(this));
    
    // File input for import
    document.getElementById('fileInput').addEventListener('change', this.handleFileImport.bind(this));
    
    // Click outside modal to close
    document.getElementById('promptModal').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.hideModal();
      }
    });
  }

  /**
   * Handle search input
   */
  async handleSearch(event) {
    const query = event.target.value.trim();
    
    if (query.length === 0) {
      this.filteredPrompts = [...this.prompts];
    } else {
      this.filteredPrompts = await this.search.searchPrompts(this.prompts, query, {
        maxResults: 50,
        sortBy: 'relevance'
      });
    }
    
    this.applyCurrentFilter();
    this.renderPrompts();
  }

  /**
   * Clear search
   */
  clearSearch() {
    document.getElementById('searchInput').value = '';
    this.filteredPrompts = [...this.prompts];
    this.applyCurrentFilter();
    this.renderPrompts();
  }

  /**
   * Handle filter button clicks
   */
  handleFilterClick(event) {
    if (!event.target.classList.contains('filter-chip')) return;
    
    // Update active filter
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.classList.remove('active');
    });
    event.target.classList.add('active');
    
    this.currentFilter = event.target.dataset.filter;
    this.applyCurrentFilter();
    this.renderPrompts();
  }

  /**
   * Apply current filter to prompts
   */
  applyCurrentFilter() {
    switch (this.currentFilter) {
      case 'recent':
        this.filteredPrompts.sort((a, b) => {
          const aDate = new Date(a.updatedAt || a.createdAt);
          const bDate = new Date(b.updatedAt || b.createdAt);
          return bDate - aDate;
        });
        break;
      
      case 'popular':
        this.filteredPrompts.sort((a, b) => {
          const aUsage = a.usageCount || 0;
          const bUsage = b.usageCount || 0;
          return bUsage - aUsage;
        });
        break;
      
      case 'all':
      default:
        // Keep current order (search relevance or default)
        break;
    }
  }

  /**
   * Render prompts list
   */
  renderPrompts() {
    const promptsList = document.getElementById('promptsList');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    
    // Hide loading state
    loadingState.style.display = 'none';
    
    if (this.filteredPrompts.length === 0) {
      promptsList.innerHTML = '';
      emptyState.style.display = 'flex';
      return;
    }
    
    emptyState.style.display = 'none';
    
    promptsList.innerHTML = this.filteredPrompts.map(prompt => {
      const preview = prompt.content.length > 120 ? 
        prompt.content.substring(0, 120) + '...' : 
        prompt.content;
      
      const tagsHtml = prompt.tags.map((tag, index) => 
        `<span class="tag" style="background-color: ${this.getTagColor(tag, index)}">${this.escapeHtml(tag)}</span>`
      ).join('');
      
      const lastUsed = prompt.lastUsed ? 
        new Date(prompt.lastUsed).toLocaleDateString() : 
        'Never';
      
      return `
        <div class="prompt-item" data-id="${prompt.id}">
          <div class="prompt-header">
            <h3 class="prompt-title">${this.escapeHtml(prompt.title)}</h3>
            <div class="prompt-actions">
              <button class="action-btn copy-btn" data-action="copy" title="Copy to clipboard">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <button class="action-btn edit-btn" data-action="edit" title="Edit prompt">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="action-btn delete-btn" data-action="delete" title="Delete prompt">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="prompt-tags">
            ${tagsHtml}
          </div>
          
          <div class="prompt-preview">
            ${this.escapeHtml(preview)}
          </div>
          
          <div class="prompt-meta">
            <span class="usage-count">${prompt.usageCount || 0} uses</span>
            <span class="last-used">Last used: ${lastUsed}</span>
          </div>
        </div>
      `;
    }).join('');
    
    // Add event listeners to prompt items
    promptsList.addEventListener('click', this.handlePromptAction.bind(this));
  }

  /**
   * Handle prompt item actions
   */
  async handlePromptAction(event) {
    const actionBtn = event.target.closest('.action-btn');
    if (!actionBtn) return;
    
    const promptItem = actionBtn.closest('.prompt-item');
    const promptId = promptItem.dataset.id;
    const prompt = this.prompts.find(p => p.id === promptId);
    
    if (!prompt) return;
    
    const action = actionBtn.dataset.action;
    
    switch (action) {
      case 'copy':
        await this.copyPrompt(prompt);
        break;
      
      case 'edit':
        this.editPrompt(prompt);
        break;
      
      case 'delete':
        await this.deletePrompt(prompt);
        break;
    }
  }

  /**
   * Copy prompt to clipboard
   */
  async copyPrompt(prompt) {
    try {
      await navigator.clipboard.writeText(prompt.content);
      this.showNotification('Prompt copied to clipboard!', 'success');
      
      // Record usage
      chrome.runtime.sendMessage({
        action: 'recordUsage',
        id: prompt.id
      });
      
      // Update local data
      prompt.usageCount = (prompt.usageCount || 0) + 1;
      prompt.lastUsed = new Date().toISOString();
      
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.showNotification('Failed to copy prompt', 'error');
    }
  }

  /**
   * Edit prompt
   */
  editPrompt(prompt) {
    this.editingPrompt = prompt;
    this.currentTags = [...prompt.tags];
    
    document.getElementById('modalTitle').textContent = 'Edit Prompt';
    document.getElementById('promptTitle').value = prompt.title;
    document.getElementById('promptContent').value = prompt.content;
    document.getElementById('promptTags').value = '';
    
    this.renderTags();
    this.showModal();
  }

  /**
   * Delete prompt
   */
  async deletePrompt(prompt) {
    if (!confirm(`Are you sure you want to delete "${prompt.title}"?`)) {
      return;
    }
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'deletePrompt',
        id: prompt.id
      });
      
      if (response.success) {
        this.prompts = this.prompts.filter(p => p.id !== prompt.id);
        this.filteredPrompts = this.filteredPrompts.filter(p => p.id !== prompt.id);
        this.renderPrompts();
        this.updateStats();
        this.showNotification('Prompt deleted successfully', 'success');
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
      this.showNotification('Failed to delete prompt', 'error');
    }
  }

  /**
   * Show add prompt modal
   */
  showAddPromptModal() {
    this.editingPrompt = null;
    this.currentTags = [];
    
    document.getElementById('modalTitle').textContent = 'Add New Prompt';
    document.getElementById('promptTitle').value = '';
    document.getElementById('promptContent').value = '';
    document.getElementById('promptTags').value = '';
    
    this.renderTags();
    this.showModal();
  }

  /**
   * Show modal
   */
  showModal() {
    document.getElementById('promptModal').style.display = 'flex';
    document.getElementById('promptTitle').focus();
  }

  /**
   * Hide modal
   */
  hideModal() {
    document.getElementById('promptModal').style.display = 'none';
  }

  /**
   * Handle form submission
   */
  async handleFormSubmit(event) {
    event.preventDefault();
    
    const title = document.getElementById('promptTitle').value.trim();
    const content = document.getElementById('promptContent').value.trim();
    
    if (!title || !content) {
      this.showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    const promptData = {
      title,
      content,
      tags: this.currentTags
    };
    
    try {
      if (this.editingPrompt) {
        // Update existing prompt
        const response = await chrome.runtime.sendMessage({
          action: 'updatePrompt',
          id: this.editingPrompt.id,
          updates: promptData
        });
        
        if (response.success) {
          const index = this.prompts.findIndex(p => p.id === this.editingPrompt.id);
          if (index !== -1) {
            this.prompts[index] = response.data;
          }
          this.showNotification('Prompt updated successfully', 'success');
        }
      } else {
        // Add new prompt
        const response = await chrome.runtime.sendMessage({
          action: 'addPrompt',
          prompt: promptData
        });
        
        if (response.success) {
          this.prompts.push(response.data);
          this.showNotification('Prompt added successfully', 'success');
        }
      }
      
      this.filteredPrompts = [...this.prompts];
      this.applyCurrentFilter();
      this.renderPrompts();
      this.updateStats();
      this.hideModal();
      
    } catch (error) {
      console.error('Error saving prompt:', error);
      this.showNotification('Failed to save prompt', 'error');
    }
  }

  /**
   * Handle tag input
   */
  handleTagInput(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      const tagInput = event.target;
      const tag = tagInput.value.trim().toLowerCase();
      
      if (tag && !this.currentTags.includes(tag)) {
        this.currentTags.push(tag);
        tagInput.value = '';
        this.renderTags();
      }
    }
  }

  /**
   * Render tags in modal
   */
  renderTags() {
    const tagsList = document.getElementById('tagsList');
    
    tagsList.innerHTML = this.currentTags.map((tag, index) => `
      <span class="tag-item" style="background-color: ${this.getTagColor(tag, index)}">
        ${this.escapeHtml(tag)}
        <button class="tag-remove" data-tag="${this.escapeHtml(tag)}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </span>
    `).join('');
    
    // Add event listeners for tag removal
    tagsList.addEventListener('click', (event) => {
      if (event.target.closest('.tag-remove')) {
        const tag = event.target.closest('.tag-remove').dataset.tag;
        this.currentTags = this.currentTags.filter(t => t !== tag);
        this.renderTags();
      }
    });
  }

  /**
   * Get tag color
   */
  getTagColor(tag, index) {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#74B9FF', '#FD79A8'
    ];
    
    // Use tag name hash for consistent colors
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Toggle theme
   */
  async toggleTheme() {
    const newTheme = this.settings.theme === 'dark' ? 'light' : 'dark';
    this.settings.theme = newTheme;
    
    try {
      await chrome.runtime.sendMessage({
        action: 'saveSettings',
        settings: this.settings
      });
      
      this.applyTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }

  /**
   * Apply theme
   */
  applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
  }

  /**
   * Open settings page
   */
  openSettings() {
    chrome.tabs.create({ url: 'options.html' });
    window.close();
  }

  /**
   * Export library
   */
  async exportLibrary() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'exportData' });
      if (response.success) {
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `promptvault-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Library exported successfully', 'success');
      }
    } catch (error) {
      console.error('Error exporting library:', error);
      this.showNotification('Failed to export library', 'error');
    }
  }

  /**
   * Import library
   */
  importLibrary() {
    document.getElementById('fileInput').click();
  }

  /**
   * Handle file import
   */
  async handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const merge = confirm('Do you want to merge with existing prompts? Click Cancel to replace all prompts.');
      
      const response = await chrome.runtime.sendMessage({
        action: 'importData',
        data: data,
        options: { merge }
      });
      
      if (response.success) {
        await this.loadPrompts();
        this.filteredPrompts = [...this.prompts];
        this.renderPrompts();
        this.updateStats();
        this.showNotification('Library imported successfully', 'success');
      }
    } catch (error) {
      console.error('Error importing library:', error);
      this.showNotification('Failed to import library. Please check the file format.', 'error');
    }
    
    // Reset file input
    event.target.value = '';
  }

  /**
   * Update stats display
   */
  updateStats() {
    const count = this.prompts.length;
    const statsText = document.getElementById('footerStats').querySelector('.stats-text');
    statsText.textContent = `${count} prompt${count !== 1 ? 's' : ''}`;
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
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

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PromptVaultPopup();
});