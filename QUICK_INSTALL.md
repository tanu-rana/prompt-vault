# 🚀 PromptVault - Quick Installation Guide

## ✅ Problem Fixed!
The missing icon error has been resolved. All required icon files are now included.

## 📥 Installation Steps

### Method 1: Direct from GitHub (Recommended)
1. **Download the extension:**
   ```bash
   git clone https://github.com/tanu-rana/prompt-vault.git
   cd prompt-vault
   ```

2. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `prompt-vault` folder
   - ✅ Extension should load successfully!

### Method 2: Download ZIP
1. Go to https://github.com/tanu-rana/prompt-vault
2. Click "Code" → "Download ZIP"
3. Extract the ZIP file
4. Follow steps 2 from Method 1

## 🎯 Quick Test
After installation:
1. **Check Extension**: You should see the blue PromptVault icon in your toolbar
2. **Test Popup**: Click the icon to open the prompt library
3. **Test Slash Commands**: Go to ChatGPT and type `/` to see suggestions
4. **Add First Prompt**: Click "Add Prompt" to create your first entry

## 🔧 Troubleshooting

### If you still get errors:
1. **Refresh Extensions Page**: Go to `chrome://extensions/` and refresh
2. **Check File Permissions**: Make sure all files are readable
3. **Verify All Files**: Ensure these key files exist:
   - `manifest.json`
   - `background.js`
   - `content.js`
   - `popup.html`
   - `icons/icon16.png` (and other icon sizes)

### Common Issues:
- **"Could not load manifest"**: Make sure you selected the root folder containing `manifest.json`
- **Icons not showing**: The icons are now included, but clear browser cache if needed
- **Slash commands not working**: Make sure you're on a supported site (ChatGPT, Gemini, etc.)

## 🎉 You're Ready!
Once installed, PromptVault will appear in your Chrome toolbar with a blue icon. Click it to start managing your prompt library!

## 📚 Next Steps
- Read the [complete documentation](README.md)
- Check out [usage examples](USAGE_EXAMPLES.md)
- Explore the [architecture guide](ARCHITECTURE.md)