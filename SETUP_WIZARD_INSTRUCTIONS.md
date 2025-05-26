# Clarity Setup Wizard Instructions

The setup wizard has been successfully added to your Clarity app! Here's how to use it:

## First Time Setup

When you run the app for the first time (or after clearing localStorage), you'll see the setup wizard:

### Step 1 - Welcome
Just click "Next" to proceed.

### Step 2 - Firebase Configuration
Copy and paste your Firebase configuration exactly as shown below:

```json
{
  "apiKey": "your-firebase-api-key-here",
  "authDomain": "modernnote-212cb.firebaseapp.com",
  "projectId": "modernnote-212cb",
  "storageBucket": "modernnote-212cb.firebasestorage.app",
  "messagingSenderId": "856354180131",
  "appId": "1:856354180131:web:c6c499f2e31dafe46cb596"
}
```

### Step 3 - Email Authorization
Enter your authorized email:
```
jchezik@gmail.com
```

### Step 4 - Security Rules
You can skip this step since you already have Firebase rules configured. Just click "Next".

### Step 5 - ChatGPT API Key
Enter your ChatGPT API key (starts with `sk-...`)

### Step 6 - Perplexity API Key
Enter your Perplexity API key (starts with `pplx-...`)

### Step 7 - Complete
Click "Start Using Clarity" to finish setup and reload the app.

## Reconfiguring the App

To reconfigure the app with a different Firebase project or settings:

1. Open your browser's Developer Tools (F12)
2. Go to the Application/Storage tab
3. Clear localStorage
4. Refresh the page
5. The setup wizard will appear again

## Adding a Reconfigure Button (Optional)

If you want to add a "Reconfigure" button to your settings component, add this code:

```typescript
const handleReconfigure = () => {
  if (confirm('Are you sure you want to reconfigure the app? This will clear all settings.')) {
    localStorage.clear();
    window.location.reload();
  }
};

// In your JSX:
<button onClick={handleReconfigure}>
  Reconfigure App
</button>
```

## Security Notes

- Your Firebase config is stored in localStorage
- Your email is stored in localStorage
- Your ChatGPT and Perplexity API keys are encrypted before storage
- All data stays in your browser and is never sent to external servers

## Troubleshooting

If you encounter issues:

1. Make sure Firebase is properly configured with Authentication, Firestore, and Storage enabled
2. Ensure Google Sign-In is enabled in Firebase Authentication
3. Check that your email matches the Google account you're using to sign in
4. Verify your ChatGPT and Perplexity API keys are valid 