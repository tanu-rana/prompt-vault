/**
 * Options Page JavaScript for PromptVault
 * Handles full library management, settings, and import/export
 */

class PromptVaultOptions {
  constructor() {
    this.storage = new StorageManager();
    this.search = new SearchManager();
    this.prompts = [];
    this.filteredPrompts = [];
    this.selectedPrompts = new Set();
    this.currentTab = 'library';
    this.editingPrompt = null;
    this.currentTags = [];
    this.settings = {};
    
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
    this.renderTagFilter();
    this.updateStats();
    this.applySettings();
    
    console.log('PromptVault options initialized');
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
      this.showToast('Error loading prompts', 'error');
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
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', this.handleTabClick.bind(this));
    });

    // Search and filters
    document.getElementById('searchInput').addEventListener('input', this.handleSearch.bind(this));
    document.getElementById('clearSearch').addEventListener('click', this.clearSearch.bind(this));
    document.getElementById('sortBy').addEventListener('change', this.handleSort.bind(this));
    document.getElementById('tagFilter').addEventListener('change', this.handleTagFilter.bind(this));

    // Add prompt buttons
    document.getElementById('addPromptBtn').addEventListener('click', this.showAddPromptModal.bind(this));
    document.getElementById('emptyAddBtn').addEventListener('click', this.showAddPromptModal.bind(this));

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', this.toggleTheme.bind(this));

    // Settings
    document.getElementById('themeSelect').addEventListener('change', this.handleThemeChange.bind(this));
    document.getElementById('showPreviewTooltips').addEventListener('change', this.handleSettingChange.bind(this));
    document.getElementById('maxSuggestions').addEventListener('change', this.handleSettingChange.bind(this));
    document.getElementById('enableKeyboardShortcuts').addEventListener('change', this.handleSettingChange.bind(this));
    document.getElementById('clearAllBtn').addEventListener('click', this.handleClearAll.bind(this));

    // Import/Export
    document.getElementById('exportAllBtn').addEventListener('click', this.exportAll.bind(this));
    document.getElementById('exportSelectedBtn').addEventListener('click', this.exportSelected.bind(this));
    document.getElementById('importBtn').addEventListener('click', this.importLibrary.bind(this));
    document.getElementById('loadSampleBtn').addEventListener('click', this.loadSampleData.bind(this));
    document.getElementById('fileInput').addEventListener('change', this.handleFileImport.bind(this));

    // Modal events
    document.getElementById('modalClose').addEventListener('click', this.hideModal.bind(this));
    document.getElementById('cancelBtn').addEventListener('click', this.hideModal.bind(this));
    document.getElementById('promptForm').addEventListener('submit', this.handleFormSubmit.bind(this));
    document.getElementById('promptTags').addEventListener('keydown', this.handleTagInput.bind(this));

    // Confirmation modal
    document.getElementById('confirmCancel').addEventListener('click', this.hideConfirmModal.bind(this));
    document.getElementById('confirmOk').addEventListener('click', this.handleConfirmOk.bind(this));

    // Click outside modal to close
    document.getElementById('promptModal').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.hideModal();
      }
    });

    document.getElementById('confirmModal').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.hideConfirmModal();
      }
    });
  }

  /**
   * Handle tab navigation
   */
  handleTabClick(event) {
    const tabId = event.currentTarget.dataset.tab;
    
    // Update active tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Show corresponding content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabId}-tab`).classList.add('active');

    this.currentTab = tabId;
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
        maxResults: 1000,
        sortBy: document.getElementById('sortBy').value
      });
    }
    
    this.applyTagFilter();
    this.renderPrompts();
    this.updateStats();
  }

  /**
   * Clear search
   */
  clearSearch() {
    document.getElementById('searchInput').value = '';
    this.filteredPrompts = [...this.prompts];
    this.applyTagFilter();
    this.renderPrompts();
    this.updateStats();
  }

  /**
   * Handle sort change
   */
  handleSort() {
    const sortBy = document.getElementById('sortBy').value;
    
    this.filteredPrompts = this.filteredPrompts.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          const aDate = new Date(a.updatedAt || a.createdAt);
          const bDate = new Date(b.updatedAt || b.createdAt);
          return bDate - aDate;
        
        case 'usage':
          const aUsage = a.usageCount || 0;
          const bUsage = b.usageCount || 0;
          return bUsage - aUsage;
        
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        
        default:
          return 0;
      }
    });
    
    this.renderPrompts();
  }

  /**
   * Handle tag filter
   */
  handleTagFilter() {
    this.applyTagFilter();
    this.renderPrompts();
    this.updateStats();
  }

  /**
   * Apply tag filter to current results
   */
  applyTagFilter() {
    const selectedTag = document.getElementById('tagFilter').value;
    
    if (!selectedTag) {
      return; // No filter applied
    }
    
    this.filteredPrompts = this.filteredPrompts.filter(prompt =>
      prompt.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
    );
  }

  /**
   * Render prompts grid
   */
  renderPrompts() {
    const promptsGrid = document.getElementById('promptsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (this.filteredPrompts.length === 0) {
      promptsGrid.innerHTML = '';
      emptyState.style.display = 'flex';
      return;
    }
    
    emptyState.style.display = 'none';
    
    promptsGrid.innerHTML = this.filteredPrompts.map(prompt => {
      const preview = prompt.content.length > 200 ? 
        prompt.content.substring(0, 200) + '...' : 
        prompt.content;
      
      const tagsHtml = prompt.tags.map((tag, index) => 
        `<span class="tag" style="background-color: ${this.getTagColor(tag, index)}">${this.escapeHtml(tag)}</span>`
      ).join('');
      
      const lastUsed = prompt.lastUsed ? 
        new Date(prompt.lastUsed).toLocaleDateString() : 
        'Never';
      
      const isSelected = this.selectedPrompts.has(prompt.id);
      
      return `
        <div class="prompt-card ${isSelected ? 'selected' : ''}" data-id="${prompt.id}">
          <div class="prompt-card-header">
            <div class="prompt-select">
              <input type="checkbox" class="prompt-checkbox" ${isSelected ? 'checked' : ''}>
            </div>
            <div class="prompt-actions">
              <button class="action-btn copy-btn" data-action="copy" title="Copy to clipboard">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <button class="action-btn download-btn" data-action="download" title="Download as JSON">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
              <button class="action-btn edit-btn" data-action="edit" title="Edit prompt">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="action-btn delete-btn" data-action="delete" title="Delete prompt">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="prompt-card-content">
            <h3 class="prompt-title">${this.escapeHtml(prompt.title)}</h3>
            
            <div class="prompt-tags">
              ${tagsHtml}
            </div>
            
            <div class="prompt-preview">
              ${this.escapeHtml(preview)}
            </div>
            
            <div class="prompt-meta">
              <div class="meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 11H1l6-6 6 6z"/>
                  <path d="M9 17l3 3 3-3"/>
                  <path d="M22 18.5c-.4-.3-.8-.5-1.3-.5C19.8 18 19 18.8 19 19.8s.8 1.8 1.7 1.8c.5 0 .9-.2 1.3-.5"/>
                </svg>
                ${prompt.usageCount || 0} uses
              </div>
              <div class="meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                ${lastUsed}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    // Add event listeners
    promptsGrid.addEventListener('click', this.handlePromptAction.bind(this));
    promptsGrid.addEventListener('change', this.handlePromptSelection.bind(this));
  }

  /**
   * Handle prompt actions
   */
  async handlePromptAction(event) {
    const actionBtn = event.target.closest('.action-btn');
    if (!actionBtn) return;
    
    const promptCard = actionBtn.closest('.prompt-card');
    const promptId = promptCard.dataset.id;
    const prompt = this.prompts.find(p => p.id === promptId);
    
    if (!prompt) return;
    
    const action = actionBtn.dataset.action;
    
    switch (action) {
      case 'copy':
        await this.copyPrompt(prompt);
        break;
      
      case 'download':
        this.downloadPrompt(prompt);
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
   * Handle prompt selection
   */
  handlePromptSelection(event) {
    if (!event.target.classList.contains('prompt-checkbox')) return;
    
    const promptCard = event.target.closest('.prompt-card');
    const promptId = promptCard.dataset.id;
    
    if (event.target.checked) {
      this.selectedPrompts.add(promptId);
      promptCard.classList.add('selected');
    } else {
      this.selectedPrompts.delete(promptId);
      promptCard.classList.remove('selected');
    }
    
    // Update export selected button
    const exportSelectedBtn = document.getElementById('exportSelectedBtn');
    exportSelectedBtn.disabled = this.selectedPrompts.size === 0;
    exportSelectedBtn.textContent = this.selectedPrompts.size > 0 ? 
      `Export Selected (${this.selectedPrompts.size})` : 
      'Export Selected';
  }

  /**
   * Copy prompt to clipboard
   */
  async copyPrompt(prompt) {
    try {
      await navigator.clipboard.writeText(prompt.content);
      this.showToast('Prompt copied to clipboard!', 'success');
      
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
      this.showToast('Failed to copy prompt', 'error');
    }
  }

  /**
   * Download individual prompt as JSON
   */
  downloadPrompt(prompt) {
    const data = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      prompts: [prompt]
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prompt.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showToast('Prompt downloaded successfully', 'success');
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
   * Delete prompt with confirmation
   */
  async deletePrompt(prompt) {
    this.showConfirmModal(
      'Delete Prompt',
      `Are you sure you want to delete "${prompt.title}"? This action cannot be undone.`,
      async () => {
        try {
          const response = await chrome.runtime.sendMessage({
            action: 'deletePrompt',
            id: prompt.id
          });
          
          if (response.success) {
            this.prompts = this.prompts.filter(p => p.id !== prompt.id);
            this.filteredPrompts = this.filteredPrompts.filter(p => p.id !== prompt.id);
            this.selectedPrompts.delete(prompt.id);
            this.renderPrompts();
            this.updateStats();
            this.showToast('Prompt deleted successfully', 'success');
          }
        } catch (error) {
          console.error('Error deleting prompt:', error);
          this.showToast('Failed to delete prompt', 'error');
        }
      }
    );
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
   * Show confirmation modal
   */
  showConfirmModal(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').style.display = 'flex';
    
    this.confirmCallback = onConfirm;
  }

  /**
   * Hide confirmation modal
   */
  hideConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    this.confirmCallback = null;
  }

  /**
   * Handle confirmation OK
   */
  handleConfirmOk() {
    if (this.confirmCallback) {
      this.confirmCallback();
    }
    this.hideConfirmModal();
  }

  /**
   * Handle form submission
   */
  async handleFormSubmit(event) {
    event.preventDefault();
    
    const title = document.getElementById('promptTitle').value.trim();
    const content = document.getElementById('promptContent').value.trim();
    
    if (!title || !content) {
      this.showToast('Please fill in all required fields', 'error');
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
          this.showToast('Prompt updated successfully', 'success');
        }
      } else {
        // Add new prompt
        const response = await chrome.runtime.sendMessage({
          action: 'addPrompt',
          prompt: promptData
        });
        
        if (response.success) {
          this.prompts.push(response.data);
          this.showToast('Prompt added successfully', 'success');
        }
      }
      
      this.filteredPrompts = [...this.prompts];
      this.renderPrompts();
      this.renderTagFilter();
      this.updateStats();
      this.hideModal();
      
    } catch (error) {
      console.error('Error saving prompt:', error);
      this.showToast('Failed to save prompt', 'error');
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
   * Render tag filter dropdown
   */
  renderTagFilter() {
    const tagFilter = document.getElementById('tagFilter');
    const allTags = this.search.extractTags(this.prompts);
    
    tagFilter.innerHTML = '<option value="">All tags</option>' +
      allTags.map(tag => `<option value="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</option>`).join('');
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
   * Update stats display
   */
  updateStats() {
    const count = this.filteredPrompts.length;
    const total = this.prompts.length;
    const statsText = document.getElementById('filterStats').querySelector('.stats-text');
    
    if (count === total) {
      statsText.textContent = `${count} prompt${count !== 1 ? 's' : ''}`;
    } else {
      statsText.textContent = `${count} of ${total} prompts`;
    }
  }

  /**
   * Handle theme change
   */
  async handleThemeChange(event) {
    const theme = event.target.value;
    this.settings.theme = theme;
    await this.saveSettings();
    this.applyTheme(theme);
  }

  /**
   * Handle setting changes
   */
  async handleSettingChange(event) {
    const setting = event.target.id;
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    
    if (event.target.type === 'number') {
      value = parseInt(value);
    }
    
    this.settings[setting] = value;
    await this.saveSettings();
  }

  /**
   * Save settings
   */
  async saveSettings() {
    try {
      await chrome.runtime.sendMessage({
        action: 'saveSettings',
        settings: this.settings
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showToast('Failed to save settings', 'error');
    }
  }

  /**
   * Apply settings to UI
   */
  applySettings() {
    document.getElementById('themeSelect').value = this.settings.theme;
    document.getElementById('showPreviewTooltips').checked = this.settings.showPreviewTooltips;
    document.getElementById('maxSuggestions').value = this.settings.maxSuggestions;
    document.getElementById('enableKeyboardShortcuts').checked = this.settings.enableKeyboardShortcuts;
    
    this.applyTheme(this.settings.theme);
  }

  /**
   * Toggle theme
   */
  async toggleTheme() {
    const newTheme = this.settings.theme === 'dark' ? 'light' : 'dark';
    this.settings.theme = newTheme;
    await this.saveSettings();
    this.applyTheme(newTheme);
    document.getElementById('themeSelect').value = newTheme;
  }

  /**
   * Apply theme
   */
  applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
  }

  /**
   * Handle clear all data
   */
  handleClearAll() {
    this.showConfirmModal(
      'Clear All Data',
      'This will permanently delete all your prompts and settings. This action cannot be undone.',
      async () => {
        try {
          await this.storage.clearAll();
          this.prompts = [];
          this.filteredPrompts = [];
          this.selectedPrompts.clear();
          this.renderPrompts();
          this.renderTagFilter();
          this.updateStats();
          this.showToast('All data cleared successfully', 'success');
        } catch (error) {
          console.error('Error clearing data:', error);
          this.showToast('Failed to clear data', 'error');
        }
      }
    );
  }

  /**
   * Export all prompts
   */
  async exportAll() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'exportData' });
      if (response.success) {
        this.downloadJSON(response.data, `promptvault-export-${new Date().toISOString().split('T')[0]}.json`);
        this.showToast('Library exported successfully', 'success');
      }
    } catch (error) {
      console.error('Error exporting library:', error);
      this.showToast('Failed to export library', 'error');
    }
  }

  /**
   * Export selected prompts
   */
  exportSelected() {
    if (this.selectedPrompts.size === 0) return;
    
    const selectedPromptData = this.prompts.filter(p => this.selectedPrompts.has(p.id));
    const data = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      prompts: selectedPromptData
    };
    
    this.downloadJSON(data, `promptvault-selected-${new Date().toISOString().split('T')[0]}.json`);
    this.showToast(`${this.selectedPrompts.size} prompts exported successfully`, 'success');
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
      
      const importMode = document.querySelector('input[name="importMode"]:checked').value;
      const merge = importMode === 'merge';
      
      const response = await chrome.runtime.sendMessage({
        action: 'importData',
        data: data,
        options: { merge }
      });
      
      if (response.success) {
        await this.loadPrompts();
        this.filteredPrompts = [...this.prompts];
        this.renderPrompts();
        this.renderTagFilter();
        this.updateStats();
        this.showToast('Library imported successfully', 'success');
      }
    } catch (error) {
      console.error('Error importing library:', error);
      this.showToast('Failed to import library. Please check the file format.', 'error');
    }
    
    // Reset file input
    event.target.value = '';
  }

  /**
   * Load sample data
   */
  async loadSampleData() {
    this.showConfirmModal(
      'Load Sample Data',
      'This will add sample prompts to your library. Existing prompts will not be affected.',
      async () => {
        try {
          // The background script already has sample data initialization
          // We can trigger it by clearing and reinitializing
          const sampleData = {
            version: '1.0.0',
            prompts: [
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
              }
            ]
          };
          
          const response = await chrome.runtime.sendMessage({
            action: 'importData',
            data: sampleData,
            options: { merge: true }
          });
          
          if (response.success) {
            await this.loadPrompts();
            this.filteredPrompts = [...this.prompts];
            this.renderPrompts();
            this.renderTagFilter();
            this.updateStats();
            this.showToast('Sample prompts loaded successfully', 'success');
          }
        } catch (error) {
          console.error('Error loading sample data:', error);
          this.showToast('Failed to load sample data', 'error');
        }
      }
    );
  }

  /**
   * Download JSON data
   */
  downloadJSON(data, filename) {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const container = document.getElementById('toastContainer');
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after delay
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
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

// Initialize options page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PromptVaultOptions();
});