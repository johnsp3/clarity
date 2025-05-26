# Simple Setup Guide for Clarity

## Getting Started

### Step 1: Clear Your Browser
1. Press F12 to open the browser console
2. Copy and paste this command:
   ```
   localStorage.clear()
   ```
3. Press Enter
4. Refresh the page (press F5)

### Step 2: Firebase Configuration
1. Go to your Firebase Console
2. Click on your project
3. Click the gear icon → Project Settings
4. Scroll down to "Your apps" section
5. Find your web app (has </> icon)
6. You'll see a code block that starts with `const firebaseConfig = {`
7. **Copy the ENTIRE block** (including the curly braces { })
8. Paste it into the setup wizard
9. Click the yellow "Fix Format" button
10. Click "Next"

### Step 3: Your Email
1. Type your Gmail address (the one you use to sign in)
2. Click "Next"

### Step 4: Security Rules
1. You can skip this - just click "Next"

### Step 5: ChatGPT Key (Optional)
1. If you have a ChatGPT API key, paste it here
2. If not, just click "Next" - you can add it later

### Step 6: Perplexity Key (Optional)
1. If you have a Perplexity API key, paste it here
2. If not, just click "Next" - you can add it later

### Step 7: Done!
Click "Start Using Clarity"

## If Something Goes Wrong

### The Easy Fix:
1. Press F12 to open console
2. Copy and paste ALL of this:
   ```javascript
   localStorage.clear();
   localStorage.setItem('firebaseConfig', JSON.stringify({
     "apiKey": "your-firebase-api-key-here",
     "authDomain": "your-project.firebaseapp.com",
     "projectId": "your-project-id",
     "storageBucket": "your-project.firebasestorage.app",
     "messagingSenderId": "your-sender-id",
     "appId": "your-app-id"
   }));
        localStorage.setItem('authorizedEmail', 'your-email@gmail.com');
   localStorage.setItem('encryptedChatGPTApiKey', 'dummy-chatgpt-key');
   localStorage.setItem('encryptedPerplexityApiKey', 'dummy-perplexity-key');
   location.reload();
   ```
3. Press Enter
4. The page will reload and should work

## Common Issues

**"Something seems wrong with the configuration"**
- Make sure you copied the ENTIRE Firebase config
- Click the "Fix Format" button
- Try again

**Page shows errors instead of setup wizard**
- Use "The Easy Fix" above
- Or click the red "Reset" button in the bottom right corner

## Need Help?
If you're still having trouble, the configuration you need is already saved in the "Easy Fix" section above. Just copy and paste it into the console. 