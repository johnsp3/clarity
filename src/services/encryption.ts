// Simple encryption utilities for securing API keys in localStorage

export const encryptData = (data: string): string => {
  // Simple XOR encryption with fingerprint - for demo purposes
  // In production, use a proper encryption library
  const key = 'clarity-app-secret-key';
  let encrypted = '';
  
  for (let i = 0; i < data.length; i++) {
    encrypted += String.fromCharCode(
      data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  
  return btoa(encrypted); // Base64 encode
};

export const decryptData = (encryptedData: string): string => {
  try {
    const key = 'clarity-app-secret-key';
    const decoded = atob(encryptedData); // Base64 decode
    let decrypted = '';
    
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(
        decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}; 