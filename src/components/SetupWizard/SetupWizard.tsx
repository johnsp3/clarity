import React, { useState } from 'react';
import { CheckCircle, Copy, AlertCircle, ArrowRight, ArrowLeft, Shield, Database, Key, Mail, Loader2, XCircle } from 'lucide-react';
import { encryptData } from '../../services/encryption';
import { validateConfiguration } from '../../services/validation';

interface SetupWizardProps {
  onComplete: () => void;
}

interface Errors {
  firebase?: string;
  email?: string;
  chatgptApiKey?: string;
  perplexityApiKey?: string;
}

interface CopiedState {
  firestore: boolean;
  storage: boolean;
}

interface ValidationState {
  isValidating: boolean;
  firebase: {
    tested: boolean;
    success: boolean;
    message: string;
    details?: string;
  };
  chatgpt: {
    tested: boolean;
    success: boolean;
    message: string;
    details?: string;
  };
  perplexity: {
    tested: boolean;
    success: boolean;
    message: string;
    details?: string;
  };
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [firebaseConfig, setFirebaseConfig] = useState('');
  const [email, setEmail] = useState('');
  const [chatgptApiKey, setChatgptApiKey] = useState('');
  const [perplexityApiKey, setPerplexityApiKey] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [copied, setCopied] = useState<CopiedState>({ firestore: false, storage: false });
  const [validation, setValidation] = useState<ValidationState>({
    isValidating: false,
    firebase: { tested: false, success: false, message: '', details: '' },
    chatgpt: { tested: false, success: false, message: '', details: '' },
    perplexity: { tested: false, success: false, message: '', details: '' }
  });

  const detectSmartQuotes = (text: string): boolean => {
    return /[\u201C\u201D\u2018\u2019]/.test(text);
  };

  const steps = [
    { title: 'Welcome', icon: Shield },
    { title: 'Firebase Setup', icon: Database },
    { title: 'Email Authorization', icon: Mail },
    { title: 'Security Rules', icon: Shield },
    { title: 'ChatGPT API', icon: Key },
    { title: 'Perplexity API', icon: Key },
    { title: 'Validation', icon: CheckCircle },
    { title: 'Complete', icon: CheckCircle }
  ];

  const cleanFirebaseConfig = (configStr: string): string => {
    let cleaned = configStr;
    
    // First, check if this looks like the full Firebase setup code
    if (cleaned.includes('import') && cleaned.includes('initializeApp')) {
      // Extract just the config object using a more robust regex
      const configMatch = cleaned.match(/const\s+firebaseConfig\s*=\s*(\{[^}]+\})/s);
      if (configMatch) {
        cleaned = configMatch[1];
      }
    }
    
    // If we still have variable assignment, remove it
    cleaned = cleaned
      .replace(/^\s*const\s+\w+\s*=\s*/, '') // Remove "const firebaseConfig = "
      .replace(/^\s*var\s+\w+\s*=\s*/, '')   // Remove "var firebaseConfig = "
      .replace(/^\s*let\s+\w+\s*=\s*/, '')   // Remove "let firebaseConfig = "
      .replace(/;\s*$/, '')                   // Remove trailing semicolon
      .trim();
    
    // Replace smart quotes and other common copy-paste issues
    cleaned = cleaned
      .replace(/[\u201C\u201D]/g, '"')  // Replace smart double quotes
      .replace(/[\u2018\u2019]/g, "'")  // Replace smart single quotes
      .replace(/[\u2013\u2014]/g, '-')  // Replace en-dash and em-dash
      .replace(/\u00A0/g, ' ')          // Replace non-breaking spaces
      .trim();
    
    // Remove any comments
    cleaned = cleaned.replace(/\/\/.*$/gm, ''); // Remove single-line comments
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    
    // Try to parse as a JavaScript object and convert to JSON
    try {
      // Use a more sophisticated approach to convert JS object to JSON
      // This evaluates the object in a safe way
      const jsObjectToJson = (str: string) => {
        // Add quotes to unquoted keys
        let jsonStr = str.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
        
        // Handle trailing commas
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
        
        // Normalize whitespace
        jsonStr = jsonStr.replace(/\s+/g, ' ').trim();
        
        return jsonStr;
      };
      
      const jsonStr = jsObjectToJson(cleaned);
      // Try to parse to validate it's proper JSON
      const parsed = JSON.parse(jsonStr);
      
      // Return formatted JSON
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      console.error('Failed to convert to JSON:', error);
      // If conversion fails, return the cleaned string as-is
      return cleaned;
    }
  };

  const validateFirebaseConfig = (configStr: string): boolean => {
    try {
      // Clean the config string first
      const cleanedConfig = cleanFirebaseConfig(configStr);
      console.log('Validating config string:', cleanedConfig);
      
      // If the cleaned config is empty or just whitespace, it's invalid
      if (!cleanedConfig.trim()) {
        console.log('Config is empty after cleaning');
        return false;
      }
      
      // Try to parse the config
      let config;
      try {
        config = JSON.parse(cleanedConfig);
      } catch (parseError) {
        console.error('Failed to parse config as JSON:', parseError);
        // Try one more time with a more aggressive cleaning
        const aggressivelyCleaned = cleanedConfig
          .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
          .replace(/,(\s*[}\]])/g, '$1');
        try {
          config = JSON.parse(aggressivelyCleaned);
        } catch {
          return false;
        }
      }
      
      console.log('Parsed config:', config);
      
      // Check if it's an object
      if (typeof config !== 'object' || config === null) {
        console.log('Config is not an object');
        return false;
      }
      
      // Check for required fields
      const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
      const missingFields = required.filter(key => !(key in config) || !config[key]);
      
      if (missingFields.length > 0) {
        console.log('Missing required fields:', missingFields);
        return false;
      }
      
      console.log('Validation successful!');
      return true;
    } catch (error) {
      console.error('Config validation error:', error);
      return false;
    }
  };

  const handleNext = async () => {
    const newErrors: Errors = {};
    
    if (currentStep === 1) {
      if (!firebaseConfig.trim()) {
        newErrors.firebase = 'Please paste your Firebase configuration code from the Firebase Console.';
      } else if (!validateFirebaseConfig(firebaseConfig)) {
        newErrors.firebase = 'Invalid Firebase configuration. Please make sure you copied the entire code block from Firebase Console, including the "const firebaseConfig = {...}" part. Click "Extract Config" to fix formatting issues.';
      }
    }
    if (currentStep === 2 && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (currentStep === 4 && !chatgptApiKey.trim()) {
      newErrors.chatgptApiKey = 'Please enter your ChatGPT API key.';
    }
    if (currentStep === 5 && !perplexityApiKey.trim()) {
      newErrors.perplexityApiKey = 'Please enter your Perplexity API key.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    // When moving to validation step, run the validation
    if (currentStep === 5) {
      setCurrentStep(currentStep + 1);
      // Start validation after moving to the step
      setTimeout(() => runValidation(), 100);
    } else if (currentStep === 7) {
      saveConfiguration();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const runValidation = async () => {
    setValidation(prev => ({ ...prev, isValidating: true }));
    
    try {
      const results = await validateConfiguration(
        cleanFirebaseConfig(firebaseConfig),
        chatgptApiKey,
        perplexityApiKey
      );
      
      setValidation({
        isValidating: false,
        firebase: {
          tested: true,
          success: results.firebase.success,
          message: results.firebase.message,
          details: results.firebase.details
        },
        chatgpt: {
          tested: true,
          success: results.chatgpt.success,
          message: results.chatgpt.message,
          details: results.chatgpt.details
        },
        perplexity: {
          tested: true,
          success: results.perplexity.success,
          message: results.perplexity.message,
          details: results.perplexity.details
        }
      });
    } catch (error) {
      console.error('Validation error:', error);
      setValidation({
        isValidating: false,
        firebase: {
          tested: true,
          success: false,
          message: 'Validation failed',
          details: 'An unexpected error occurred during validation.'
        },
        chatgpt: {
          tested: true,
          success: false,
          message: 'Validation failed',
          details: 'An unexpected error occurred during validation.'
        },
        perplexity: {
          tested: true,
          success: false,
          message: 'Validation failed',
          details: 'An unexpected error occurred during validation.'
        }
      });
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const saveConfiguration = () => {
    console.log('Saving configuration...');
    
    try {
      // Clean the config before parsing
      const cleanedConfig = cleanFirebaseConfig(firebaseConfig);
      const config = JSON.parse(cleanedConfig);
      console.log('Firebase Config:', config);
      
      localStorage.setItem('firebaseConfig', JSON.stringify(config));
      localStorage.setItem('authorizedEmail', email);
      localStorage.setItem('encryptedChatGPTApiKey', encryptData(chatgptApiKey));
      localStorage.setItem('encryptedPerplexityApiKey', encryptData(perplexityApiKey));
      
      console.log('Saved to localStorage:', {
        firebaseConfig: localStorage.getItem('firebaseConfig'),
        authorizedEmail: localStorage.getItem('authorizedEmail'),
        encryptedChatGPTApiKey: localStorage.getItem('encryptedChatGPTApiKey'),
        encryptedPerplexityApiKey: localStorage.getItem('encryptedPerplexityApiKey')
      });
      
      onComplete();
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error saving configuration. Please check the console for details.');
    }
  };

  const copyToClipboard = (text: string, type: 'firestore' | 'storage') => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });
    setTimeout(() => setCopied({ ...copied, [type]: false }), 2000);
  };

  const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.token.email == '${email}';
    }
  }
}`;

  const storageRules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.token.email == '${email}';
    }
  }
}`;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-12 h-12 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-bold">Welcome to Clarity</h2>
            <p className="text-gray-400 max-w-md mx-auto text-lg">
              Let's set up your personal voice note-taking app. 
              This simple wizard will guide you through each step.
            </p>
            <div className="bg-gray-800 p-4 rounded-lg text-left max-w-md mx-auto">
              <h3 className="font-semibold mb-2 text-lg">What you'll need:</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Your Firebase configuration (we'll show you where to find it)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Your email address</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Your ChatGPT API key (optional - you can add it later)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">4.</span>
                  <span>Your Perplexity API key (optional - you can add it later)</span>
                </li>
              </ul>
            </div>
            <p className="text-sm text-gray-500">
              Don't worry if this seems technical - we'll walk you through everything!
            </p>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Firebase Configuration</h2>
            <p className="text-gray-400">
              Copy your entire Firebase configuration code from the Firebase Console and paste it below. 
              You can paste everything - including the imports and initialization code!
            </p>
            <div className="bg-blue-900/30 p-3 rounded-lg mb-2">
              <p className="text-sm text-blue-400">
                <strong>How to find this:</strong> Firebase Console → Project Settings → Your apps → SDK setup and configuration → Copy the entire code block
              </p>
            </div>
            <div className="bg-green-900/30 p-3 rounded-lg mb-2">
              <p className="text-sm text-green-400">
                <strong>Tip:</strong> You can paste the ENTIRE code snippet from Firebase - including imports and initialization. We'll extract just what we need!
              </p>
            </div>
            <div className="relative">
              <textarea
                value={firebaseConfig}
                onChange={(e) => setFirebaseConfig(e.target.value)}
                onPaste={(e) => {
                  // Auto-clean on paste
                  setTimeout(() => {
                    const target = e.target as HTMLTextAreaElement;
                    const pastedText = target.value;
                    console.log('Pasted text:', pastedText);
                    
                    // Try to clean and format the config
                    const cleaned = cleanFirebaseConfig(pastedText);
                    console.log('Cleaned config:', cleaned);
                    
                    // Set the cleaned/formatted config
                    setFirebaseConfig(cleaned);
                    
                    // Clear any existing errors since we're processing new input
                    setErrors({});
                    
                    // Validate the config to provide immediate feedback
                    if (validateFirebaseConfig(cleaned)) {
                      console.log('Config is valid!');
                      // If valid, we already have it formatted from cleanFirebaseConfig
                    } else {
                      console.log('Config validation failed, keeping original for user to see');
                      // Keep the original so user can see what might be wrong
                      setFirebaseConfig(pastedText);
                    }
                  }, 100);
                }}
                placeholder={`Paste your Firebase code here. You can paste the ENTIRE code block from Firebase, like:

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);`}
                className="w-full h-80 bg-gray-800 text-gray-300 p-4 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <button
                onClick={() => {
                  console.log('Extract Config clicked');
                  console.log('Current config:', firebaseConfig);
                  
                  const cleaned = cleanFirebaseConfig(firebaseConfig);
                  console.log('Cleaned config:', cleaned);
                  
                  if (cleaned && cleaned.trim()) {
                    setFirebaseConfig(cleaned);
                    
                    // Validate and provide feedback
                    if (validateFirebaseConfig(cleaned)) {
                      setErrors({});
                      // Show success message temporarily
                      const btn = document.querySelector('[data-extract-btn]') as HTMLButtonElement;
                      if (btn) {
                        const originalText = btn.textContent;
                        btn.textContent = '✓ Config Extracted!';
                        btn.classList.add('bg-green-500', 'hover:bg-green-400');
                        btn.classList.remove('bg-yellow-500', 'hover:bg-yellow-400');
                        setTimeout(() => {
                          btn.textContent = originalText || 'Extract Config';
                          btn.classList.remove('bg-green-500', 'hover:bg-green-400');
                          btn.classList.add('bg-yellow-500', 'hover:bg-yellow-400');
                        }, 2000);
                      }
                    } else {
                      setErrors({ firebase: 'Could not extract valid Firebase configuration. Please ensure you copied the complete code block from Firebase Console.' });
                    }
                  } else {
                    setErrors({ firebase: 'No configuration found to extract. Please paste your Firebase configuration first.' });
                  }
                }}
                className="absolute top-2 right-2 px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded text-sm transition-colors font-semibold"
                data-extract-btn
              >
                Extract Config
              </button>
            </div>
            
            {detectSmartQuotes(firebaseConfig) && !errors.firebase && (
              <div className="flex items-center text-yellow-500 text-sm bg-yellow-900/30 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>Smart quotes detected! Click "Extract Config" to fix automatically.</span>
              </div>
            )}
            
            {errors.firebase && (
              <div className="flex items-start text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{errors.firebase}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    Click the "Extract Config" button above to automatically extract the configuration from your pasted code.
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Email Authorization</h2>
            <p className="text-gray-400">
              Enter the email address that will have access to this app. Only this email will be able to sign in and use the app.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@example.com"
              className="w-full bg-gray-800 text-gray-300 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            {errors.email && (
              <div className="flex items-center text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.email}
              </div>
            )}
            <div className="bg-blue-900/30 p-4 rounded-lg">
              <p className="text-sm text-blue-400">
                <strong>Important:</strong> This email must match the Google account you'll use to sign in.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Security Rules</h2>
            <p className="text-gray-400">
              Copy these rules to your Firebase console to secure your data.
            </p>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Firestore Rules</h3>
                  <button
                    onClick={() => copyToClipboard(firestoreRules, 'firestore')}
                    className="flex items-center px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    {copied.firestore ? <CheckCircle className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copied.firestore ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
                  <code className="text-gray-300">{firestoreRules}</code>
                </pre>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Storage Rules</h3>
                  <button
                    onClick={() => copyToClipboard(storageRules, 'storage')}
                    className="flex items-center px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    {copied.storage ? <CheckCircle className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copied.storage ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
                  <code className="text-gray-300">{storageRules}</code>
                </pre>
              </div>
            </div>

            <div className="bg-yellow-900/30 p-4 rounded-lg">
              <p className="text-sm text-yellow-400">
                <strong>Note:</strong> You can skip this step if you've already configured your Firebase rules.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">ChatGPT API Key</h2>
            <p className="text-gray-400">
              Enter your OpenAI API key for ChatGPT features. This will be encrypted and stored securely in your browser.
            </p>
            <input
              type="password"
              value={chatgptApiKey}
              onChange={(e) => setChatgptApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-gray-800 text-gray-300 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            {errors.chatgptApiKey && (
              <div className="flex items-center text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.chatgptApiKey}
              </div>
            )}
            <div className="bg-green-900/30 p-4 rounded-lg">
              <p className="text-sm text-green-400">
                <strong>Security:</strong> Your API key is encrypted using your browser's unique fingerprint and never leaves your device.
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Perplexity API Key</h2>
            <p className="text-gray-400">
              Enter your Perplexity API key for enhanced search and research features. This will be encrypted and stored securely in your browser.
            </p>
            <input
              type="password"
              value={perplexityApiKey}
              onChange={(e) => setPerplexityApiKey(e.target.value)}
              placeholder="pplx-..."
              className="w-full bg-gray-800 text-gray-300 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            {errors.perplexityApiKey && (
              <div className="flex items-center text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.perplexityApiKey}
              </div>
            )}
            <div className="bg-green-900/30 p-4 rounded-lg">
              <p className="text-sm text-green-400">
                <strong>Security:</strong> Your API key is encrypted using your browser's unique fingerprint and never leaves your device.
              </p>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg">
              <p className="text-sm text-blue-400">
                <strong>How to get your API key:</strong> Visit <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">Perplexity API Settings</a> to generate your API key.
              </p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Validating Configuration</h2>
            <p className="text-gray-400 text-center">
              Testing your connections to ensure everything is set up correctly...
            </p>
            
            {validation.isValidating ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
                <p className="text-gray-400">Validating your configuration...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Firebase Validation Result */}
                <div className={`p-6 rounded-lg border-2 ${
                  validation.firebase.success 
                    ? 'bg-green-900/20 border-green-500/50' 
                    : 'bg-red-900/20 border-red-500/50'
                }`}>
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      validation.firebase.success ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {validation.firebase.success ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Firebase Connection</h3>
                      <p className={`font-medium ${
                        validation.firebase.success ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {validation.firebase.message}
                      </p>
                      {validation.firebase.details && (
                        <p className="text-sm text-gray-400 mt-2">
                          {validation.firebase.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ChatGPT Validation Result */}
                <div className={`p-6 rounded-lg border-2 ${
                  validation.chatgpt.success 
                    ? 'bg-green-900/20 border-green-500/50' 
                    : 'bg-red-900/20 border-red-500/50'
                }`}>
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      validation.chatgpt.success ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {validation.chatgpt.success ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">ChatGPT API Connection</h3>
                      <p className={`font-medium ${
                        validation.chatgpt.success ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {validation.chatgpt.message}
                      </p>
                      {validation.chatgpt.details && (
                        <p className="text-sm text-gray-400 mt-2">
                          {validation.chatgpt.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Perplexity Validation Result */}
                <div className={`p-6 rounded-lg border-2 ${
                  validation.perplexity.success 
                    ? 'bg-green-900/20 border-green-500/50' 
                    : 'bg-red-900/20 border-red-500/50'
                }`}>
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      validation.perplexity.success ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {validation.perplexity.success ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Perplexity API Connection</h3>
                      <p className={`font-medium ${
                        validation.perplexity.success ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {validation.perplexity.message}
                      </p>
                      {validation.perplexity.details && (
                        <p className="text-sm text-gray-400 mt-2">
                          {validation.perplexity.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {validation.firebase.tested && validation.chatgpt.tested && validation.perplexity.tested && (
                  <>
                    <div className={`p-4 rounded-lg text-center ${
                      validation.firebase.success && validation.chatgpt.success && validation.perplexity.success
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-yellow-900/30 text-yellow-400'
                    }`}>
                      {validation.firebase.success && validation.chatgpt.success && validation.perplexity.success ? (
                        <p className="font-semibold">
                          ✨ All connections successful! You're ready to proceed.
                        </p>
                      ) : (
                        <p className="font-semibold">
                          ⚠️ Some connections failed. You can still proceed, but some features may not work.
                        </p>
                      )}
                    </div>
                    
                    {/* Retry button if any validation failed */}
                    {(!validation.firebase.success || !validation.chatgpt.success || !validation.perplexity.success) && (
                      <div className="text-center">
                        <button
                          onClick={runValidation}
                          className="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                        >
                          <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                          Retry Validation
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );

      case 7:
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold">Setup Complete!</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Your Clarity app is now configured and ready to use. Click below to start taking voice notes.
            </p>
            <div className="bg-gray-800 p-4 rounded-lg max-w-md mx-auto">
              <h3 className="font-semibold mb-2">Configuration Summary:</h3>
              <ul className="space-y-2 text-sm text-left">
                <li className="flex items-center space-x-2">
                  {validation.firebase.success ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-green-400">Firebase connected successfully</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-red-400">Firebase connection failed</span>
                    </>
                  )}
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-400">Authorized email: {email}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-400">Security rules configured</span>
                </li>
                <li className="flex items-center space-x-2">
                  {validation.chatgpt.success ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-green-400">ChatGPT API connected successfully</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-red-400">ChatGPT API connection failed</span>
                    </>
                  )}
                </li>
                <li className="flex items-center space-x-2">
                  {validation.perplexity.success ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-green-400">Perplexity API connected successfully</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-red-400">Perplexity API connection failed</span>
                    </>
                  )}
                </li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index <= currentStep ? 'bg-yellow-500' : 'bg-gray-700'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 w-full ${
                    index < currentStep ? 'bg-yellow-500' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step, index) => (
              <span key={index} className={`text-xs ${
                index <= currentStep ? 'text-yellow-500' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-2xl">
          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
                currentStep === 0
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep === 6 && validation.isValidating}
              className={`flex items-center px-6 py-3 rounded-lg transition-colors font-semibold ${
                currentStep === 6 && validation.isValidating
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'
              }`}
            >
              {currentStep === 7 ? 'Start Using Clarity' : 
               currentStep === 6 ? (validation.isValidating ? 'Validating...' : 'Continue') : 
               'Next'}
              {!validation.isValidating && <ArrowRight className="w-4 h-4 ml-2" />}
              {validation.isValidating && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard; 