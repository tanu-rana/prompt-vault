# PromptVault - Elite Prompt Library Manager

> **Premium Chrome/Comet extension for managing personal prompt libraries with slash-command integration, advanced search, and elite UI design.**

![PromptVault Banner](https://via.placeholder.com/800x200/74B9FF/FFFFFF?text=PromptVault+-+Elite+Prompt+Manager)

## ✨ Features

### 🎯 Core Functionality
- **CRUD Operations**: Create, read, update, and delete prompts with full validation
- **Smart Tagging**: Multi-tag system with bright color-coded categories
- **Advanced Search**: Fuzzy search with debouncing, tag filtering, and smart ranking
- **Import/Export**: JSON-based backup and restore with merge/replace options
- **Individual Downloads**: Export single prompts as JSON files
- **Usage Analytics**: Track prompt usage frequency and recency

### ⚡ Slash Command Integration
- **Universal Compatibility**: Works with ChatGPT, Gemini, Perplexity, Claude, and more
- **Smart Autocomplete**: Type `/` in any LLM chat for instant prompt suggestions
- **Context-Aware**: Intelligent ranking based on usage patterns and relevance
- **Inline Insertion**: Seamless prompt injection without overwriting existing text
- **Keyboard Navigation**: Arrow keys and Enter for quick selection

### 🎨 Elite UI/UX Design
- **Premium Typography**: Montserrat headings + Sora body text for optimal readability
- **Glassmorphism Effects**: Subtle frosted glass aesthetics with backdrop blur
- **Dark/Light Themes**: Context-aware font colors and smooth theme transitions
- **Micro-interactions**: 150-250ms ease-in-out animations for premium feel
- **Responsive Design**: Optimized for all screen sizes with 4px baseline grid

### 🚀 Advanced Features
- **Right-click Context Menu**: Save selected text as prompts directly
- **Keyboard Shortcuts**: Ctrl+Shift+P for quick popup access
- **Drag & Drop Reordering**: Intuitive prompt organization
- **Preview Tooltips**: Hover to see prompt snippets before insertion
- **Duplicate Prevention**: Smart validation prevents overwrites
- **Empty State Handling**: Friendly copy and subtle illustrations

## 🏗️ Architecture

### Manifest V3 Structure
```
promptvault/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for storage & messaging
├── content.js            # Slash command detection & injection
├── popup.html/js/css     # Quick access popup interface
├── options.html/js/css   # Full management interface
├── utils/
│   ├── storage.js        # Storage management utilities
│   └── search.js         # Search and filtering logic
├── styles/
│   ├── popup.css         # Popup styling
│   ├── options.css       # Options page styling
│   └── content.css       # Content script styling
├── tests/                # Unit tests
└── icons/               # Extension icons
```

### Component Responsibilities

#### Background Service Worker (`background.js`)
- **Storage Operations**: Manages all Chrome storage interactions
- **Message Handling**: Routes messages between popup, options, and content scripts
- **Context Menus**: Handles right-click "Save as Prompt" functionality
- **Keyboard Commands**: Processes Ctrl+Shift+P shortcut
- **Sample Data**: Initializes new installations with example prompts

#### Content Script (`content.js`)
- **Slash Detection**: Monitors text inputs for `/` trigger
- **Autocomplete UI**: Creates and manages dropdown suggestions
- **Prompt Injection**: Inserts selected prompts into text fields
- **Site Compatibility**: Works across ChatGPT, Gemini, Claude, etc.
- **Keyboard Navigation**: Handles arrow keys and Enter selection

#### Popup Interface (`popup.html/js`)
- **Quick Access**: Streamlined prompt browsing and search
- **Add/Edit Modal**: Inline prompt creation and editing
- **Tag Management**: Visual tag chips with color coding
- **Usage Stats**: Display prompt usage counts and dates
- **Theme Toggle**: Dark/light mode switching

#### Options Page (`options.html/js`)
- **Full Management**: Complete CRUD operations with advanced UI
- **Bulk Operations**: Multi-select for batch export/delete
- **Advanced Search**: Comprehensive filtering and sorting options
- **Settings Panel**: Theme, behavior, and preference controls
- **Import/Export**: JSON file handling with merge options

## 🚀 Installation & Setup

### Loading as Unpacked Extension

1. **Download/Clone** this repository to your local machine
2. **Open Chrome/Comet** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in top-right corner)
4. **Click "Load unpacked"** and select the project directory
5. **Pin the extension** to your toolbar for easy access

### First-Time Setup

1. **Click the PromptVault icon** in your toolbar
2. **Sample prompts** will be automatically loaded
3. **Open Settings** (gear icon) to customize preferences
4. **Try the slash command** by typing `/` in any supported LLM chat

### Supported Platforms

- ✅ **ChatGPT** (chat.openai.com)
- ✅ **Google Gemini** (gemini.google.com)
- ✅ **Perplexity AI** (perplexity.ai)
- ✅ **Claude** (claude.ai)
- ✅ **Poe** (poe.com)
- ✅ **Microsoft Copilot** (copilot.microsoft.com)

## 📖 Usage Guide

### Basic Operations

#### Adding Prompts
1. Click the **"Add Prompt"** button in popup or options
2. Enter a **descriptive title**
3. Write your **prompt content** (use `[PLACEHOLDER]` for dynamic areas)
4. Add **tags** by typing and pressing Enter
5. Click **"Save Prompt"**

#### Using Slash Commands
1. Open any supported LLM chat interface
2. Type **`/`** in the text input field
3. See **autocomplete suggestions** appear
4. Use **arrow keys** to navigate options
5. Press **Enter** or click to insert prompt

#### Searching Prompts
- **Text Search**: Type in search box to find by title, content, or tags
- **Tag Filtering**: Use dropdown to filter by specific tags
- **Sort Options**: Choose relevance, recent, usage, or alphabetical
- **Quick Filters**: Use "Recent" and "Popular" chips for fast access

### Advanced Features

#### Bulk Operations
1. **Select multiple prompts** using checkboxes in options page
2. **Export selected** prompts as JSON file
3. **Delete multiple** prompts at once (with confirmation)

#### Import/Export
- **Export All**: Download complete library as JSON
- **Import Library**: Upload JSON file with merge/replace options
- **Individual Export**: Download single prompts from options page

#### Context Menu
1. **Select text** on any supported website
2. **Right-click** and choose "Save as Prompt"
3. **Prompt is automatically created** with suggested tags
4. **Edit in PromptVault** to refine title and content

## ⚙️ Configuration

### Theme Settings
- **Dark Mode**: Default theme with black backgrounds and light text
- **Light Mode**: Clean white theme with dark text
- **Auto-switching**: Respects system preferences

### Behavior Settings
- **Preview Tooltips**: Show/hide prompt previews on hover
- **Max Suggestions**: Control dropdown size (3-20 items)
- **Keyboard Shortcuts**: Enable/disable Ctrl+Shift+P

### Tag Colors
Customize tag colors in settings or use the default bright palette:
- 🔴 **Red** (#FF6B6B) - Work, urgent
- 🟢 **Teal** (#4ECDC4) - Personal, creative
- 🔵 **Blue** (#45B7D1) - Technical, development
- 🟡 **Yellow** (#FFEAA7) - Marketing, communication
- 🟣 **Purple** (#DDA0DD) - Research, analysis

## 🧪 Development & Testing

### Running Tests
```bash
cd tests/
npm install
npm test                # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

### Code Quality
- **ESLint**: Enforces consistent code style
- **Prettier**: Automatic code formatting
- **Jest**: Unit testing framework
- **Coverage**: Comprehensive test coverage for core features

### Architecture Decisions

#### Storage Strategy
- **Chrome Storage API**: Reliable, synced across devices
- **JSON Serialization**: Human-readable export format
- **Validation Layer**: Prevents data corruption
- **Migration Support**: Future-proof data structure

#### Search Implementation
- **Fuzzy Matching**: Levenshtein-distance algorithm
- **Debounced Input**: 150ms delay prevents excessive searches
- **Weighted Scoring**: Title > Tags > Content priority
- **Usage Analytics**: Boost frequently-used prompts

#### UI Framework
- **Vanilla JavaScript**: No dependencies, fast loading
- **CSS Variables**: Theme-aware color system
- **Flexbox/Grid**: Modern, responsive layouts
- **Web Fonts**: Google Fonts for premium typography

## 🔒 Security & Privacy

### Data Handling
- **Local Storage Only**: All data stays on your device
- **No Telemetry**: Zero tracking or analytics
- **Secure Contexts**: HTTPS-only operation
- **Input Sanitization**: XSS prevention throughout

### Permissions
- **Storage**: Save prompts and settings locally
- **ActiveTab**: Access current tab for slash commands
- **Scripting**: Inject content scripts for functionality
- **ContextMenus**: Right-click "Save as Prompt" feature

## 🚀 Future Roadmap

### Planned Features
- **Cloud Sync**: Optional backup to Google Drive/Dropbox
- **Team Sharing**: Collaborative prompt libraries
- **AI Suggestions**: Smart prompt recommendations
- **Custom Shortcuts**: User-defined keyboard shortcuts
- **Prompt Templates**: Pre-built prompt structures
- **Analytics Dashboard**: Usage insights and trends

### Browser Support
- **Chrome**: Full support (current)
- **Edge**: Chromium-based compatibility
- **Firefox**: Manifest V3 adaptation planned
- **Safari**: WebExtensions support evaluation

## 🤝 Contributing

### Development Setup
1. **Fork** the repository
2. **Clone** your fork locally
3. **Create feature branch**: `git checkout -b feature/amazing-feature`
4. **Make changes** and add tests
5. **Run tests**: `npm test`
6. **Commit changes**: `git commit -m 'Add amazing feature'`
7. **Push branch**: `git push origin feature/amazing-feature`
8. **Open Pull Request**

### Code Standards
- **ES6+ JavaScript**: Modern syntax and features
- **Semantic HTML**: Accessible markup
- **BEM CSS**: Block-Element-Modifier methodology
- **JSDoc Comments**: Comprehensive documentation
- **Test Coverage**: Minimum 80% coverage for new features

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Fonts**: Montserrat and Sora typography
- **Heroicons**: Beautiful SVG icons
- **Chrome Extensions**: Comprehensive API documentation
- **Jest**: Excellent testing framework
- **Community**: Feedback and feature suggestions

## 📞 Support

### Getting Help
- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Comprehensive guides and examples
- **Community**: Share prompts and tips

### Troubleshooting

#### Slash Commands Not Working
1. **Refresh the page** after installing extension
2. **Check permissions** in chrome://extensions/
3. **Verify site compatibility** (supported platforms only)
4. **Clear browser cache** and reload

#### Prompts Not Saving
1. **Check storage permissions**
2. **Verify JSON format** for imports
3. **Clear extension data** and restart
4. **Check browser console** for error messages

#### UI Issues
1. **Update browser** to latest version
2. **Disable conflicting extensions**
3. **Reset theme settings** to default
4. **Clear extension cache**

---

**Built with ❤️ for the AI community**

*PromptVault - Where your best prompts live and thrive*