import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { validateApiKey } from '../services/openai-service';

interface ValidationResult {
  success: boolean;
  message: string;
  details?: string;
}

interface ValidationResults {
  firebase: ValidationResult;
  chatgpt: ValidationResult;
  perplexity: ValidationResult;
}

import type { FirebaseApp } from 'firebase/app';

export const validateFirebaseConnection = async (configString: string): Promise<ValidationResult> => {
  let testApp: FirebaseApp | null = null;
  
  try {
    console.log('Testing Firebase connection...');
    
    // Parse the config
    let config;
    try {
      config = JSON.parse(configString);
    } catch {
      return {
        success: false,
        message: 'Invalid configuration format',
        details: 'The configuration could not be parsed. Please ensure it\'s a valid JSON object.'
      };
    }

    // Check required fields
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        message: 'Missing required fields',
        details: `Your Firebase configuration is missing: ${missingFields.join(', ')}`
      };
    }

    // Try to initialize Firebase
    try {
      // Use a unique name to avoid conflicts
      const testAppName = `test-app-${Date.now()}`;
      testApp = initializeApp(config, testAppName);
    } catch (error) {
      const err = error as Error
      // Check for common errors
      if (err.message?.includes('API key')) {
        return {
          success: false,
          message: 'Invalid API key',
          details: 'The Firebase API key appears to be invalid. Please check your Firebase Console configuration.'
        };
      }
      
      return {
        success: false,
        message: 'Failed to initialize Firebase',
        details: err.message || 'Could not connect to Firebase with the provided configuration.'
      };
    }

    // Try to access Firestore to verify the connection
    try {
      const db = getFirestore(testApp);
      // This will attempt to establish a connection
      const testDoc = doc(db, '_test_', 'connection');
      
      // Try to read (this will fail if project doesn't exist or has issues)
      await getDoc(testDoc).catch((error) => {
        // Check the error type
        if (error.code === 'permission-denied') {
          // This is actually good - means we connected but don't have permissions yet
          throw { code: 'permission-denied', isExpected: true };
        }
        throw error;
      });
      
      // If we get here, read was successful (unlikely without auth)
      return {
        success: true,
        message: 'Firebase connection successful',
        details: 'Successfully connected to your Firebase project.'
      };
    } catch (error) {
      const err = error as { code?: string; message?: string; isExpected?: boolean }
      // Check for specific error types
      if (err.code === 'failed-precondition' || err.message?.includes('Firestore has not been initialized')) {
        return {
          success: false,
          message: 'Firestore not enabled',
          details: 'Please enable Firestore in your Firebase Console: Firebase Console → Build → Firestore Database → Create Database'
        };
              } else if (err.code === 'permission-denied' || err.isExpected) {
        // This is actually good - means we connected but don't have permissions yet
        return {
          success: true,
          message: 'Firebase connection successful',
          details: 'Connected to Firebase. Security rules will be configured in the next step.'
        };
      } else if (err.code === 'unavailable') {
        return {
          success: false,
          message: 'Network error',
          details: 'Could not reach Firebase services. Please check your internet connection and try again.'
        };
      } else if (err.message?.includes('projectId')) {
        return {
          success: false,
          message: 'Invalid project ID',
          details: 'The project ID in your configuration appears to be invalid. Please verify it matches your Firebase project.'
        };
      } else {
        return {
          success: false,
          message: 'Firebase connection failed',
          details: err.message || 'Could not connect to Firebase. Please check your configuration and try again.'
        };
      }
    }
  } catch (error) {
    const err = error as Error
    return {
      success: false,
      message: 'Unexpected error',
      details: err.message || 'An unexpected error occurred while testing the Firebase connection.'
    };
  } finally {
    // Clean up the test app
    if (testApp) {
      try {
        await deleteApp(testApp);
      } catch (error) {
        console.error('Error cleaning up test app:', error);
      }
    }
  }
};

export const validateChatGPTConnection = async (apiKey: string): Promise<ValidationResult> => {
  try {
    console.log('Testing ChatGPT API connection with GPT-4o...');
    const result = await validateApiKey(apiKey);
    
    return {
      success: result.success,
      message: result.message,
      details: result.details
    };
  } catch (error) {
    console.error('ChatGPT API validation error:', error);
    const err = error as Error
    return {
      success: false,
      message: 'Validation failed',
      details: err.message || 'An unexpected error occurred while testing the ChatGPT API connection.'
    };
  }
};

export const validatePerplexityConnection = async (apiKey: string): Promise<ValidationResult> => {
  try {
    console.log('Testing Perplexity API connection...');
    
    if (!apiKey || !apiKey.trim()) {
      return {
        success: false,
        message: 'No API key provided',
        details: 'Please enter your Perplexity API key.'
      };
    }

    if (!apiKey.startsWith('pplx-')) {
      return {
        success: false,
        message: 'Invalid API key format',
        details: 'Perplexity API keys should start with "pplx-". Please check your API key.'
      };
    }

    // Test the API key with a minimal request
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 1
      })
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Perplexity API connection successful',
        details: 'Successfully connected to Perplexity API. Your API key is valid.'
      };
    } else if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: 'Invalid API key',
        details: errorData.error?.message || 'The API key is invalid or has been revoked. Please check your Perplexity account.'
      };
    } else if (response.status === 429) {
      return {
        success: false,
        message: 'Rate limit exceeded',
        details: 'Your API key has exceeded its rate limit. This might indicate the key is valid but has quota issues.'
      };
    } else if (response.status === 403) {
      return {
        success: false,
        message: 'Access forbidden',
        details: 'Your API key does not have access to the requested resource. Please check your Perplexity account permissions.'
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: 'API connection failed',
        details: errorData.error?.message || `Failed to connect to Perplexity API. Status: ${response.status}`
      };
    }
  } catch (error) {
    const err = error as Error
    if (err.name === 'TypeError' && err.message?.includes('fetch')) {
      return {
        success: false,
        message: 'Network error',
        details: 'Could not reach Perplexity API. Please check your internet connection and firewall settings.'
      };
    }
    
    return {
      success: false,
      message: 'Unexpected error',
      details: err.message || 'An unexpected error occurred while testing the Perplexity API connection.'
    };
  }
};

export const validateConfiguration = async (
  firebaseConfig: string,
  chatgptApiKey: string,
  perplexityApiKey: string
): Promise<ValidationResults> => {
  const [firebaseResult, chatgptResult, perplexityResult] = await Promise.all([
    validateFirebaseConnection(firebaseConfig),
    validateChatGPTConnection(chatgptApiKey),
    validatePerplexityConnection(perplexityApiKey)
  ]);

  return {
    firebase: firebaseResult,
    chatgpt: chatgptResult,
    perplexity: perplexityResult
  };
}; 