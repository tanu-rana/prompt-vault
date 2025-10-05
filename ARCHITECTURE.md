# PromptVault Architecture Documentation

## System Overview

PromptVault is a Chrome Manifest V3 extension built with a modular architecture that separates concerns across multiple components. The system follows modern web development practices with a focus on performance, security, and maintainability.

```
┌─────────────────────────────────────────────────────────────┐
│                    PromptVault Extension                    │
├─────────────────────────────────────────────────────────────┤
│  Background Service Worker (background.js)                 │
│  ├─ Storage Management                                      │
│  ├─ Message Routing                                         │
│  ├─ Context Menus                                          │
│  └─ Keyboard Commands                                       │
├─────────────────────────────────────────────────────────────┤
│  Content Scripts (content.js)                              │
│  ├─ Slash Command Detection                                 │
│  ├─ Autocomplete UI                                         │
│  ├─ Prompt Injection                                        │
│  └─ Site Compatibility                                      │
├─────────────────────────────────────────────────────────────┤
│  User Interfaces                                           │
│  ├─ Popup (popup.html/js/css)                             │
│  │  ├─ Quick Access                                        │
│  │  ├─ Search & Filter                                     │
│  │  └─ Add/Edit Modal                                      │
│  └─ Options (options.html/js/css)                         │
│     ├─ Full Management                                     │
│     ├─ Advanced Search                                     │
│     ├─ Settings Panel                                      │
│     └─ Import/Export                                       │
├─────────────────────────────────────────────────────────────┤
│  Utility Modules                                           │
│  ├─ StorageManager (utils/storage.js)                     │
│  │  ├─ CRUD Operations                                     │
│  │  ├─ Data Validation                                     │
│  │  └─ Import/Export                                       │
│  └─ SearchManager (utils/search.js)                       │
│     ├─ Fuzzy Search                                        │
│     ├─ Tag Filtering                                       │
│     └─ Smart Ranking                                       │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Background Service Worker (`background.js`)

**Purpose**: Central coordinator for all extension operations
**Lifecycle**: Persistent service worker that handles events

#### Responsibilities:
- **Storage Operations**: All Chrome storage API interactions
- **Message Routing**: Communication hub between components
- **Context Menus**: Right-click "Save as Prompt" functionality
- **Keyboard Commands**: Global shortcut handling (Ctrl+Shift+P)
- **Installation**: Sample data initialization for new users

#### Key Methods:
```javascript
class BackgroundService {
  handleMessage(request, sender, sendResponse)  // Message routing
  handleInstall(details)                       // Installation setup
  handleCommand(command)                       // Keyboard shortcuts
  handleContextMenu(info, tab)                 // Right-click actions
  setupContextMenus()                          // Menu initialization
}
```

#### Message API:
```javascript
// Supported message types
{
  action: 'getPrompts' | 'addPrompt' | 'updatePrompt' | 'deletePrompt' |
          'recordUsage' | 'getSettings' | 'saveSettings' | 
          'exportData' | 'importData' | 'saveFromSelection'
}
```

### 2. Content Script (`content.js`)

**Purpose**: Slash command detection and prompt injection in web pages
**Injection**: Runs on supported LLM platforms (ChatGPT, Gemini, etc.)

#### Responsibilities:
- **Input Monitoring**: Detect `/` trigger in text fields
- **Autocomplete UI**: Create and manage suggestion dropdown
- **Prompt Injection**: Insert selected prompts into text inputs
- **Keyboard Navigation**: Handle arrow keys and Enter selection
- **Site Compatibility**: Work across different LLM platforms

#### Key Methods:
```javascript
class PromptVaultContent {
  detectSlashCommand(text, cursorPos)          // Find `/query` patterns
  showDropdown(query, targetElement)          // Display suggestions
  filterPrompts(query)                        // Search and rank prompts
  insertPrompt(prompt)                        // Inject into text field
  handleKeydown(event)                        // Navigation controls
}
```

#### Supported Input Types:
- Standard `<textarea>` and `<input>` elements
- `contentEditable` elements
- Platform-specific selectors for ChatGPT, Gemini, Claude, etc.

### 3. User Interfaces

#### Popup Interface (`popup.html/js/css`)

**Purpose**: Quick access to prompt library
**Dimensions**: 400x600px optimized for toolbar popup

**Features**:
- Instant search with debounced input
- Quick filters (All, Recent, Popular)
- Add/Edit prompt modal
- Copy to clipboard functionality
- Theme toggle and settings access

**State Management**:
```javascript
class PromptVaultPopup {
  prompts: Array<Prompt>           // Current prompt list
  filteredPrompts: Array<Prompt>   // Search results
  currentFilter: string            // Active filter
  editingPrompt: Prompt | null     // Modal state
  currentTags: Array<string>       // Tag input state
}
```

#### Options Page (`options.html/js/css`)

**Purpose**: Full-featured library management
**Layout**: Responsive grid with tabbed navigation

**Tabs**:
1. **Library**: Grid view with advanced search and bulk operations
2. **Settings**: Theme, behavior, and preference controls
3. **Import/Export**: JSON file handling and sample data

**Advanced Features**:
- Multi-select with checkboxes
- Drag & drop reordering (planned)
- Individual prompt downloads
- Bulk export/delete operations
- Tag-based filtering

### 4. Utility Modules

#### StorageManager (`utils/storage.js`)

**Purpose**: Abstraction layer for Chrome storage operations
**Pattern**: Singleton with async/await API

**Data Structure**:
```javascript
// Prompt object schema
{
  id: string,              // Unique identifier
  title: string,           // Display name
  content: string,         // Prompt text
  tags: Array<string>,     // Category tags
  createdAt: string,       // ISO timestamp
  updatedAt: string,       // ISO timestamp
  usageCount: number,      // Usage frequency
  lastUsed: string | null  // Last usage timestamp
}

// Settings object schema
{
  theme: 'dark' | 'light',
  showPreviewTooltips: boolean,
  maxSuggestions: number,
  enableKeyboardShortcuts: boolean,
  tagColors: Record<string, string>
}
```

**Key Methods**:
```javascript
class StorageManager {
  async getPrompts(): Promise<Prompt[]>
  async addPrompt(prompt: PromptData): Promise<Prompt>
  async updatePrompt(id: string, updates: Partial<Prompt>): Promise<Prompt>
  async deletePrompt(id: string): Promise<boolean>
  async recordUsage(id: string): Promise<void>
  async exportData(): Promise<ExportData>
  async importData(data: ExportData, options: ImportOptions): Promise<boolean>
}
```

#### SearchManager (`utils/search.js`)

**Purpose**: Advanced search and filtering capabilities
**Algorithm**: Fuzzy matching with weighted scoring

**Search Features**:
- **Fuzzy Matching**: Levenshtein-distance based scoring
- **Multi-field Search**: Title, content, and tags
- **Weighted Scoring**: Title > Tags > Content priority
- **Smart Ranking**: Usage frequency and recency boost
- **Debounced Input**: 150ms delay for performance

**Key Methods**:
```javascript
class SearchManager {
  async searchPrompts(prompts, query, options): Promise<Prompt[]>
  getSuggestions(prompts, options): Promise<Prompt[]>
  extractTags(prompts): string[]
  getTagSuggestions(prompts, partialTag): string[]
  _calculateFuzzyScore(query, text): number
  _calculateSuggestionScore(prompt, context): number
}
```

## Data Flow

### 1. Prompt Creation Flow
```
User Input (Popup/Options) 
  → Form Validation 
  → Background Message 
  → StorageManager.addPrompt() 
  → Chrome Storage API 
  → Success Response 
  → UI Update
```

### 2. Slash Command Flow
```
User Types "/" 
  → Content Script Detection 
  → Background Message (getPrompts) 
  → SearchManager.filterPrompts() 
  → Dropdown Display 
  → User Selection 
  → Prompt Injection 
  → Usage Recording
```

### 3. Search Flow
```
User Input (Search Box) 
  → Debounced Handler 
  → SearchManager.searchPrompts() 
  → Fuzzy Scoring 
  → Result Ranking 
  → UI Rendering 
  → Filter Application
```

## Security Architecture

### Data Protection
- **Local Storage Only**: All data remains on user's device
- **Input Sanitization**: XSS prevention throughout
- **Secure Contexts**: HTTPS-only operation
- **Permission Minimization**: Only required permissions requested

### Content Security Policy
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### Permissions Justification
- **storage**: Save prompts and settings locally
- **activeTab**: Access current tab for slash commands
- **scripting**: Inject content scripts for functionality
- **contextMenus**: Right-click "Save as Prompt" feature

## Performance Optimizations

### 1. Search Performance
- **Debounced Input**: Prevents excessive search operations
- **Result Caching**: Cache search results for repeated queries
- **Lazy Loading**: Load prompts on demand in large libraries
- **Fuzzy Score Caching**: Cache expensive calculations

### 2. UI Performance
- **Virtual Scrolling**: Handle large prompt lists efficiently
- **CSS Transitions**: Hardware-accelerated animations
- **Event Delegation**: Efficient event handling for dynamic content
- **Throttled Resize**: Optimize responsive layout updates

### 3. Memory Management
- **Weak References**: Prevent memory leaks in event handlers
- **Cleanup Handlers**: Remove listeners on component destruction
- **Efficient DOM Updates**: Minimize reflows and repaints
- **Image Optimization**: Lazy load and compress assets

## Extensibility Design

### 1. Plugin Architecture (Future)
```javascript
// Plugin interface for future extensions
interface PromptVaultPlugin {
  name: string;
  version: string;
  init(api: PromptVaultAPI): void;
  destroy(): void;
}
```

### 2. Custom Parsers
```javascript
// Extensible slash command parsing
class SlashCommandParser {
  addSyntax(pattern: RegExp, handler: Function): void
  removeSyntax(pattern: RegExp): void
  parse(text: string): ParseResult[]
}
```

### 3. Storage Adapters
```javascript
// Future cloud storage support
interface StorageAdapter {
  get(key: string): Promise<any>
  set(key: string, value: any): Promise<void>
  delete(key: string): Promise<void>
  sync(): Promise<void>
}
```

## Testing Strategy

### Unit Tests
- **StorageManager**: CRUD operations, validation, import/export
- **SearchManager**: Fuzzy search, filtering, ranking algorithms
- **Utility Functions**: Helper methods and data transformations

### Integration Tests
- **Message Passing**: Background ↔ Content ↔ Popup communication
- **Storage Operations**: End-to-end data persistence
- **UI Interactions**: Form submission, search, filtering

### E2E Tests (Planned)
- **Slash Command Flow**: Complete user journey
- **Import/Export**: File handling and data integrity
- **Cross-browser Compatibility**: Chrome, Edge, Firefox

## Deployment Architecture

### Development Environment
```bash
# Local development setup
npm install          # Install test dependencies
npm test            # Run unit tests
npm run test:watch  # Watch mode for development
```

### Production Build
```bash
# Extension packaging
zip -r promptvault.zip . -x "tests/*" "*.md" ".git/*"
```

### Distribution Channels
- **Chrome Web Store**: Primary distribution
- **GitHub Releases**: Open source distribution
- **Enterprise**: Custom packaging for organizations

## Monitoring & Analytics

### Error Tracking
```javascript
// Error reporting (privacy-preserving)
class ErrorReporter {
  reportError(error: Error, context: string): void
  reportPerformance(metric: string, value: number): void
}
```

### Usage Metrics (Local Only)
- Prompt usage frequency
- Search query patterns
- Feature adoption rates
- Performance benchmarks

## Future Architecture Considerations

### 1. Cloud Sync
- **Conflict Resolution**: Handle simultaneous edits
- **Encryption**: End-to-end encryption for cloud storage
- **Offline Support**: Graceful degradation without connectivity

### 2. Collaboration Features
- **Shared Libraries**: Team prompt collections
- **Version Control**: Track prompt changes over time
- **Access Control**: Permission-based sharing

### 3. AI Integration
- **Smart Suggestions**: AI-powered prompt recommendations
- **Auto-tagging**: Automatic tag generation
- **Content Analysis**: Prompt effectiveness scoring

### 4. Cross-Platform Support
- **Browser Extensions**: Firefox, Safari, Edge
- **Desktop Apps**: Electron-based standalone app
- **Mobile Apps**: React Native or native implementations

---

This architecture provides a solid foundation for current functionality while maintaining flexibility for future enhancements and scaling requirements.