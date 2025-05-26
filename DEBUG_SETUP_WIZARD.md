# Setup Wizard Debug Guide

## Issue: Setup Wizard not saving configuration

### Quick Debug Steps

1. **Open Browser Console** (F12 or right-click → Inspect → Console)

2. **Check Current State**
   ```javascript
   // Run this in console to see what's stored
   console.log('Current localStorage:', {
     firebaseConfig: localStorage.getItem('firebaseConfig'),
     authorizedEmail: localStorage.getItem('authorizedEmail'),
     encryptedChatGPTApiKey: localStorage.getItem('encryptedChatGPTApiKey'),
     encryptedPerplexityApiKey: localStorage.getItem('encryptedPerplexityApiKey')
   });
   ```

3. **Clear and Restart**
   ```javascript
   // Clear everything
   localStorage.clear();
   // Reload page
   location.reload();
   ```

### When Using the Setup Wizard

1. **Step 2 - Firebase Config Format**
   
   ⚠️ **NEW: Use the "Clean & Format" button** if you're having issues with pasted config!
   
   ✅ **CORRECT** - Paste as JSON (with straight quotes):
   ```json
   {
     "apiKey": "your-firebase-api-key-here",
     "authDomain": "your-project.firebaseapp.com",
     "projectId": "your-project-id",
     "storageBucket": "your-project.firebasestorage.app",
     "messagingSenderId": "your-sender-id",
     "appId": "your-app-id"
   }
   ```

   ❌ **WRONG** - Smart quotes (often from copying from web/documents):
   ```json
   {
     "apiKey": "your-firebase-api-key-here",
     "authDomain": "modernnote-212cb.firebaseapp.com",
     ...
   }
   ```

   ❌ **WRONG** - JavaScript format:
   ```javascript
   const firebaseConfig = {
     apiKey: "...",
     // etc
   };
   ```

2. **Watch Console Output**
   As you progress through the wizard, you should see:
   - "Validating config string: ..."
   - "Parsed config: {object}"
   - "Validation result: true"
   - "Saving configuration..."
   - "Firebase Config: {object}"
   - "Saved to localStorage: {object}"

### Common Issues & Solutions

1. **Smart Quotes Problem**
   - **Symptom**: "SyntaxError: Bad control character in string literal"
   - **Solution**: Click the "Clean & Format" button in Step 2
   - **Cause**: Copying from websites/documents that use typographic quotes

2. **Invalid JSON Format**
   - **Symptom**: "Invalid Firebase configuration"
   - **Solution**: 
     1. Click "Clean & Format" button
     2. Make sure all keys and values are in quotes
     3. Remove any JavaScript syntax

### Debug Buttons

The app now includes debug buttons in the bottom-right corner:
- **Check Config** - Shows if config and email are saved
- **Reset** - Clears all settings and restarts setup

### Manual Fix

If the wizard isn't working, you can manually set the configuration:

```javascript
// Run this in the console with your values
localStorage.setItem('firebaseConfig', JSON.stringify({
  "apiKey": "your-firebase-api-key-here",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project-id",
  "storageBucket": "your-project.firebasestorage.app",
  "messagingSenderId": "your-sender-id",
  "appId": "your-app-id"
}));
localStorage.setItem('authorizedEmail', 'your-email@gmail.com');
localStorage.setItem('encryptedChatGPTApiKey', 'your-encrypted-chatgpt-key');
localStorage.setItem('encryptedPerplexityApiKey', 'your-encrypted-perplexity-key');

// Then reload
location.reload();
``` 