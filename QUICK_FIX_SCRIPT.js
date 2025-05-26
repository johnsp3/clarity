// Quick Fix Script for Clarity Setup
// Copy and paste this entire script into your browser console

// Your Firebase configuration
const firebaseConfig = {
  "apiKey": "your-firebase-api-key-here",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project-id",
  "storageBucket": "your-project.firebasestorage.app",
  "messagingSenderId": "your-sender-id",
  "appId": "your-app-id"
};

// Your authorized email
const authorizedEmail = "your-email@gmail.com";

// Clear existing config
localStorage.clear();

// Set the configuration
localStorage.setItem('firebaseConfig', JSON.stringify(firebaseConfig));
localStorage.setItem('authorizedEmail', authorizedEmail);

// For now, set dummy encrypted API keys (you'll need to add your real ones later)
localStorage.setItem('encryptedChatGPTApiKey', 'dummy-chatgpt-key-replace-me');
localStorage.setItem('encryptedPerplexityApiKey', 'dummy-perplexity-key-replace-me');

console.log('✅ Configuration saved successfully!');
console.log('📝 Configuration details:');
console.log('- Firebase Config:', firebaseConfig);
console.log('- Authorized Email:', authorizedEmail);
console.log('');
console.log('🔄 Reloading page in 2 seconds...');
console.log('');
console.log('⚠️  Note: You\'ll need to add your ChatGPT and Perplexity API keys through the app settings later.');

// Reload after 2 seconds
setTimeout(() => {
  window.location.reload();
}, 2000); 