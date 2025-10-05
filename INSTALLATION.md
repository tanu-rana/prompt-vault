# PromptVault Installation Guide

## 🚀 Quick Installation (5 minutes)

### Step 1: Download the Extension
1. **Download** or **clone** this repository to your local machine
2. **Extract** the files if downloaded as ZIP
3. **Note the folder location** - you'll need this path

### Step 2: Load in Chrome/Comet
1. **Open Chrome/Comet** browser
2. **Navigate to** `chrome://extensions/`
3. **Enable "Developer mode"** (toggle in top-right corner)
4. **Click "Load unpacked"** button
5. **Select the project folder** containing `manifest.json`
6. **Confirm** the extension appears in your extensions list

### Step 3: Pin to Toolbar
1. **Click the puzzle piece icon** (Extensions) in Chrome toolbar
2. **Find "PromptVault"** in the list
3. **Click the pin icon** to add it to your toolbar
4. **Verify** the PromptVault icon appears in your toolbar

### Step 4: First Launch
1. **Click the PromptVault icon** in your toolbar
2. **Sample prompts** will be automatically loaded
3. **Explore the interface** and try the search functionality
4. **Click the gear icon** to access settings

## ✅ Verification Steps

### Test Basic Functionality
1. **Open the popup** by clicking the toolbar icon
2. **Search for prompts** using the search box
3. **Add a new prompt** using the "Add Prompt" button
4. **Access settings** via the gear icon

### Test Slash Commands
1. **Open ChatGPT** (chat.openai.com) in a new tab
2. **Type `/`** in the chat input field
3. **Verify** that a dropdown with prompts appears
4. **Select a prompt** using arrow keys and Enter
5. **Confirm** the prompt is inserted into the text field

### Test Context Menu
1. **Visit any supported LLM website**
2. **Select some text** on the page
3. **Right-click** and look for "Save as Prompt"
4. **Click it** and verify a notification appears
5. **Check PromptVault** to see the saved prompt

## 🔧 Troubleshooting

### Extension Not Loading
**Problem**: Extension doesn't appear after loading
**Solutions**:
- Ensure you selected the correct folder (containing `manifest.json`)
- Check that Developer mode is enabled
- Try refreshing the extensions page
- Restart Chrome and try again

### Slash Commands Not Working
**Problem**: Typing `/` doesn't show suggestions
**Solutions**:
- **Refresh the webpage** after installing the extension
- **Check permissions** - ensure the extension has access to the site
- **Verify site support** - only works on ChatGPT, Gemini, Claude, etc.
- **Clear browser cache** and reload the page

### Prompts Not Saving
**Problem**: Added prompts disappear
**Solutions**:
- Check Chrome storage permissions
- Ensure you're not in incognito mode (unless extension is enabled for incognito)
- Try clearing extension data and re-adding prompts
- Check browser console for error messages

### UI Issues
**Problem**: Interface looks broken or doesn't respond
**Solutions**:
- **Update Chrome** to the latest version
- **Disable other extensions** temporarily to check for conflicts
- **Reset extension** by removing and re-adding it
- **Check console** for JavaScript errors

## 🌐 Supported Platforms

### Fully Supported LLM Platforms
- ✅ **ChatGPT** (chat.openai.com)
- ✅ **Google Gemini** (gemini.google.com)
- ✅ **Perplexity AI** (perplexity.ai)
- ✅ **Claude** (claude.ai)
- ✅ **Poe** (poe.com)
- ✅ **Microsoft Copilot** (copilot.microsoft.com)

### Browser Compatibility
- ✅ **Google Chrome** (Recommended)
- ✅ **Microsoft Edge** (Chromium-based)
- ✅ **Brave Browser**
- ✅ **Opera** (Chromium-based)
- ⚠️ **Firefox** (Manifest V3 support limited)
- ❌ **Safari** (Not supported)

## ⚙️ Advanced Installation

### Development Setup
If you want to modify the extension:

```bash
# Clone the repository
git clone [REPOSITORY_URL]
cd promptvault

# Install test dependencies
cd tests/
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Custom Configuration
1. **Modify `manifest.json`** to add more supported sites
2. **Edit `background.js`** to change sample data
3. **Customize `styles/`** files for different themes
4. **Update `utils/storage.js`** for different storage options

### Building for Distribution
```bash
# Create distribution package
zip -r promptvault-v1.0.0.zip . \
  -x "tests/*" "*.md" ".git/*" "node_modules/*"
```

## 🔒 Permissions Explained

### Required Permissions
- **storage**: Save your prompts and settings locally
- **activeTab**: Access the current tab to inject slash commands
- **scripting**: Run content scripts on supported websites
- **contextMenus**: Add "Save as Prompt" to right-click menu

### Host Permissions
The extension requests access to specific LLM platforms:
- `https://chat.openai.com/*` - ChatGPT
- `https://gemini.google.com/*` - Google Gemini
- `https://www.perplexity.ai/*` - Perplexity AI
- `https://claude.ai/*` - Claude
- `https://poe.com/*` - Poe
- `https://copilot.microsoft.com/*` - Microsoft Copilot

### Privacy Notes
- **No data collection**: Extension doesn't send data anywhere
- **Local storage only**: All prompts stay on your device
- **No tracking**: Zero analytics or telemetry
- **Open source**: Code is fully auditable

## 🔄 Updates & Maintenance

### Automatic Updates
- Chrome will automatically update the extension when published to Chrome Web Store
- For development versions, you'll need to manually update

### Manual Updates
1. **Download** the latest version
2. **Remove** the old extension from `chrome://extensions/`
3. **Load** the new version using "Load unpacked"
4. **Your data** will be preserved (stored separately)

### Backup Your Data
1. **Open PromptVault options** page
2. **Go to Import/Export** tab
3. **Click "Export All Prompts"**
4. **Save the JSON file** as backup

## 📞 Getting Help

### Common Issues
- Check the [Troubleshooting](#troubleshooting) section above
- Review the [Usage Examples](USAGE_EXAMPLES.md) for guidance
- Read the [Architecture Documentation](ARCHITECTURE.md) for technical details

### Support Channels
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Comprehensive guides and examples
- **Community**: Share prompts and tips with other users

### Before Reporting Issues
1. **Check browser console** for error messages
2. **Try in incognito mode** to rule out extension conflicts
3. **Test on different websites** to isolate the problem
4. **Include specific steps** to reproduce the issue

---

**Installation complete!** 🎉

You're now ready to supercharge your AI interactions with PromptVault. Start by exploring the sample prompts, then create your own library of powerful prompts for maximum productivity.